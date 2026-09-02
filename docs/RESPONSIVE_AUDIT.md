# SentinalX — Responsive Device & Multi-Viewport Audit Report
**Problem Statement**: SIH26001 (AI-Based Early Warning & Landslide Risk Monitoring in NER)  
**Official Brand**: `SentinalX`

---

## 📱 Viewport Target Evaluation Matrix

| Target Viewport | Resolution | AppShell Container | Layout & Navigation Behavior | Status |
|---|---|---|---|---|
| **Mobile** | $390 \times 844\text{ px}$ | Full-width edge-to-edge | Mobile Stitch UI, sticky top header, bottom-fixed BottomNav, zero horizontal overflow | **PASS** |
| **Tablet** | $768 \times 1024\text{ px}$ | Centered Phone Shell ($440\text{px}$) / Expanded Authority ($768\text{px}$) | Clean frame border, shadow depth, readable cards, unconstrained maps | **PASS** |
| **Laptop** | $1366 \times 768\text{ px}$ | Centered Phone Shell ($440\text{px}$) / Wide Authority ($1152\text{px}$) | Ergonomic presentation view, responsive tables, full triage workflows | **PASS** |
| **Large Desktop** | $1920 \times 1080\text{ px}$ | Centered Presentation Shell / Expanded SDMA Console | High-resolution crisp rendering, zero giant SVGs, structured typography | **PASS** |

---

## 🔍 Page-by-Page Visual & Component Audit

```mermaid
graph TD
    subgraph CitizenMobilePortal [Citizen Mobile Portal - AppShell Mockup]
        Monitor["/ (Monitor Home)"]
        Map["/map (GIS Terrain Risk Map)"]
        Routes["/routes (Safe Road Routing)"]
        Shelters["/shelters (Relief Shelters)"]
        Report["/report (Citizen Field Report)"]
        Track["/report/track (Report Tracking)"]
        Alerts["/alerts (Early Warning Bulletins)"]
        Emergency["/emergency (Emergency & SOS Hub)"]
    end

    subgraph AuthorityPortal [SDMA Authority Console - Expanded Desktop/Tablet View]
        Authority["/authority (Command & Incident Triage)"]
    end

    CitizenMobilePortal --> BottomNav[BottomNav: Monitor | Routes | Shelters | Report]
    AuthorityPortal --> CleanLayout[Dedicated Authority Command Header & Grid]
```

### 1. Monitor Home Screen (`/`)
- **Mobile ($390 \times 844$)**: Header bar with diamond logo and LIVE indicator; Risk Score circle ($120\text{px}$ diameter) cleanly centered; factor cards grid in 2-column layout; auxiliary ML intelligence card and live terrain preview properly constrained.
- **Tablet / Laptop / Desktop**: Centered with clean frame; no horizontal scrollbar.

### 2. GIS Terrain Risk Map (`/map`)
- **Mobile ($390 \times 844$)**: Interactive GIS map card ($320\text{px}$ height) with pan/zoom buttons, layer selector, live telemetry status grid, risk legend, and 25 geocoded historical GSI/ISRO landslide points (purple diamond icons).
- **Tablet / Desktop**: Map viewport scales cleanly inside the frame container without clipping.

### 3. Risk-Aware Safe Road Routing (`/routes`)
- **Mobile ($390 \times 844$)**: Topographic map card with live OSRM route line and hazard zone polygon; Route Status card showing distance (`2.8 km`), ETA (`5 min`), step maneuvers list, avoidance warning, and OSM attribution.
- **Tablet / Desktop**: Buttons (`START SAFE ROUTE`, `VIEW SHELTER`) maintain full touch target size ($48\text{px}$ height).

### 4. Relief Shelters (`/shelters`)
- **Mobile ($390 \times 844$)**: Filter pills (`All`, `High Cap`, `Medical`), shelter cards with capacity meters, supply tags, and direct `Get Directions` links to `/routes`.

### 5. Citizen Field Reporting (`/report`)
- **Mobile ($390 \times 844$)**: Form fields for Hazard Type selection, Location GPS picker, Severity rating (1–5 buttons), Description textarea, Photo file upload dropzone, and Submit button. Zero input clipping.

### 6. Incident Lifecycle Tracking (`/report/track`)
- **Mobile ($390 \times 844$)**: Report search bar, tracking summary badge, visual vertical timeline (`SUBMITTED` $\to$ `PENDING_VERIFICATION` $\to$ `RESPONSE_ASSIGNED` $\to$ `RESOLVED`), and assigned response unit details.

### 7. Early Warning Alerts (`/alerts`)
- **Mobile ($390 \times 844$)**: Critical sector bulletin banner, active early warning cards with severity color coding (Red / Orange / Yellow), and prototype multi-channel outbox dispatch logs (SMS/WhatsApp/Siren).

### 8. Emergency Assistance & SOS (`/emergency`)
- **Mobile ($390 \times 844$)**: Red 24x7 emergency badge, 1-tap direct call buttons (`112`, `1078`, `108`), nearby shelter cards, and offline survival checklist.

### 9. SDMA Authority Command Console (`/authority`)
- **Mobile ($390 \times 844$)**: Compact triage cards for pending citizen reports with action buttons (`Verify`, `Assign Team`).
- **Tablet & Desktop ($768\text{px} - 1920\text{px}$)**: Automatically expands into a widescreen Command Console (`max-w-6xl`), featuring split-column layouts for live incident queues, real-time sensor charts, report verification dialogs, and response team assignment workflows.

---

## 🛠️ Responsive Layout Fixes Implemented
1. **Adaptive AppShell**: Configured `src/components/layout/AppShell.tsx` to serve a centered phone presentation shell (`max-w-[440px]`) for citizen screens and an expanded workstation shell (`max-w-6xl`) for the Authority Dashboard.
2. **Bottom Navigation Containment**: Sticky bottom positioning pinned inside the application frame, maintaining isolation from browser-level window stretching.
3. **SVG & Icon Bounds**: All Lucide icons and inline SVG vector paths bound with explicit `w-*` and `h-*` dimensions, preventing SVG scaling blowups.
4. **Touch Targets**: All interactive buttons, tabs, and filter pills exceed the minimum $44 \times 44\text{ px}$ accessibility standard.
