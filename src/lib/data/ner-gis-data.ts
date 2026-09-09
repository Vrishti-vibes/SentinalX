import { NerLocationItem } from '@/types/gis-map';
export type { NerLocationItem };

export interface NerRiskZone {
  id: string;
  name: string;
  state: string;
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  fos: number;
  saturation: string;
  color: string;
  fillColor: string;
  coordinates: [number, number][];
  description: string;
}

export interface NerIncident {
  id: string;
  location: string;
  state: string;
  hazardType: string;
  risk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY HIGH';
  riskScore: number;
  rainfall: number;
  soilMoisture: number;
  road: string;
  status: 'RESTRICTED' | 'PASSABLE' | 'CLOSED' | 'CAUTION';
  latLng: [number, number];
  description: string;
  timestamp: string;
  actionText: string;
  actionHref: string;
}

export interface NerRoadCorridor {
  id: string;
  name: string;
  highway: string;
  state: string;
  status: 'PASSABLE' | 'RESTRICTED' | 'CLOSED' | 'CAUTION';
  color: string;
  dashArray?: string;
  weight: number;
  coordinates: [number, number][];
  description: string;
  speedKmH: number;
}

export interface NerShelter {
  id: string;
  name: string;
  location: string;
  state: string;
  address: string;
  latLng: [number, number];
  capacity: number;
  currentOccupancy: number;
  supplies: string;
  status: 'OPEN' | 'FULL' | 'STANDBY';
  elevation: string;
  roadAccess: string;
  isSafe: boolean;
}

export interface NerSensorNode {
  id: string;
  name: string;
  state: string;
  subCode: string;
  latLng: [number, number];
  porePressure: string;
  tiltAngle: string;
  rainfall24h: number;
  soilMoisture: string;
  fos: number;
  batteryLevel: number;
  status: 'ONLINE' | 'STANDBY' | 'WARNING';
  lastPing: string;
}

// 8 NER States + Regional Overview + Common Cities
export const NER_LOCATIONS: NerLocationItem[] = [
  {
    id: 'ner',
    name: 'North Eastern Region (NER Overview)',
    state: 'All 8 NER States',
    latLng: [26.2006, 92.9376],
    zoom: 7,
    riskScore: 58,
    riskLevel: 'MODERATE',
    rainfall: 86.4,
    soilMoisture: 74,
    groundMovement: 'Baseline / Localized Creep',
    slopeStability: 'Variable by Sector',
    activeIncidents: 14,
    affectedRoads: 5,
    nearbyShelters: 42,
    primaryRoad: 'NER Strategic Highway Grid',
    roadStatus: 'PARTIAL RESTRICTIONS',
    description: 'Regional multi-state disaster surveillance grid spanning Sikkim, Arunachal Pradesh, Assam, Meghalaya, Nagaland, Manipur, Mizoram, and Tripura.'
  },
  {
    id: 'gangtok',
    name: 'Gangtok / East Sikkim',
    state: 'Sikkim',
    latLng: [27.3314, 88.6138],
    zoom: 13,
    riskScore: 78,
    riskLevel: 'HIGH',
    rainfall: 142.5,
    soilMoisture: 82,
    groundMovement: 'Elevated (Inclinometer 2.8 mm/day)',
    slopeStability: 'Critical FoS 0.88 (Failure Prone)',
    activeIncidents: 6,
    affectedRoads: 2,
    nearbyShelters: 3,
    primaryRoad: 'NH-10',
    roadStatus: 'RESTRICTED',
    description: 'Steep phyllite and schist slopes in Teesta Valley subjected to severe continuous monsoon downpours and river toe undercutting.'
  },
  {
    id: 'tawang',
    name: 'Tawang Sector',
    state: 'Arunachal Pradesh',
    latLng: [27.587, 91.860],
    zoom: 13,
    riskScore: 84,
    riskLevel: 'VERY HIGH',
    rainfall: 168.0,
    soilMoisture: 91,
    groundMovement: 'Severe Shear Creep (4.1 mm/day)',
    slopeStability: 'Unstable FoS 0.82',
    activeIncidents: 5,
    affectedRoads: 3,
    nearbyShelters: 4,
    primaryRoad: 'NH-13 (Trans-Arunachal)',
    roadStatus: 'RESTRICTED',
    description: 'High-altitude sub-Himalayan periglacial terrain with heavy saturation from antecedent snowfall melt and monsoon cloudbursts.'
  },
  {
    id: 'guwahati',
    name: 'Guwahati Metropolitan',
    state: 'Assam',
    latLng: [26.1445, 91.7362],
    zoom: 12,
    riskScore: 28,
    riskLevel: 'LOW',
    rainfall: 32.0,
    soilMoisture: 52,
    groundMovement: 'Stable',
    slopeStability: 'Stable FoS 1.48',
    activeIncidents: 1,
    affectedRoads: 0,
    nearbyShelters: 8,
    primaryRoad: 'NH-27 (East-West Corridor)',
    roadStatus: 'PASSABLE',
    description: 'Brahmaputra alluvial terrace with low slope angles; localized moderate hazard on southern granite residual hills.'
  },
  {
    id: 'shillong',
    name: 'Shillong / East Khasi Hills',
    state: 'Meghalaya',
    latLng: [25.5788, 91.8933],
    zoom: 13,
    riskScore: 66,
    riskLevel: 'MODERATE',
    rainfall: 112.0,
    soilMoisture: 77,
    groundMovement: 'Moderate Infiltration',
    slopeStability: 'Marginal FoS 1.15',
    activeIncidents: 3,
    affectedRoads: 1,
    nearbyShelters: 6,
    primaryRoad: 'NH-06',
    roadStatus: 'CAUTION',
    description: 'High plateau quartzitic terrain experiencing steep roadside slumping along Shillong-Cherrapunji escarpment cuts.'
  },
  {
    id: 'aizawl',
    name: 'Aizawl Urban Slope',
    state: 'Mizoram',
    latLng: [23.7271, 92.7176],
    zoom: 13,
    riskScore: 81,
    riskLevel: 'VERY HIGH',
    rainfall: 138.0,
    soilMoisture: 86,
    groundMovement: 'Active Creep (Hunthar Corridor)',
    slopeStability: 'Critical FoS 0.91',
    activeIncidents: 4,
    affectedRoads: 2,
    nearbyShelters: 5,
    primaryRoad: 'NH-54 / NH-02',
    roadStatus: 'RESTRICTED',
    description: 'North-south trending anticlinal sandstone-shale ridge with extensive overburden prone to deep-seated rotational slides.'
  },
  {
    id: 'kohima',
    name: 'Kohima / Zubza Basin',
    state: 'Nagaland',
    latLng: [25.6751, 94.1086],
    zoom: 13,
    riskScore: 74,
    riskLevel: 'HIGH',
    rainfall: 104.0,
    soilMoisture: 79,
    groundMovement: 'Continuous Slump Sinking',
    slopeStability: 'Unstable FoS 1.03',
    activeIncidents: 3,
    affectedRoads: 1,
    nearbyShelters: 4,
    primaryRoad: 'NH-29',
    roadStatus: 'CAUTION',
    description: 'Disang shales subject to rapid slaking and severe weathering, triggering recurring subsiding highway sinkholes.'
  },
  {
    id: 'itanagar',
    name: 'Itanagar Capital Complex',
    state: 'Arunachal Pradesh',
    latLng: [27.0844, 93.6053],
    zoom: 13,
    riskScore: 54,
    riskLevel: 'MODERATE',
    rainfall: 88.0,
    soilMoisture: 71,
    groundMovement: 'Minor Seepage',
    slopeStability: 'Moderate FoS 1.28',
    activeIncidents: 2,
    affectedRoads: 1,
    nearbyShelters: 5,
    primaryRoad: 'NH-415',
    roadStatus: 'PASSABLE',
    description: 'Siwalik sedimentary foothills prone to shallow mudslides during intense cloudburst episodes.'
  },
  {
    id: 'agartala',
    name: 'Agartala / Baramura Hills',
    state: 'Tripura',
    latLng: [23.8315, 91.2868],
    zoom: 12,
    riskScore: 36,
    riskLevel: 'LOW',
    rainfall: 45.0,
    soilMoisture: 58,
    groundMovement: 'Stable',
    slopeStability: 'Stable FoS 1.39',
    activeIncidents: 1,
    affectedRoads: 0,
    nearbyShelters: 7,
    primaryRoad: 'NH-08',
    roadStatus: 'PASSABLE',
    description: 'Low-relief undulating hillocks; stable urban basin with localized gully erosion in Baramura pass cuttings.'
  },
  {
    id: 'imphal',
    name: 'Imphal / Jiribam Corridor',
    state: 'Manipur',
    latLng: [24.8170, 93.9368],
    zoom: 13,
    riskScore: 76,
    riskLevel: 'HIGH',
    rainfall: 126.0,
    soilMoisture: 84,
    groundMovement: 'Active Hill Cut Displacement',
    slopeStability: 'Unstable FoS 0.96',
    activeIncidents: 4,
    affectedRoads: 2,
    nearbyShelters: 4,
    primaryRoad: 'NH-37',
    roadStatus: 'RESTRICTED',
    description: 'Tertiary fold belt along Barak basin with chronic slope failures cutting off arterial supply lines to Imphal valley.'
  },
  {
    id: 'haflong',
    name: 'Haflong / Dima Hasao',
    state: 'Assam',
    latLng: [25.1764, 93.0182],
    zoom: 13,
    riskScore: 79,
    riskLevel: 'HIGH',
    rainfall: 135.0,
    soilMoisture: 83,
    groundMovement: 'Railway Embankment Creep',
    slopeStability: 'Critical FoS 0.94',
    activeIncidents: 3,
    affectedRoads: 2,
    nearbyShelters: 3,
    primaryRoad: 'NH-27 / Haflong Hill Highway',
    roadStatus: 'RESTRICTED',
    description: 'Barail range sedimentary strata highly prone to mass wasting, debris flows, and railway foundation subsidence.'
  },
  {
    id: 'cherrapunji',
    name: 'Cherrapunji (Sohra) Rim',
    state: 'Meghalaya',
    latLng: [25.2986, 91.7314],
    zoom: 13,
    riskScore: 82,
    riskLevel: 'VERY HIGH',
    rainfall: 195.0,
    soilMoisture: 93,
    groundMovement: 'Torrential Washout & Escarpment Runoff',
    slopeStability: 'Critical FoS 0.89',
    activeIncidents: 3,
    affectedRoads: 1,
    nearbyShelters: 3,
    primaryRoad: 'SH-05 (Sohra-Shella)',
    roadStatus: 'RESTRICTED',
    description: 'Southern escarpment facing Bangladesh plains receiving extreme orographic precipitation with massive gorge wall failures.'
  }
];

// Geographically Distributed 4-Tier Landslide Risk Zones Across NER
export const NER_RISK_ZONES: NerRiskZone[] = [
  // 1. Sikkim — Teesta Valley (VERY HIGH / CRITICAL)
  {
    id: 'RZ-SK-01',
    name: 'Teesta Valley Escarpment Alpha (NH-10)',
    state: 'Sikkim',
    level: 'VERY HIGH',
    fos: 0.88,
    saturation: '91.5%',
    color: '#dc2626',
    fillColor: '#ef4444',
    coordinates: [
      [27.318, 88.588],
      [27.348, 88.598],
      [27.342, 88.632],
      [27.312, 88.622],
      [27.305, 88.601]
    ],
    description: 'Severe toe erosion along Teesta river cutting NH-10. High shear tension displacement. FoS < 1.0.'
  },
  // 2. Sikkim — Rangpo-Singtam (MODERATE)
  {
    id: 'RZ-SK-02',
    name: 'Rangpo-Singtam Watch Corridor',
    state: 'Sikkim',
    level: 'MODERATE',
    fos: 1.22,
    saturation: '75.0%',
    color: '#d97706',
    fillColor: '#f59e0b',
    coordinates: [
      [27.268, 88.498],
      [27.295, 88.518],
      [27.302, 88.545],
      [27.275, 88.535]
    ],
    description: 'Elevated pore pressure trend on Ranipool-Singtam phyllite cut slopes. FoS 1.22.'
  },
  // 3. Arunachal Pradesh — Zemithang-Lumla (VERY HIGH / CRITICAL)
  {
    id: 'RZ-AR-01',
    name: 'Zemithang-Lumla Slope Alpha (NH-13)',
    state: 'Arunachal Pradesh',
    level: 'VERY HIGH',
    fos: 0.92,
    saturation: '94.2%',
    color: '#dc2626',
    fillColor: '#ef4444',
    coordinates: [
      [27.575, 91.838],
      [27.605, 91.842],
      [27.610, 91.875],
      [27.588, 91.885],
      [27.565, 91.858]
    ],
    description: 'Active tension crack displacement detected near Lumla. Factor of Safety FoS 0.92 (Severe Failure Risk).'
  },
  // 4. Arunachal Pradesh — Tawang Ridge (MODERATE)
  {
    id: 'RZ-AR-02',
    name: 'Tawang Ridge KM-14 Watch Zone',
    state: 'Arunachal Pradesh',
    level: 'MODERATE',
    fos: 1.18,
    saturation: '78.0%',
    color: '#d97706',
    fillColor: '#f59e0b',
    coordinates: [
      [27.555, 91.812],
      [27.575, 91.820],
      [27.582, 91.845],
      [27.558, 91.840]
    ],
    description: 'Elevated pore pressure from antecedent rainfall. Caution advised on road cuttings.'
  },
  // 5. Assam — Haflong Dima Hasao (HIGH)
  {
    id: 'RZ-AS-01',
    name: 'Haflong Railway Embankment Hazard Sector',
    state: 'Assam',
    level: 'HIGH',
    fos: 1.05,
    saturation: '88.0%',
    color: '#ea580c',
    fillColor: '#f97316',
    coordinates: [
      [25.148, 92.995],
      [25.195, 93.008],
      [25.205, 93.045],
      [25.158, 93.038]
    ],
    description: 'High hazard debris slide corridor along Dima Hasao railway cutting and NH-27 connector.'
  },
  // 6. Assam — Guwahati Southern Ridge (LOW)
  {
    id: 'RZ-AS-02',
    name: 'Guwahati Southern Ridge Terrace',
    state: 'Assam',
    level: 'LOW',
    fos: 1.48,
    saturation: '54.0%',
    color: '#16a34a',
    fillColor: '#22c55e',
    coordinates: [
      [26.115, 91.710],
      [26.145, 91.715],
      [26.152, 91.755],
      [26.120, 91.748]
    ],
    description: 'Stable crystalline basement terrace with gentle slopes and well-drained weathered profile.'
  },
  // 7. Meghalaya — Cherrapunji Escarpment (VERY HIGH)
  {
    id: 'RZ-ML-01',
    name: 'Cherrapunji-Mawkdok Gorge Escarpment',
    state: 'Meghalaya',
    level: 'VERY HIGH',
    fos: 0.95,
    saturation: '92.0%',
    color: '#dc2626',
    fillColor: '#ef4444',
    coordinates: [
      [25.275, 91.710],
      [25.320, 91.722],
      [25.325, 91.758],
      [25.280, 91.745]
    ],
    description: 'Deep limestone and sandstone gorge walls subject to extreme hydro-fracturing under intense cloudbursts.'
  },
  // 8. Nagaland — Kohima Zubza Slump (HIGH)
  {
    id: 'RZ-NL-01',
    name: 'Kohima-Zubza NH-29 Sinking Corridor',
    state: 'Nagaland',
    level: 'HIGH',
    fos: 1.03,
    saturation: '84.5%',
    color: '#ea580c',
    fillColor: '#f97316',
    coordinates: [
      [25.655, 94.075],
      [25.695, 94.090],
      [25.702, 94.135],
      [25.660, 94.120]
    ],
    description: 'Active subsidence and roadway sinking along the primary logistics lifeline to Manipur and Kohima.'
  },
  // 9. Mizoram — Aizawl Hunthar (VERY HIGH)
  {
    id: 'RZ-MZ-01',
    name: 'Aizawl Hunthar Progressive Slide Zone',
    state: 'Mizoram',
    level: 'VERY HIGH',
    fos: 0.91,
    saturation: '90.0%',
    color: '#dc2626',
    fillColor: '#ef4444',
    coordinates: [
      [23.710, 92.695],
      [23.745, 92.705],
      [23.750, 92.735],
      [23.715, 92.730]
    ],
    description: 'Chronic urban landslide zone with continuous surface cracking and building foundation shifts.'
  },
  // 10. Manipur — Imphal-Jiribam NH-37 (HIGH)
  {
    id: 'RZ-MN-01',
    name: 'NH-37 Noney-Tupul Landslide Sector',
    state: 'Manipur',
    level: 'HIGH',
    fos: 0.96,
    saturation: '85.0%',
    color: '#ea580c',
    fillColor: '#f97316',
    coordinates: [
      [24.795, 93.680],
      [24.845, 93.695],
      [24.850, 93.745],
      [24.800, 93.735]
    ],
    description: 'Heavy mudslide and debris accumulation in railway embankment excavation cuts. Site of previous major events.'
  },
  // 11. Tripura — Baramura Hill Range (MODERATE)
  {
    id: 'RZ-TR-01',
    name: 'Baramura Hill Highway Cut Zone',
    state: 'Tripura',
    level: 'MODERATE',
    fos: 1.30,
    saturation: '62.0%',
    color: '#d97706',
    fillColor: '#f59e0b',
    coordinates: [
      [23.810, 91.530],
      [23.845, 91.540],
      [23.850, 91.580],
      [23.815, 91.570]
    ],
    description: 'Moderate slope cut instability along NH-08 connecting Agartala to Assam.'
  }
];

// Geographically Distributed Risk Heatmap Points across NER
export const NER_HEATMAP_POINTS: Array<[number, number, number]> = [
  // Teesta Valley / Gangtok Cluster (High intensity)
  [27.331, 88.613, 0.95],
  [27.325, 88.605, 0.90],
  [27.340, 88.620, 0.85],
  [27.315, 88.590, 0.92],
  [27.290, 88.540, 0.78],
  [27.270, 88.520, 0.70],
  [27.504, 88.529, 0.88],
  // Tawang / Sela Pass Cluster (Very High intensity)
  [27.587, 91.860, 0.94],
  [27.595, 91.845, 0.92],
  [27.570, 91.875, 0.88],
  [27.530, 92.050, 0.86],
  [27.500, 92.100, 0.82],
  // Cherrapunji / Shillong Escarpment
  [25.298, 91.731, 0.90],
  [25.310, 91.745, 0.85],
  [25.350, 91.780, 0.75],
  [25.578, 91.893, 0.65],
  // Haflong / Dima Hasao Cluster
  [25.176, 93.018, 0.88],
  [25.190, 93.030, 0.84],
  [25.160, 93.005, 0.80],
  // Kohima / Zubza Cluster
  [25.675, 94.108, 0.85],
  [25.660, 94.090, 0.82],
  [25.690, 94.120, 0.78],
  // Imphal-Jiribam (Noney Tupul)
  [24.817, 93.710, 0.86],
  [24.830, 93.725, 0.82],
  // Aizawl Hunthar
  [23.727, 92.717, 0.89],
  [23.740, 92.705, 0.85],
  // Baramura Tripura
  [23.831, 91.550, 0.55],
  [23.820, 91.560, 0.50]
];

// Verified Active Incidents with Full Metadata
export const NER_INCIDENTS: NerIncident[] = [
  {
    id: 'INC-SK-01',
    location: 'East Sikkim (Teesta Riverbank Cutting)',
    state: 'Sikkim',
    hazardType: 'Debris Flow & Toe Scour',
    risk: 'HIGH',
    riskScore: 78,
    rainfall: 142.5,
    soilMoisture: 82,
    road: 'NH-10',
    status: 'RESTRICTED',
    latLng: [27.326, 88.608],
    description: 'Active tension crack failure and rockfall debris spilling across NH-10 KM 24. Transits limited to emergency convoys.',
    timestamp: '28m ago',
    actionText: 'Safe Route',
    actionHref: '/routes'
  },
  {
    id: 'INC-AR-01',
    location: 'Tawang Lumla Pass',
    state: 'Arunachal Pradesh',
    hazardType: 'Rotational Slump & Mudflow',
    risk: 'VERY HIGH',
    riskScore: 84,
    rainfall: 168.0,
    soilMoisture: 91,
    road: 'NH-13 (Trans-Arunachal)',
    status: 'RESTRICTED',
    latLng: [27.588, 91.854],
    description: 'Severe road subsidence near Lumla junction. Heavy rain saturated sub-base with 4.1 mm/day displacement.',
    timestamp: '42m ago',
    actionText: 'View Details',
    actionHref: '/authority'
  },
  {
    id: 'INC-AS-01',
    location: 'Haflong Railway Cut',
    state: 'Assam',
    hazardType: 'Embankment Mudslide',
    risk: 'HIGH',
    riskScore: 79,
    rainfall: 135.0,
    soilMoisture: 83,
    road: 'NH-27 / Hill Corridor',
    status: 'RESTRICTED',
    latLng: [25.182, 93.022],
    description: 'Debris runout blocked southern railway culvert and partial shoulder of NH-27 connector. Excavators mobilized.',
    timestamp: '1h 10m ago',
    actionText: 'Track Status',
    actionHref: '/report/track'
  },
  {
    id: 'INC-NL-01',
    location: 'Kohima-Zubza Sinking Zone',
    state: 'Nagaland',
    hazardType: 'Deep-Seated Creep',
    risk: 'HIGH',
    riskScore: 74,
    rainfall: 104.0,
    soilMoisture: 79,
    road: 'NH-29',
    status: 'CAUTION',
    latLng: [25.682, 94.102],
    description: 'Surface cracking along NH-29 carriage-way. Heavy multi-axle freight restricted to single lane.',
    timestamp: '2h 15m ago',
    actionText: 'Safe Route',
    actionHref: '/routes'
  },
  {
    id: 'INC-MN-01',
    location: 'Noney Hill Cutting (NH-37)',
    state: 'Manipur',
    hazardType: 'Rockfall & Mud Spillage',
    risk: 'HIGH',
    riskScore: 76,
    rainfall: 126.0,
    soilMoisture: 84,
    road: 'NH-37',
    status: 'RESTRICTED',
    latLng: [24.825, 93.718],
    description: 'Sudden hillside release deposited 350 m³ boulder debris. Single lane clearing underway by BRO.',
    timestamp: '3h 05m ago',
    actionText: 'Safe Route',
    actionHref: '/routes'
  },
  {
    id: 'INC-MZ-01',
    location: 'Aizawl Hunthar Sector',
    state: 'Mizoram',
    hazardType: 'Progressive Slope Slumping',
    risk: 'VERY HIGH',
    riskScore: 81,
    rainfall: 138.0,
    soilMoisture: 86,
    road: 'NH-54',
    status: 'RESTRICTED',
    latLng: [23.732, 92.712],
    description: 'Active slope creep near residential settlements. 12 households evacuated to high-ground school shelter.',
    timestamp: '3h 40m ago',
    actionText: 'View Details',
    actionHref: '/shelters'
  },
  {
    id: 'INC-ML-01',
    location: 'Cherrapunji Escarpment Rim',
    state: 'Meghalaya',
    hazardType: 'Flash Torrent Slope Wash',
    risk: 'VERY HIGH',
    riskScore: 82,
    rainfall: 195.0,
    soilMoisture: 93,
    road: 'SH-05',
    status: 'RESTRICTED',
    latLng: [25.305, 91.738],
    description: 'Intense orographic precipitation washed out road shoulder near gorge view point. Heavy transit halted.',
    timestamp: '4h 12m ago',
    actionText: 'Safe Route',
    actionHref: '/routes'
  }
];

// Strategic Highway Corridors Across NER
export const NER_ROADS: NerRoadCorridor[] = [
  {
    id: 'RD-NH10',
    name: 'NH-10 (Siliguri - Gangtok Arterial)',
    highway: 'NH-10',
    state: 'Sikkim',
    status: 'RESTRICTED',
    color: '#dc2626',
    dashArray: '5, 5',
    weight: 4,
    speedKmH: 22,
    description: 'Critical Sikkim lifeline. Active debris slides along Teesta gorge. Heavy vehicles redirected.',
    coordinates: [
      [27.050, 88.420],
      [27.180, 88.510],
      [27.270, 88.530],
      [27.310, 88.590],
      [27.331, 88.614],
      [27.420, 88.630]
    ]
  },
  {
    id: 'RD-NH13',
    name: 'NH-13 (Trans-Arunachal Highway)',
    highway: 'NH-13',
    state: 'Arunachal Pradesh',
    status: 'RESTRICTED',
    color: '#dc2626',
    dashArray: '5, 5',
    weight: 4,
    speedKmH: 25,
    description: 'High-altitude strategic corridor to Tawang. Tension cracking between KM 48 and Lumla junction.',
    coordinates: [
      [27.500, 92.120],
      [27.540, 91.980],
      [27.570, 91.920],
      [27.587, 91.860],
      [27.600, 91.830]
    ]
  },
  {
    id: 'RD-NH27',
    name: 'NH-27 (East-West Highway Corridor)',
    highway: 'NH-27',
    state: 'Assam',
    status: 'PASSABLE',
    color: '#16a34a',
    weight: 3.5,
    speedKmH: 65,
    description: 'Main 4-lane logistical artery through Brahmaputra valley. Fully open and clear.',
    coordinates: [
      [26.120, 91.650],
      [26.144, 91.736],
      [26.160, 91.950],
      [26.170, 92.350],
      [26.200, 92.937]
    ]
  },
  {
    id: 'RD-NH29',
    name: 'NH-29 (Dimapur - Kohima Corridor)',
    highway: 'NH-29',
    state: 'Nagaland',
    status: 'CAUTION',
    color: '#d97706',
    dashArray: '4, 4',
    weight: 3.5,
    speedKmH: 30,
    description: 'Zubza sinking zone active. Single-lane movement regulated by traffic police.',
    coordinates: [
      [25.900, 93.730],
      [25.750, 93.920],
      [25.685, 94.080],
      [25.675, 94.108]
    ]
  },
  {
    id: 'RD-NH37',
    name: 'NH-37 (Jiribam - Imphal Lifeline)',
    highway: 'NH-37',
    state: 'Manipur',
    status: 'RESTRICTED',
    color: '#ea580c',
    dashArray: '5, 5',
    weight: 3.5,
    speedKmH: 26,
    description: 'Mudslide spillage near Noney. Heavy fuel convoys escorted in alternating slots.',
    coordinates: [
      [24.800, 93.130],
      [24.810, 93.450],
      [24.825, 93.718],
      [24.817, 93.937]
    ]
  },
  {
    id: 'RD-NH06',
    name: 'NH-06 (Guwahati - Shillong - Silchar)',
    highway: 'NH-06',
    state: 'Meghalaya',
    status: 'PASSABLE',
    color: '#16a34a',
    weight: 3.5,
    speedKmH: 45,
    description: 'Paved multi-lane expressway through Khasi Hills. High rainfall advisory in place.',
    coordinates: [
      [26.144, 91.736],
      [25.850, 91.820],
      [25.578, 91.893],
      [25.400, 92.150],
      [25.100, 92.400]
    ]
  }
];

// Designated Emergency Shelters Across NER (Certified Safe High-Ground)
export const NER_SHELTERS: NerShelter[] = [
  {
    id: 'SH-SK-01',
    name: 'Gangtok Government Senior Secondary Auditorium',
    location: 'East Sikkim',
    state: 'Sikkim',
    address: 'Deorali Ridge, Gangtok 737102',
    latLng: [27.321, 88.618],
    capacity: 450,
    currentOccupancy: 82,
    supplies: 'Drinking Water, 500 Ready Meals, First Aid, Medical Officer',
    status: 'OPEN',
    elevation: '1,780 m MSL',
    roadAccess: 'Wide Paved Approach via Ridge Road (Clear)',
    isSafe: true
  },
  {
    id: 'SH-SK-02',
    name: 'Pakyong Community Staging Complex',
    location: 'Pakyong District',
    state: 'Sikkim',
    address: 'Near Pakyong Green Airport Junction',
    latLng: [27.240, 88.585],
    capacity: 600,
    currentOccupancy: 120,
    supplies: 'Generator Backup, Helipad Access, 1,200 Blankets',
    status: 'OPEN',
    elevation: '1,420 m MSL',
    roadAccess: 'NH-717A Direct Link (Clear)',
    isSafe: true
  },
  {
    id: 'SH-AR-01',
    name: 'Tawang High-Ground Community Relief Shelter',
    location: 'Tawang Town',
    state: 'Arunachal Pradesh',
    address: 'Old Gompa Road, High Plateau Zone',
    latLng: [27.585, 91.865],
    capacity: 350,
    currentOccupancy: 95,
    supplies: 'High-Altitude Cold Weather Gear, Oxygen Cylinders, 7-Day Rations',
    status: 'OPEN',
    elevation: '3,020 m MSL',
    roadAccess: 'Station Road (Clear)',
    isSafe: true
  },
  {
    id: 'SH-AR-02',
    name: 'Lumla Sub-Divisional Sports Hall',
    location: 'Lumla Sector',
    state: 'Arunachal Pradesh',
    address: 'Near Lumla Administration Center',
    latLng: [27.545, 91.725],
    capacity: 220,
    currentOccupancy: 45,
    supplies: 'Emergency Medical Kit, VHF Base Station, Canned Meals',
    status: 'OPEN',
    elevation: '2,410 m MSL',
    roadAccess: 'Local Bypass (Caution)',
    isSafe: true
  },
  {
    id: 'SH-AS-01',
    name: 'Haflong District Indoor Stadium',
    location: 'Dima Hasao',
    state: 'Assam',
    address: 'Haflong Hill Top, Near Circuit House',
    latLng: [25.172, 93.025],
    capacity: 500,
    currentOccupancy: 140,
    supplies: 'Potable Water Tankers, Relief Medical Team, Rations',
    status: 'OPEN',
    elevation: '680 m MSL',
    roadAccess: 'Circuit House Road (Open)',
    isSafe: true
  },
  {
    id: 'SH-ML-01',
    name: 'Shillong Central Youth Center',
    location: 'East Khasi Hills',
    state: 'Meghalaya',
    address: 'Mawkhar Ridge, Shillong',
    latLng: [25.582, 91.885],
    capacity: 400,
    currentOccupancy: 60,
    supplies: 'Emergency Power, Sanitation Units, Food Packets',
    status: 'OPEN',
    elevation: '1,520 m MSL',
    roadAccess: 'GS Road Access (Open)',
    isSafe: true
  },
  {
    id: 'SH-MZ-01',
    name: 'Aizawl High Ground Parish Hall',
    location: 'Aizawl North',
    state: 'Mizoram',
    address: 'Durtlang Ridge, Aizawl',
    latLng: [23.755, 92.730],
    capacity: 320,
    currentOccupancy: 78,
    supplies: 'Dry Rations, Medical Dispensary, Blankets',
    status: 'OPEN',
    elevation: '1,190 m MSL',
    roadAccess: 'Durtlang Road (Clear)',
    isSafe: true
  },
  {
    id: 'SH-NL-01',
    name: 'Kohima Local Ground Community Pavilion',
    location: 'Kohima',
    state: 'Nagaland',
    address: 'Khuochiezie, Kohima Town',
    latLng: [25.670, 94.112],
    capacity: 380,
    currentOccupancy: 50,
    supplies: 'Water Purification, First Aid, Sleeping Mats',
    status: 'OPEN',
    elevation: '1,440 m MSL',
    roadAccess: 'NH-29 Connecting Link (Open)',
    isSafe: true
  }
];

// In-Situ Geotechnical IoT Sensors Streaming Across NER
export const NER_SENSORS: NerSensorNode[] = [
  {
    id: 'SEN-SK-01',
    name: 'Teesta Gorge Slope Inclinometer Alpha',
    state: 'Sikkim',
    subCode: 'INC-SK-881',
    latLng: [27.328, 88.602],
    porePressure: '68.4 kPa',
    tiltAngle: '2.84° NNE',
    rainfall24h: 142.5,
    soilMoisture: '84.2%',
    fos: 0.88,
    batteryLevel: 94,
    status: 'WARNING',
    lastPing: '2m ago'
  },
  {
    id: 'SEN-SK-02',
    name: 'Ranipool Embankment Piezometer',
    state: 'Sikkim',
    subCode: 'PIEZ-SK-340',
    latLng: [27.295, 88.542],
    porePressure: '44.1 kPa',
    tiltAngle: '0.45° S',
    rainfall24h: 96.0,
    soilMoisture: '75.0%',
    fos: 1.22,
    batteryLevel: 98,
    status: 'ONLINE',
    lastPing: '4m ago'
  },
  {
    id: 'SEN-AR-01',
    name: 'Lumla Borehole MEMS Tiltmeter',
    state: 'Arunachal Pradesh',
    subCode: 'TLT-AR-104',
    latLng: [27.582, 91.848],
    porePressure: '72.1 kPa',
    tiltAngle: '3.12° W',
    rainfall24h: 168.0,
    soilMoisture: '91.5%',
    fos: 0.92,
    batteryLevel: 91,
    status: 'WARNING',
    lastPing: '1m ago'
  },
  {
    id: 'SEN-AR-02',
    name: 'Tawang Ridge Ultrasonic Rain Gauge Grid',
    state: 'Arunachal Pradesh',
    subCode: 'RN-AR-009',
    latLng: [27.592, 91.870],
    porePressure: '38.0 kPa',
    tiltAngle: '0.22° NE',
    rainfall24h: 110.0,
    soilMoisture: '78.0%',
    fos: 1.18,
    batteryLevel: 89,
    status: 'ONLINE',
    lastPing: '3m ago'
  },
  {
    id: 'SEN-AS-01',
    name: 'Dima Hasao Railway Slope Sensor Array',
    state: 'Assam',
    subCode: 'INC-AS-512',
    latLng: [25.185, 93.015],
    porePressure: '56.8 kPa',
    tiltAngle: '1.95° ESE',
    rainfall24h: 135.0,
    soilMoisture: '83.0%',
    fos: 1.05,
    batteryLevel: 96,
    status: 'WARNING',
    lastPing: '5m ago'
  },
  {
    id: 'SEN-ML-01',
    name: 'Cherrapunji Hydraulic Pressure Node',
    state: 'Meghalaya',
    subCode: 'HYD-ML-201',
    latLng: [25.302, 91.735],
    porePressure: '79.2 kPa',
    tiltAngle: '2.40° SSE',
    rainfall24h: 195.0,
    soilMoisture: '93.0%',
    fos: 0.95,
    batteryLevel: 92,
    status: 'WARNING',
    lastPing: '2m ago'
  },
  {
    id: 'SEN-NL-01',
    name: 'Zubza Sinking In-Situ Settlement Pin',
    state: 'Nagaland',
    subCode: 'SET-NL-408',
    latLng: [25.680, 94.098],
    porePressure: '52.0 kPa',
    tiltAngle: '1.80° SW',
    rainfall24h: 104.0,
    soilMoisture: '79.0%',
    fos: 1.03,
    batteryLevel: 88,
    status: 'ONLINE',
    lastPing: '6m ago'
  }
];
