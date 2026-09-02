# SentinalX — Comprehensive Project Health & Architectural Baseline
**SIH Problem Statement**: SIH26001 (AI-Based Early Warning & Landslide Risk Monitoring in NER)  
**Organization**: Ministry of Development of North Eastern Region (MDoNER)  
**Official Brand**: `SentinalX`

---

## 1. Current System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│               SentinalX Fault-Isolated Ingestion Layer                 │
│                                                                        │
│  Open-Meteo API (LIVE)        │  OSRM / OpenStreetMap (LIVE)           │
│  USGS Seismic FDSN (LIVE)     │  GSI / ISRO Landslide Inventory (VERIFIED)│
│  Copernicus STAC (FALLBACK)   │  In-Situ Geotechnical Grid (DEMO)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Risk Evaluation & Decision-Support Engines                 │
│                                                                        │
│  6-Factor Geotechnical Risk Engine  │  SentinalX-NER-ML-v3 (LIMITED_DATA)│
│  Risk-Aware Road Routing Engine    │  Multi-Channel Notification Outbox│
│  Citizen Field Reporting Hub       │  Incident Verification & Triage   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            Responsive Stitch Portal & Presentation UI                  │
│                                                                        │
│  Monitor (/)          │ GIS Map (/map)       │ Safe Routes (/routes)   │
│  Shelters (/shelters) │ Field Report (/report)│ Track (/report/track)  │
│  Alerts (/alerts)     │ Authority (/authority)│ Emergency (/emergency) │
│  Central Data Health (/api/data-status)                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingested Data Sources & Stream Truth Matrix

| Subsystem | Data Provider | Source Status | Ground Truth Description |
|---|---|---|---|
| **Weather & Rainfall** | Open-Meteo Weather Model | `LIVE` | Model-derived reanalysis and numerical forecast precipitation ($24\text{h}/72\text{h}$ accumulation). |
| **Safe Road Routing** | OpenStreetMap / OSRM | `LIVE` | Live public road graphs with distance, ETA, and turn maneuvers. |
| **Seismic Activity** | USGS Earthquake Hazards API | `LIVE` | Regional seismic event indicator ($300\text{km}$ radius). |
| **Historical Landslides** | GSI Bhusanket, ISRO Atlas, NASA GLC | `VERIFIED_HISTORICAL` | 25 geocoded historical landslide events across all 8 NER states. |
| **Field Incident Reports** | SentinalX Ingestion Pipeline | `LIVE` | Real-time citizen report submission, photo evidence, and status tracking. |
| **In-Situ Sensors** | Geotechnical Telemetry Grid | `DEMO` | Prototype piezometer and tiltmeter simulation. |
| **Satellite Catalog** | Copernicus Data Space (ESA) | `FALLBACK` | Sentinel-1/2 Earth observation product metadata discovery. |
| **Auxiliary ML Predictor** | SentinalX-NER-ML-v3 | `LIMITED_DATA` | Auxiliary tabular ML model ($37$ total samples). |
| **Operational Risk Engine** | 6-Factor Geotechnical Heuristic | `PROTOTYPE` | Transparent heuristic score (Rain 25%, Soil 20%, Pore Pressure 20%, Slope 15%, Seismic 10%, Reports 10%). |

---

## 3. Four-Pillar Machine Learning Leakage Audit

- **Temporal Leakage**: `False` (Rainfall features strictly calculated from antecedent windows before the event timestamp).
- **Spatial Leakage**: `False` (Minimum spatial separation between Train and Test sets is **`23.5 km`**, exceeding the $15.0\text{ km}$ threshold).
- **Same-Incident Leakage**: `False` (Zero cluster overlap across partitions).
- **Duplicate Leakage**: `False` (Zero duplicate coordinate-date entries).
- **Model / Dataset Consistency**: 100% version-aligned across all layers (`NER-LANDSLIDE-v3` & `SentinalX-NER-ML-v3`).

---

## 4. Offline-First Resilience (Phase 13 Compliance)
- **Local Storage Cache**: Caches current risk scores, active routes, shelters, and emergency numbers.
- **Offline Field Reporting**: Unconnected submissions enter an offline queue in `localStorage` and trigger automatic background synchronization upon reconnection (`navigator.onLine === true`).
- **Zero UI Crash**: Seamlessly transitions between `LIVE`, `CACHED`, and `OFFLINE` status without blank screens or unhandled promise rejections.

---

## 5. Production Compilation & Health Metrics

```text
✓ npm run build compiled with exit code 0
✓ 28 static and dynamic Next.js routes generated
✓ Zero TypeScript compiler errors
✓ Zero ESLint syntax errors
✓ 100% brand spelling accuracy: "SentinalX"
✓ All primary UI routes return HTTP 200
✓ All critical API endpoints return HTTP 200
```
