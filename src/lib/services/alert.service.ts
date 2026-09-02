import { AlertRecord, AlertSeverity, AlertType, AlertEvaluateResponse } from "@/types/alert";
import { RiskEngineResult } from "@/types/risk";
import { alertsRepository, PROTOTYPE_ALERT_SOURCE } from "@/lib/db/alerts.repository";
import { notificationService } from "./notification.service";
import { PROTOTYPE_DISCLAIMER } from "./risk.service";

export class AlertService {
  /**
   * Evaluate risk result against transparent thresholds and generate actionable alert if warranted
   */
  async evaluateRiskForAlert(
    riskResult: RiskEngineResult,
    cooldownMinutes: number = 30
  ): Promise<AlertEvaluateResponse> {
    const score = riskResult.score;
    const location = riskResult.location || {
      name: "North Eastern Region",
      state: "NER",
      latitude: 27.586,
      longitude: 91.859,
    };

    const poreScore = riskResult.factors.porePressure.score ?? riskResult.factors.porePressure.normalizedScore;
    const soilScore = riskResult.factors.soilMoisture.score ?? riskResult.factors.soilMoisture.normalizedScore;
    const rainScore = riskResult.factors.rainfall.score ?? riskResult.factors.rainfall.normalizedScore;
    const reportScore = riskResult.factors.fieldReports.score ?? riskResult.factors.fieldReports.normalizedScore;
    const groundScore = riskResult.factors.groundMotion.score ?? riskResult.factors.groundMotion.normalizedScore;

    // 1. Determine Alert Severity based on transparent thresholds
    let severity: AlertSeverity | null = null;
    let alertType: AlertType = "LANDSLIDE_RISK";

    if (score >= 80.0) {
      severity = "CRITICAL";
    } else if (score >= 60.0) {
      severity = "HIGH";
    } else if (score >= 30.0) {
      // Moderate Watch: Generate advisory only if significant triggers exist (e.g. pore pressure or reports)
      const hasSignificantTriggers = poreScore >= 50 || soilScore >= 75 || reportScore >= 50;

      if (hasSignificantTriggers) {
        severity = "WATCH";
      }
    }

    // If score is SAFE (< 30) or MODERATE without significant triggers, no alert is generated
    if (!severity) {
      return {
        success: true,
        alertGenerated: false,
        alert: null,
        riskResult,
        reason: `Risk score (${score.toFixed(1)} / 100) is within baseline range. No emergency alert required.`,
        notificationsQueued: 0,
        disclaimer: PROTOTYPE_DISCLAIMER,
      };
    }

    // 2. Identify Triggered Contributing Factors
    const triggeredBy: string[] = [];
    if (rainScore >= 40) {
      triggeredBy.push(`High 24h Rainfall (${riskResult.factors.rainfall.raw ?? 0} mm)`);
    }
    if (soilScore >= 60) {
      triggeredBy.push(`Elevated Soil Saturation (${riskResult.factors.soilMoisture.raw ?? 0}%)`);
    }
    if (poreScore >= 50) {
      triggeredBy.push(`Elevated Pore Pressure (${riskResult.factors.porePressure.raw ?? 0} kPa)`);
    }
    if (groundScore >= 30) {
      triggeredBy.push(`USGS Seismic Ground Motion Activity`);
    }
    if (reportScore >= 50) {
      triggeredBy.push(`Verified Citizen Field Incidents Logged`);
    }
    if (triggeredBy.length === 0) {
      triggeredBy.push("Multi-source weighted linear threshold exceeded");
    }

    // 3. Deduplication Check (Prevent Alert Spam)
    const existingAlert = await alertsRepository.findRecentActiveAlert(
      location.name,
      alertType,
      severity,
      cooldownMinutes
    );

    if (existingAlert) {
      return {
        success: true,
        alertGenerated: false,
        alert: existingAlert,
        riskResult,
        reason: `An active ${severity} alert already exists for ${location.name} within the ${cooldownMinutes}m cooldown window. Deduplicated.`,
        notificationsQueued: 0,
        disclaimer: PROTOTYPE_DISCLAIMER,
      };
    }

    // 4. Construct Actionable Title and Message
    let title = "";
    let message = "";

    if (severity === "CRITICAL") {
      title = `Critical Landslide Emergency • ${location.name}`;
      message = `Critical landslide risk (${score.toFixed(1)}/100) detected in ${location.name}. High pore pressure and soil saturation indicate imminent slope failure. Avoid affected corridors and immediately move toward designated safe shelters.`;
    } else if (severity === "HIGH") {
      title = `High Landslide Warning • ${location.name}`;
      message = `High landslide risk (${score.toFixed(1)}/100) detected in ${location.name}. Unstable slope conditions along primary mountain roads. Exercise extreme caution, avoid vulnerable cuttings, and follow safe bypass routes.`;
    } else {
      title = `Landslide Watch Advisory • ${location.name}`;
      message = `Moderate landslide watch (${score.toFixed(1)}/100) active in ${location.name}. Moisture infiltration observed. Continue monitoring condition updates and follow local road advisories.`;
    }

    // 5. Create & Persist New Alert
    const newAlert = await alertsRepository.createAlert({
      type: alertType,
      severity,
      title,
      message,
      location: {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      },
      riskScore: score,
      riskLevel: riskResult.level,
      primaryThreat: riskResult.primaryThreat,
      triggeredBy,
      source: PROTOTYPE_ALERT_SOURCE,
    });

    // 6. Queue Multi-Channel Prototype Notifications
    const queuedEvents = notificationService.queueAlertNotifications(newAlert);

    // 7. Auto-Create Prototype Response Candidate for High and Critical Alerts
    if (severity === "HIGH" || severity === "CRITICAL") {
      try {
        const { responseService } = await import("./response.service");
        await responseService.createCandidateFromAlert(newAlert);
      } catch (respErr) {
        console.warn("[AlertService] Could not create response candidate:", respErr);
      }
    }

    return {
      success: true,
      alertGenerated: true,
      alert: newAlert,
      riskResult,
      reason: `New ${severity} alert generated and response workflow candidate queued for ${location.name}.`,
      notificationsQueued: queuedEvents.length,
      disclaimer: PROTOTYPE_DISCLAIMER,
    };
  }
}

export const alertService = new AlertService();
