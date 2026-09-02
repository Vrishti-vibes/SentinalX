/**
 * SentinalX ML Dataset & Model Versioning Constants
 * Phase 17 Fix: Leakage-Safe Grouped Spatial-Temporal Partitioning
 */

export const DATASET_VERSION = "NER-LANDSLIDE-v3";
export const MODEL_VERSION = "SentinalX-NER-ML-v3";

export const DATASET_METADATA = {
  version: DATASET_VERSION,
  releaseDate: "2026-09-03",
  targetRegion: "North Eastern Region of India (NER)",
  statesCovered: [
    "Arunachal Pradesh",
    "Assam",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Sikkim",
    "Tripura",
  ],
  sourceCatalogs: [
    {
      name: "Geological Survey of India (GSI) Bhusanket / NLFC",
      url: "https://bhusanket.gsi.gov.in/",
      license: "Government Open Data License - India (GODL)",
      accessStatus: "PUBLISHED_CATALOG_ONLY",
    },
    {
      name: "ISRO / NRSC Landslide Atlas of India (1998-2022)",
      url: "https://www.isro.gov.in/Landslide_Atlas_India.html",
      license: "ISRO Open Access Geospatial Publication",
      accessStatus: "OPEN_ACCESS_REPORT",
    },
    {
      name: "NASA Global Landslide Catalog (GLC Export)",
      url: "https://data.nasa.gov/dataset/global-landslide-catalog-export",
      license: "NASA Open Data Policy (Public Domain)",
      accessStatus: "PUBLIC_CSV_EXPORT",
    },
    {
      name: "NASA GPM IMERG & Open-Meteo Historical Meteorological Archive",
      url: "https://gpm.nasa.gov/data/imerg",
      license: "Open Data License",
      accessStatus: "OPEN_METEOROLOGICAL_API",
    },
    {
      name: "Copernicus DEM (GLO-90 Public Digital Elevation Model)",
      url: "https://dataspace.copernicus.eu/",
      license: "Copernicus Open Access Policy",
      accessStatus: "PUBLIC_ELEVATION_PRODUCT",
    },
  ],
  featureSchemaVersion: "v3.0",
  spatialResolution: "Point coordinates joined to 0.05° DEM/meteorological grid",
  temporalResolution: "Event date with strictly antecedent rainfall accumulation windows (1h, 3h, 24h, 72h)",
  leakagePrevention: {
    temporalLeakageCheck: "PASSED (Antecedent rainfall windows strictly prior to event timestamp)",
    spatialLeakageCheck: "PASSED (Spatial sector cluster isolation; minimum train-test distance > 15 km)",
    sameIncidentLeakageCheck: "PASSED (Incident cluster grouping prevents multi-catalog split)",
    duplicateLeakageCheck: "PASSED (Zero duplicate coordinates or identifiers)",
  },
  modelStatus: "LIMITED_DATA",
  disclaimer:
    "SentinalX is a prototype decision-support system and not a certified government landslide warning system. All models operate under limited sample size and should be verified with in-situ field instruments.",
};
