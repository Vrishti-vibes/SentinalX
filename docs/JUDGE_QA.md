# SentinalX — SIH 2026 Judge Q&A Defense Guide
**Problem Statement**: SIH26001 (AI-Based Early Warning & Landslide Risk Monitoring in NER)  
**Official Brand**: `SentinalX`

---

## 🏛️ Comprehensive Technical & Operational Q&A (30 Questions)

### 1. What is SentinalX?
**Answer**: SentinalX is an AI-assisted landslide risk monitoring, early-warning, and response orchestration platform designed specifically for the complex terrain and rainfall patterns of the North Eastern Region of India.

### 2. What problem does it solve?
**Answer**: Current disaster monitoring systems often stop at raw hazard detection or delayed weather forecasts. SentinalX bridges the critical gap between detection and ground-level action by connecting environmental ingestion to risk scoring, automated alerts, safe road routing, citizen field verification, and authority triage.

### 3. Why is this needed specifically in NER?
**Answer**: NER has the highest landslide density in India due to steep young Himalayan topography, heavy monsoon downpours, seismic activity, active road infrastructure expansion, and frequent communication blackouts. A resilient, offline-capable platform tailored to NER is essential.

### 4. What data sources are used?
**Answer**:
1. **Weather & Rainfall**: Open-Meteo numerical weather model and reanalysis API (`LIVE`).
2. **Road Graphs**: OpenStreetMap road network via public OSRM engine (`LIVE`).
3. **Seismic Activity**: USGS Earthquake Hazards FDSN API (`LIVE`).
4. **Historical Landslides**: Geological Survey of India (GSI Bhusanket), ISRO Landslide Atlas, NASA Global Landslide Catalog (`VERIFIED_HISTORICAL`).
5. **Terrain & Elevation**: Copernicus DEM GLO-90 open global elevation data.
6. **In-Situ Sensors**: Sub-surface pore pressure, tiltmeter, and piezometer grid (`DEMO`).
7. **Citizen Reports**: Geo-tagged field incident reports (`LIVE`).

### 5. Is your rainfall data real?
**Answer**: Yes, precipitation and antecedent accumulation ($24\text{h}$ and $72\text{h}$) are fetched in real time via the Open-Meteo weather model API for the target coordinate. We clearly document that this is model-derived reanalysis and numerical forecast data, not a direct physical AWS rain gauge.

### 6. Is your sensor data real?
**Answer**: In the current prototype stage, in-situ sub-surface sensors (hydrostatic pore pressure, tiltmeters) use realistic simulated telemetry profiles from our internal sensor repository. We transparently mark this stream as `DEMO` in our data-status telemetry.

### 7. Is your satellite data live?
**Answer**: No. We connect to the ESA Copernicus Data Space STAC catalog to discover Sentinel-1/2 products matching the target sector's bounding box and acquisition windows. We transparently classify this stream as `FALLBACK / METADATA` and do not claim live optical or InSAR displacement processing.

### 8. Is your ML model real?
**Answer**: Yes. `SentinalX-NER-ML-v3` is a genuine tabular machine learning model trained using Scikit-Learn on $37$ real, geocoded historical landslide and non-landslide control points across all 8 NER states. It runs inference both on the backend and in TypeScript for client resilience.

### 9. Why only 37 samples?
**Answer**: We strictly adhere to scientific data honesty. Rather than generating synthetic fake labels, we curated $25$ positively verified landslide occurrences from official GSI and ISRO publications across Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura, plus $12$ matched negative control points. We explicitly label the model as `LIMITED_DATA`.

### 10. Why do you show 1.0 test metrics in some validation runs?
**Answer**: On small, well-separated tabular datasets with strong physical discriminators (e.g. $24\text{h}$ rainfall $> 75\text{ mm}$ and slope $> 30^\circ$), simple classifiers can achieve perfect separation on a held-out test fold. However, we do not claim this represents real-world perfection, which is why we retain the `LIMITED_DATA` badge and prioritize the 6-factor heuristic as the primary operational engine.

### 11. How did you prevent data leakage?
**Answer**: We implemented a rigorous **Four-Pillar Leakage Audit**:
1. **Temporal Leakage (`False`)**: Rainfall features strictly use antecedent windows ($t_{-24\text{h}}, t_{-72\text{h}}$) before the incident date.
2. **Spatial Leakage (`False`)**: Partitioned by incident clusters with a minimum spatial buffer of **`23.5 km`** between training and test sets (exceeding our $15.0\text{ km}$ threshold).
3. **Same-Incident Leakage (`False`)**: Zero cluster ID overlap across splits.
4. **Duplicate Leakage (`False`)**: Verified zero duplicate coordinate-date pairs.

### 12. What is novel compared with GSI/ISRO?
**Answer**: GSI and ISRO provide macro-scale regional susceptibility maps and historical landslide atlases. SentinalX operationalizes this by dynamically combining live weather with historical susceptibility, citizen field observations, live OpenStreetMap road network routing, and offline evacuation workflows for local responders.

### 13. Is your risk prediction certified?
**Answer**: No. SentinalX is an engineering prototype and decision-support tool. It is clearly labeled as a `PROTOTYPE RISK ENGINE` and does not replace official meteorological warnings from IMD or alerts from NDMA/SDMA.

### 14. How is the risk score calculated?
**Answer**: The operational risk score is computed as a weighted heuristic (0–100 scale):
$$\text{Score} = (0.25 \times \text{Rain}) + (0.20 \times \text{Soil}) + (0.20 \times \text{Pore Pressure}) + (0.15 \times \text{Slope}) + (0.10 \times \text{Seismic}) + (0.10 \times \text{Field Reports})$$

### 15. Why these weights?
**Answer**: In geotechnical engineering (infinite slope stability analysis), hydrostatic pore pressure and antecedent rainfall saturation are the primary triggers of slope failure, while steep slope morphology is the primary predisposing condition. Seismic acceleration and ground field reports act as secondary accelerating triggers.

### 16. What happens if one data source fails?
**Answer**: Every provider adapter is fault-isolated using `Promise.allSettled`. If Open-Meteo or OSRM times out, the system automatically falls back to cached values or verified sector baselines (`DEMO_FALLBACK`) without crashing the application or showing blank screens.

### 17. How does offline mode work?
**Answer**: SentinalX uses a client-side offline architecture (`localStorage` / `IndexedDB`). Cached risk maps, safe routes, shelters, and emergency numbers remain fully accessible when `navigator.onLine === false`. New field reports are queued locally in an offline outbox and automatically synchronized upon network reconnection.

### 18. How does safe routing work?
**Answer**: The system queries the public OpenStreetMap road graph via OSRM to generate candidate driving routes. It then evaluates the route coordinates against active hazard zones and verified blockage reports to calculate a risk penalty score:
$$\text{Route Score} = \text{ETA (min)} + (\text{Exposure} \times 1.5) + (\text{Intersections} \times 25) + (\text{Road Blocked} \times 500)$$
The route with the lowest penalty is recommended as the safest viable road bypass corridor.

### 19. Is the route officially safe?
**Answer**: No. It is a **Risk-Aware Prototype Route** based on public road network topology and our risk layer overlay. It is not an official government-certified evacuation corridor.

### 20. How do you identify blocked roads?
**Answer**: When a citizen or field worker submits a field report of type `Road Blockage` or `Landslide` that is verified by authorities, any candidate route passing within $300\text{m}$ of that location is flagged with `roadBlocked = true`, triggering immediate re-routing.

### 21. How are false citizen reports handled?
**Answer**: New citizen submissions enter the system with status `PENDING_VERIFICATION`. They do not block routes or trigger high-level evacuation alerts until verified by an authorized officer on the SDMA Authority console.

### 22. How does authority verification work?
**Answer**: On the `/authority` dashboard, disaster management officers review incoming reports, compare them against localized sensor telemetry and satellite metadata, verify the observation, and assign an operational response team.

### 23. Does it actually dispatch SDRF/NDRF?
**Answer**: No. The response assignment feature demonstrates an end-to-end incident management workflow within the application. It does not claim direct API integration with military or government dispatch systems.

### 24. What happens if AI prediction is wrong?
**Answer**: Because SentinalX treats the ML model strictly as an auxiliary signal (`LIMITED_DATA`), operational decisions are driven by the deterministic 6-factor geotechnical heuristic. A false positive or negative in the ML layer will not override physical sensor thresholds or verified field observations.

### 25. Can this scale to all NER states?
**Answer**: Yes. Our historical dataset already covers all 8 NER states, our weather ingestion is geocoded globally via latitude/longitude coordinates, and OpenStreetMap covers the entire road network of North East India.

### 26. What is the biggest current limitation?
**Answer**: The sample size of publicly verified landslide events ($37$ records) and the lack of live physical sensor hardware connected in the field.

### 27. What would you build with government access?
**Answer**: With MDoNER / SDMA collaboration, we would integrate direct IMD automatic weather station feeds, GSI real-time geological borehole sensors, live InSAR satellite ground deformation data, and an official SMS gateway for CAP (Common Alerting Protocol) warnings.

### 28. How would you deploy real IoT sensors?
**Answer**: By deploying low-cost LoRaWAN mesh networks on vulnerable slopes equipped with vibrating wire piezometers, MEMS tiltmeters, and capacitive soil moisture probes, transmitting telemetry to a solar-powered base station connected to SentinalX via satellite uplink or 4G.

### 29. How would you improve the ML dataset?
**Answer**: By digitizing multi-decade regional disaster registries from state revenue and disaster management departments, incorporating high-resolution Sentinel-1 InSAR coherence time series, and scaling the negative control sampling across diverse geological formations.

### 30. What is the next production step?
**Answer**: Conducting field pilot testing along high-risk transport corridors (e.g. NH-13 in Arunachal Pradesh and NH-10 in Sikkim) in partnership with district disaster management authorities and local community volunteer networks.
