import { NotificationEvent, AlertRecord } from "@/types/alert";

// In-memory outbox for prototype notification events
const notificationOutbox: NotificationEvent[] = [];

export class NotificationService {
  /**
   * Queue multi-channel notifications for an alert (in-app, simulated SMS, simulated Push)
   */
  queueAlertNotifications(alert: AlertRecord): NotificationEvent[] {
    const now = new Date().toISOString();
    const isCritical = alert.severity === "CRITICAL";

    const events: NotificationEvent[] = [
      // 1. In-App Citizen Banner (Available in SentinalX)
      {
        id: `NOTIF-APP-${Date.now()}-1`,
        alertId: alert.id,
        channel: "IN_APP",
        recipientType: "CITIZEN",
        status: "QUEUED",
        title: alert.title,
        message: alert.message,
        targetDestination: `App Broadcast • ${alert.location.name}`,
        createdAt: now,
        simulatedDeliveryNote: "Active broadcast within SentinalX Mobile & Web App.",
      },
      // 2. Simulated Authority Incident Dispatch
      {
        id: `NOTIF-AUTH-${Date.now()}-2`,
        alertId: alert.id,
        channel: "IN_APP",
        recipientType: "AUTHORITY",
        status: "QUEUED",
        title: `[AUTHORITY DISPATCH] ${alert.title}`,
        message: `Priority: ${alert.severity}. Primary threat: ${alert.primaryThreat || "Slope instability"}. Recommended triage in progress.`,
        targetDestination: "District Emergency Operations Center (DEOC)",
        createdAt: now,
        simulatedDeliveryNote: "Routed to SentinalX Authority Response Console.",
      },
      // 3. Simulated SMS Gateway (Prototype)
      {
        id: `NOTIF-SMS-${Date.now()}-3`,
        alertId: alert.id,
        channel: "SMS",
        recipientType: "CITIZEN",
        status: "SIMULATED",
        title: `SENTINALX ALERT: ${alert.severity}`,
        message: `${alert.title}. ${alert.message.slice(0, 120)}... Avoid affected slopes.`,
        targetDestination: `Cell Broadcast Area (${alert.location.name})`,
        createdAt: now,
        simulatedDeliveryNote: "SIMULATED PROTOTYPE: No external telecom gateway configured.",
      },
    ];

    if (isCritical) {
      // Add Simulated Emergency Siren / Push for Critical warnings
      events.push({
        id: `NOTIF-PUSH-${Date.now()}-4`,
        alertId: alert.id,
        channel: "PUSH",
        recipientType: "CITIZEN",
        status: "SIMULATED",
        title: `EMERGENCY ALERT • ${alert.location.name}`,
        message: alert.message,
        targetDestination: "Community Loudspeaker & Citizen Push Tokens",
        createdAt: now,
        simulatedDeliveryNote: "SIMULATED PROTOTYPE: Prototype push notification event.",
      });
    }

    notificationOutbox.unshift(...events);
    return events;
  }

  /**
   * List recent notification events
   */
  listNotifications(limit: number = 50): NotificationEvent[] {
    return notificationOutbox.slice(0, limit);
  }
}

export const notificationService = new NotificationService();
