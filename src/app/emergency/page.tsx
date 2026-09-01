import { LifeBuoy, PhoneCall, Radio, ShieldAlert, Navigation } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function EmergencyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="severe" pulse>
              Emergency Mode
            </Badge>
            <span className="text-xs text-slate-400 font-mono">Disaster Quick Action</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Emergency & Evacuation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            1-tap SOS distress beacon, safe shelter routing, and NER emergency helpline directory.
          </p>
        </div>
      </div>

      {/* SOS Big Action Card */}
      <Card variant="danger" className="text-center p-8 bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950">
        <div className="w-20 h-20 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-rose-600/50 cursor-pointer transition-all hover:scale-105 active:scale-95 border-4 border-rose-400/40 animate-pulse">
          <Radio className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1">Broadcast SOS Distress Beacon</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-5">
          Transmits current GPS coordinates and alert to SDRF/NDRF Quick Response Teams.
        </p>
        <Button variant="danger" size="lg" className="font-bold tracking-wide">
          Activate Emergency SOS
        </Button>
      </Card>

      {/* Emergency Contacts Directory Preview */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>NER Emergency Response Contacts</CardTitle>
            <CardDescription>Direct line to disaster control rooms and mountain rescue units</CardDescription>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "Sikkim State Disaster Management (SSDMA)", phone: "1070 / 03592-201075", area: "Gangtok" },
            { name: "Meghalaya SDMA Control Room", phone: "1077 / 0364-2502098", area: "Shillong" },
            { name: "Assam SDMA 24x7 Helpline", phone: "1079 / 0361-2237221", area: "Guwahati" },
            { name: "NDRF 1st Battalion Control (NER)", phone: "0361-2849005", area: "Patgaon" },
          ].map((contact, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2"
            >
              <div>
                <div className="text-xs font-semibold text-white">{contact.name}</div>
                <div className="text-[11px] text-slate-400">{contact.area}</div>
              </div>
              <a
                href={`tel:${contact.phone.split("/")[0].trim()}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-emerald-400 transition-colors shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{contact.phone.split("/")[0].trim()}</span>
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
