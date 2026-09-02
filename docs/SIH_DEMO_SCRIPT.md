# SentinalX — SIH 2026 Official 5-Minute Live Demo Script
**Problem Statement**: SIH26001 (AI-Based Early Warning & Landslide Risk Monitoring in NER)  
**Organization**: Ministry of Development of North Eastern Region (MDoNER)  
**Official Brand**: `SentinalX`

---

## ⏱️ Exact 5-Minute Timed Presentation Script

```mermaid
timeline
    title 5-Minute Live Demonstration Timeline
    00:00 - 00:30 : Monitor Home Screen & Environmental Ingestion
    00:30 - 01:00 : Geotechnical Risk Breakdown & Auxiliary ML Signal
    01:00 - 01:30 : GIS Terrain Matrix & Historical GSI/ISRO Layer
    01:30 - 02:00 : Public Road Routing & Risk-Aware Route Scoring
    02:00 - 02:40 : Citizen Field Incident Reporting & Live Tracking
    02:40 - 03:10 : Early Warning Alert Outbox & Bulletins
    03:10 - 03:40 : SDMA Authority Command Console & Unit Assignment
    03:40 - 04:00 : Emergency Hub & 1-Tap National Helplines
    04:00 - 04:30 : Low-Network & Offline Resilience (Offline Sync)
    04:30 - 05:00 : Core Value Chain & Conclusion
```

---

### 🕒 00:00 – 00:30 | MONITOR HOME SCREEN
**Screen**: `/`  
**Visual Action**: Show SentinalX header, target location (Tawang Sector), live Open-Meteo precipitation, current risk score pill, and source telemetry health.  
**Spoken Narration**:
> *"Good morning respected judges. This is **SentinalX**, our AI-assisted landslide risk monitoring and early-action platform specifically designed for the North Eastern Region.*  
> *SentinalX combines environmental signals, historical landslide information, and field observations into an explainable prototype risk assessment. Here on the monitor, you see live weather-model precipitation from Open-Meteo alongside antecedent rainfall accumulation for Tawang Sector."*

---

### 🕒 00:30 – 01:00 | RISK INTELLIGENCE & HEURISTIC BREAKDOWN
**Screen**: `/` (Expand "Risk Intelligence" breakdown card)  
**Visual Action**: Point to the 6 factor scores (Rainfall 25%, Soil Moisture 20%, Pore Pressure 20%, Slope 15%, Seismic 10%, Field Reports 10%) and the auxiliary ML badge `LIMITED_DATA (NER-LANDSLIDE-v3)`.  
**Spoken Narration**:
> *"The current operational score is a transparent prototype heuristic computed across six geotechnical factors. Each factor's contribution is fully explainable. Notice that our auxiliary machine learning model, **SentinalX-NER-ML-v3**, is maintained separately as an exploratory research signal under `LIMITED_DATA` status, preventing uncertified model predictions from overriding transparent physical heuristics."*

---

### 🕒 01:00 – 01:30 | GIS MAP & HISTORICAL DATASET
**Screen**: `/map`  
**Visual Action**: Pan across the topographic terrain matrix, in-situ sensor telemetry nodes, active hazard zones, designated shelters, and toggle the **purple diamond markers** representing verified historical landslides.  
**Spoken Narration**:
> *"On the GIS map, we distinguish between active hazard zones and our historical dataset. These purple diamond markers represent 25 verified historical landslide incidents across all 8 NER states, curated from GSI Bhusanket and ISRO Landslide Atlas. We do not confuse historical records with current live hazards."*

---

### 🕒 01:30 – 02:00 | RISK-AWARE PUBLIC ROAD ROUTING
**Screen**: `/routes`  
**Visual Action**: Show the live OpenStreetMap + OSRM road distance (`2.8 km`), ETA (`5 min`), turn maneuvers, route risk score, hazard intersections, and OSM attribution.  
**Spoken Narration**:
> *"Instead of stopping at risk detection, SentinalX connects the risk layer to public road-network routing and ranks route options using a prototype risk overlay.*  
> *Using public OpenStreetMap road graphs via OSRM, the system calculates distance and ETA, checks for hazard intersections, and recommends the safest road bypass corridor around unstable slopes."*

---

### 🕒 02:00 – 02:40 | CITIZEN FIELD REPORTING & TRACKING
**Screen**: `/report` $\to$ `/report/track`  
**Visual Action**: Fill in a demo field report (Hazard: Landslide/Road Blockage on Highway shoulder, Severity: 3), tap **Submit Report**, receive report ID `SX-LS-2049`, and click **Track Report** to view the live timeline.  
**Spoken Narration**:
> *"When ground conditions change, citizens and field workers can submit geo-tagged observations with photos. Once submitted, the citizen receives an instant tracking ID. On the tracking screen, they can monitor the verification lifecycle from `SUBMITTED` to `RESPONSE_ASSIGNED` in real time."*

---

### 🕒 02:40 – 03:10 | ALERT & EARLY WARNING OUTBOX
**Screen**: `/alerts`  
**Visual Action**: Show the active sector evacuation bulletin, affected road corridors, severity warning badge, and simulated SMS/WhatsApp outbox dispatch.  
**Spoken Narration**:
> *"The alert layer converts a risk or verified incident into an actionable operational workflow. It aggregates early-warning bulletins and simulates multi-channel broadcasts across SMS, WhatsApp, and siren systems to notify nearby communities before slope failure occurs."*

---

### 🕒 03:10 – 03:40 | SDMA AUTHORITY COMMAND CONSOLE
**Screen**: `/authority`  
**Visual Action**: Show the pending field report queue, tap **"Verify Report"**, and assign a response unit (e.g. *SDRF Quick Response Unit Alpha* with 15-minute ETA).  
**Spoken Narration**:
> *"On the State Disaster Management Authority dashboard, officers can triage incoming citizen reports, verify evidence against sensor feeds, and assign an operational response team. This maintains an auditable incident lifecycle without claiming unconfigured live military dispatch."*

---

### 🕒 03:40 – 04:00 | EMERGENCY HUB & DIRECT ACCESS
**Screen**: `/emergency`  
**Visual Action**: Show 1-tap direct helpline links (`112`, `1078`, `108`), nearby relief shelters, and offline emergency guidance instructions.  
**Spoken Narration**:
> *"The emergency hub provides direct 1-tap phone access to national helplines like 112, 108, and NDRF, alongside offline first-aid and evacuation guidelines for immediate community safety."*

---

### 🕒 04:00 – 04:30 | OFFLINE RESILIENCE & DATA SYNCHRONIZATION
**Screen**: Open DevTools, toggle **Offline**, refresh `/routes` or `/`, then toggle **Online**.  
**Visual Action**: Show the orange `OFFLINE` badge, demonstrate that cached risk and safe routes remain fully viewable, and show offline field report queuing.  
**Spoken Narration**:
> *"Because connectivity in remote Himalayan terrain can be intermittent or severed during monsoons, SentinalX is built offline-first. Critical cached risk scores, routes, and emergency guidance remain accessible without network, and offline field reports are queued locally to synchronize automatically upon reconnection."*

---

### 🕒 04:30 – 05:00 | FINAL VALUE & CONCLUSION
**Visual Action**: Return to `/` or overview screen.  
**Spoken Narration**:
> *"To summarize: Most disaster monitoring projects stop at detection.*  
> ***SentinalX connects Detection $\to$ Risk $\to$ Alert $\to$ Route $\to$ Report $\to$ Response.***  
> *With live open-data ingestion, transparent four-pillar leakage-free ML, and full offline resilience, SentinalX delivers an end-to-end safety platform for the North Eastern Region. Thank you, we welcome your questions!"*
