# SentinalX

### AI-Based Early Warning and Landslide Risk Monitoring System in NER

**SIH26001 | Smart India Hackathon 2026**  
**Organization:** Ministry of Development of North Eastern Region (MDoNER)  
**Theme:** Disaster Management  
**Category:** Software

---

## 🌐 Overview

**SentinalX** is an AI-assisted landslide risk monitoring and early-warning platform designed for the North Eastern Region (NER) of India.

The platform brings together environmental indicators, terrain information, risk visualization, citizen reports, safe-route guidance, shelter information, and authority workflows into a unified system.

The goal is to help communities and authorities move from **reactive disaster response to proactive risk awareness and early action**.

---

## 🎯 Problem

The North Eastern Region is highly vulnerable to landslides due to factors such as:

- Heavy and prolonged rainfall
- Steep and unstable terrain
- Soil and geological conditions
- Road-cutting and infrastructure development
- Remote and difficult-to-access areas
- Limited connectivity in vulnerable locations
- Delays in communicating ground-level incidents

A practical solution needs to combine risk information with **clear, actionable information for both citizens and authorities**.

---

## 💡 Our Solution

SentinalX provides a unified workflow for:

1. **Risk Monitoring**
   - Monitor regional landslide risk
   - Display risk levels and environmental indicators
   - Highlight vulnerable corridors and locations

2. **Early Warning**
   - Present high-risk areas and active alerts
   - Support timely warnings for affected regions
   - Enable users to understand current hazard conditions

3. **GIS-Based Risk Visualization**
   - Interactive risk maps
   - Hazard locations
   - Roads and vulnerable corridors
   - Location-based situational awareness

4. **Citizen Field Reporting**
   - Report landslides, flooding and road blockages
   - Capture location and severity
   - Upload field photographs
   - Track submitted reports

5. **Safe Route & Shelter Guidance**
   - Identify safer routes
   - Provide route information
   - Display nearby shelters
   - Show shelter availability

6. **Authority Response**
   - Centralized dashboard
   - Live risk visualization
   - Citizen incident reports
   - Response-oriented situational awareness

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────┐
│              Data Sources                    │
│                                              │
│ Rainfall │ Soil Moisture │ Satellite │ GIS   │
│ Terrain  │ Historical Data │ Field Reports   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│          Risk Assessment & AI/ML             │
│                                              │
│ Feature Processing │ Risk Scoring │ Alerts   │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│              SentinalX Platform              │
│                                              │
│ Risk Monitor │ GIS Map │ Alerts │ Reports    │
│ Safe Routes  │ Shelters │ Tracking            │
└───────────────┬──────────────────┬───────────┘
                │                  │
                ▼                  ▼
       ┌────────────────┐  ┌─────────────────┐
       │    Citizens    │  │   Authorities   │
       │                │  │                 │
       │ Alerts         │  │ Risk Dashboard  │
       │ Safe Routes    │  │ Live Map        │
       │ Shelters       │  │ Field Reports   │
       │ Field Reports  │  │ Response Flow   │
       └────────────────┘  └─────────────────┘

📱 Current MVP

The current MVP demonstrates the core citizen-facing workflow:

Monitor / Home
Safe Route
Shelters
Field Report
Report Submitted
Track Report
Emergency Contacts
Alerts

The project also includes the foundation for:

Authority Dashboard
Live Risk Map
Risk and alert datasets
Reusable UI components
Mock data layer
🔄 Citizen Workflow
Monitor Risk
     ↓
View Warning / Hazard
     ↓
Find Safe Route
     ↓
Check Nearby Shelter
     ↓
Report Ground Situation
     ↓
Receive Report ID
     ↓
Track Response
🛠️ Technology Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Lucide Icons
Mapping & Visualization
GIS-based map interface
Interactive risk visualization
Location-based workflows
Data & Application Layer
Structured mock datasets for MVP
Modular data layer
Reusable components
Risk and incident data models
Development
Google Stitch — UI/prototype design
Google Antigravity — implementation and testing
Git & GitHub — version control
📂 Project Structure
SentinalX/
│
├── src/
│   ├── app/
│   │   ├── alerts/
│   │   ├── authority/
│   │   ├── emergency/
│   │   ├── map/
│   │   ├── report/
│   │   │   └── track/
│   │   ├── routes/
│   │   ├── shelters/
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── data/
│   │   └── mock/
│   │
│   ├── lib/
│   └── types/
│
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
🚀 Getting Started
Prerequisites

Make sure you have:

Node.js installed
npm installed
Git installed
Installation

Clone the repository:

git clone https://github.com/Vrishti-vibes/SentinalX.git

Move into the project directory:

cd SentinalX

Install dependencies:

npm install

Run the development server:

npm run dev

Open:

http://localhost:3000
🧪 Build Verification

The current MVP has been build-verified using:

npm run build

The implemented application routes compile successfully.

## 📊 Live Data Status & Scientific Provenance

| Data Stream | Provider / Source | Status | Description |
|---|---|---|---|
| **Weather & Rainfall** | Open-Meteo API | `LIVE` | Real-time precipitation and antecedent 24h/72h rainfall |
| **Safe Road Routing** | OpenStreetMap / OSRM | `LIVE` | Real road network routing with SentinalX risk layer overlay |
| **Historical Landslides** | GSI Bhusanket, ISRO Atlas, NASA GLC | `VERIFIED` | 25 verified NER events across all 8 states (`NER-LANDSLIDE-v3`) |
| **Auxiliary ML Predictor** | SentinalX-NER-ML-v3 | `LIMITED_DATA` | Tabular logistic & covariate ensemble (Auxiliary research signal) |
| **Geotechnical Risk** | 6-Factor Operational Engine | `PROTOTYPE` | Transparent heuristic score (Rain 25%, Soil 20%, Pore Pressure 20%, Slope 15%, Seismic 10%, Reports 10%) |
| **Seismic Indicator** | USGS Earthquake API | `LIVE` | 7-day regional seismic event monitoring |
| **Satellite Catalog** | Copernicus Data Space (ESA) | `FALLBACK` | Sentinel-1/2 Earth observation catalog metadata |
| **In-Situ Sensors** | Geotechnical Telemetry Grid | `DEMO` | Prototype piezometer, tiltmeter, and soil moisture sensor nodes |

---

## 🔐 Safety & Responsible AI Disclaimers

- **Decision-Support Prototype**: SentinalX is designed as a disaster intelligence decision-support platform, not as a replacement for official state disaster management authorities (SDMA/NDMA).
- **ML Transparency**: Machine learning predictions operate under `LIMITED_DATA` status ($37$ real samples) with a documented four-pillar leakage audit (temporal, spatial, incident, and duplicate leakage all `False`).
- **No Fabricated Telemetry**: In-situ sensor readings and satellite displacement data are transparently labeled as `DEMO` or `METADATA` when live physical sensors are not connected.

---

👥 Team — SentinalX

Smart India Hackathon 2026

Team members:

Kumari Vrishti — Team Leader
Nikita Nagar
Shreya Nagar
Santosh Kumar Yadav
Aryan Chandra
Harshvardhan Rana
📌 SIH Problem Statement

SIH26001 — AI-Based early warning and landslide Risk Monitoring System in NER

Organization: Ministry of Development of North Eastern Region (MDoNER)

Theme: Disaster Management

📄 Project Status

Current Status: Working MVP / Prototype

The repository contains the current implementation of the SentinalX disaster-risk monitoring interface and core citizen workflows.

⭐ Vision

Detect earlier. Warn smarter. Respond faster.

SentinalX — Turning landslide risk intelligence into actionable safety.
