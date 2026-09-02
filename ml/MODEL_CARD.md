# SentinalX Model Card: SentinalX-NER-ML-v3

## Model Details
- **Model Name**: SentinalX North Eastern Region Landslide Predictor (v3)
- **Model Version**: `SentinalX-NER-ML-v3`
- **Dataset Version**: `NER-LANDSLIDE-v3`
- **Model Type**: Tabular Logistic & Geotechnical Covariate Ensemble with strictly antecedent meteorological windows.
- **Model Status**: `LIMITED_DATA` *(Prototype Research Signal — Not certified for automated disaster warning without human authority review).*
- **Target Geography**: North Eastern Region (NER) of India (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura).
- **Release Date**: 2026-09-03
- **Organization**: SentinalX Geotechnical Intelligence Team

---

## Intended Use
- **Primary Use Case**: Auxiliary machine learning signal providing secondary early-warning confidence alongside the operational 6-factor geotechnical heuristic engine.
- **Out of Scope**: Autonomous decision-making for government disaster evacuations without corroboration from verified SDMA command centers and local geological surveys.

---

## Training & Validation Data Provenance
The model is trained on real, public landslide incident records from:
1. **Geological Survey of India (GSI) Bhusanket / NLFC**: Official disaster compendiums & bulletins.
2. **ISRO / NRSC Landslide Atlas of India (1998–2022)**: Geospatial landslide vulnerability atlas.
3. **NASA Global Landslide Catalog (GLC)**: Open export dataset.
4. **Open-Meteo ERA5-Land Reanalysis Archive**: Hourly meteorological archive used for strictly antecedent rainfall accumulation windows (1h, 3h, 24h, 72h).
5. **Copernicus DEM (GLO-90)**: 90-meter digital elevation model.

### Sample Counts
- **Total Dataset Size**: `37` samples across all 8 NER states.
- **Positive Historical Incidents**: `25` verified landslide events.
- **Matched Negative Controls**: `12` defensible non-event observation windows during verified winter dry spells ($72\text{h rainfall} < 3\text{ mm}$, zero GSI disaster bulletins).

---

## Leakage-Safe Grouped Spatial-Temporal Partitioning
To prevent both temporal lookahead and spatial cross-contamination:
- **Temporal Holdout**: Historical events and controls $\le 2022$ assigned to Training; events and controls $\ge 2023$ assigned to Test.
- **Spatial Sector Clustering**: Specific incident sectors are clustered (`CLUSTER_TAWANG`, `CLUSTER_GANGTOK`, `CLUSTER_SOHRA`, `CLUSTER_NONEY`, etc.).
- **Incident Grouping**: Multi-catalog reports referencing the same physical landslide are strictly bound to the same cluster and partition.
- **Distance Threshold**: $15.0\text{ km}$ minimum spatial buffer.

### Four-Pillar Leakage Audit Results
- **Temporal Leakage**: `False` (Strict antecedent rainfall enforcement).
- **Spatial Leakage**: `False` (Minimum distance between any training and test sample is **`23.5 km`**, exceeding the 15.0 km threshold).
- **Same-Incident Leakage**: `False` (Zero cluster overlap between partitions).
- **Duplicate Leakage**: `False` (Zero duplicate coordinates or identifiers).

### Partition Sample Breakdown
- **Training Set ($\le 2022$)**: `25` samples (`17` Positive Events, `8` Negative Controls)
- **Held-Out Test Set ($\ge 2023$)**: `12` samples (`8` Positive Events, `4` Negative Controls)

---

## Evaluation Metrics (Held-Out Test Set)
- **Precision**: `1.000`
- **Recall**: `1.000`
- **F1 Score**: `1.000`
- **Accuracy**: `1.000`
- **Confusion Matrix**: $\text{TP} = 8$, $\text{FP} = 0$, $\text{TN} = 4$, $\text{FN} = 0$

> [!IMPORTANT]
> **Scientific Honesty Disclaimer**: Validation is limited by the small number of independently observed NER events. High metric values reflect clear separation between extreme monsoon trigger conditions and winter dry baselines in this small dataset, and must NOT be cited as proof of production-grade field accuracy.

---

## Feature Importances
- `rainfall_24h_mm`: **32.0%**
- `rainfall_72h_mm`: **26.0%**
- `soil_moisture_m3m3`: **18.0%**
- `slope_deg`: **14.0%**
- `seismic_indicator`: **6.0%**
- `elevation_m`: **4.0%**

---

## Limitations & Operational Constraints
1. **Validation is limited by the small number of independently observed NER events.**
2. **Micro-Topography**: 90-meter DEM resolution may smooth localized steep road-cut incisions.
3. **Rainfall Source**: ERA5-Land reanalysis provides $0.1^\circ$ (~9km) grid resolution; localized convective cloudbursts require in-situ rain gauges.
4. **Operational Role**: The 6-factor geotechnical heuristic engine remains authoritative for real-time risk scores and alert generation.
