"use client";

import React from "react";
import { ExternalLink, Database, Shield, FileText } from "lucide-react";
import { DATASET_METADATA } from "@/lib/ml/dataset-version";

export function DataSources() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Authoritative Public Data Sources &amp; Attribution
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          {DATASET_METADATA.version}
        </span>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        SentinalX is grounded in verified public domain and government open geospatial datasets covering the North Eastern Region of India (NER).
      </p>

      <div className="space-y-2 pt-1">
        {DATASET_METADATA.sourceCatalogs.map((src, i) => (
          <div
            key={i}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{src.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                License: {src.license}
              </div>
            </div>
            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              title="View source portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      <div className="pt-1 text-[10px] text-slate-400 font-medium">
        <span>Attribution Notice: All referenced catalogs retain original government and institutional intellectual property and open data rights.</span>
      </div>
    </div>
  );
}
