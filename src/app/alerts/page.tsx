import { BellRing, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_ALERTS } from "@/data/mock/alerts.mock";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="severe" pulse>
              Live Warnings
            </Badge>
            <span className="text-xs text-slate-400 font-mono">AI Threat Assessment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Early Warning & Alert Feed
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time multi-hazard alerts generated from geotechnical sensor thresholds & antecedent precipitation.
          </p>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-4">
        {MOCK_ALERTS.map((alert) => (
          <Card
            key={alert.id}
            variant={
              alert.riskLevel === "SEVERE"
                ? "danger"
                : alert.riskLevel === "HIGH"
                ? "warning"
                : "default"
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge riskLevel={alert.riskLevel} pulse={alert.riskLevel === "SEVERE"}>
                    {alert.riskLevel} ALERT
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{alert.id}</span>
                  <span className="text-xs text-slate-400">• {alert.timestamp}</span>
                </div>
                <h3 className="text-base font-bold text-white">{alert.title}</h3>
                <p className="text-xs text-emerald-400 font-medium">
                  {alert.location} ({alert.state})
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">AI Risk Score</div>
                <div className="text-lg font-mono font-bold text-white">
                  {(alert.probabilityScore * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed my-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {alert.summary}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-850 text-xs">
              <div className="text-slate-300">
                <span className="font-semibold text-slate-400">Recommended Action:</span>{" "}
                {alert.recommendedAction}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm">
                  View Corridor
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
