import { Building2, Radio, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_REPORTS } from "@/data/mock/reports.mock";

export default function AuthorityPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="moderate">Authority Console</Badge>
            <span className="text-xs text-slate-400 font-mono">Disaster Management Ops</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Authority Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            District Collector & SDMA triage center: report verification, CAP alert dispatch, and unit coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="danger" size="sm" className="gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>Compose Broadcast</span>
          </Button>
        </div>
      </div>

      {/* Citizen Report Triage Queue */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Incoming Citizen Hazard Reports</CardTitle>
            <CardDescription>Review crowd-sourced ground truth submissions requiring verification</CardDescription>
          </div>
          <Badge variant="subtle">{MOCK_REPORTS.length} Reports in Queue</Badge>
        </CardHeader>

        <div className="divide-y divide-slate-850">
          {MOCK_REPORTS.map((report) => (
            <div
              key={report.id}
              className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-300">
                    {report.id}
                  </span>
                  <Badge
                    variant={
                      report.status === "DISPATCHED"
                        ? "severe"
                        : report.status === "VERIFIED"
                        ? "moderate"
                        : "subtle"
                    }
                  >
                    {report.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-slate-400">• {report.reportedAt}</span>
                </div>
                <div className="text-sm font-medium text-white">{report.locationName}</div>
                <p className="text-xs text-slate-300">{report.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm">
                  Review Data
                </Button>
                <Button variant="primary" size="sm">
                  Verify & Dispatch
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
