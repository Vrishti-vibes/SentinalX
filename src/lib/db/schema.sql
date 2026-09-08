-- ==========================================================
-- SentinalX: AI-Based Landslide Early Warning System - NER
-- Production Database Schema Migration (PostgreSQL / Supabase)
-- Problem Statement: SIH26001 | Ministry of Development of North Eastern Region
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(32),
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'CITIZEN' CHECK (role IN ('CITIZEN', 'RESPONDER', 'AUTHORITY', 'ADMIN')),
    state VARCHAR(64) DEFAULT 'Arunachal Pradesh',
    district VARCHAR(64),
    notification_preferences JSONB DEFAULT '{"in_app": true, "sms": true, "push": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LOCATIONS / SECTORS TABLE
CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    elevation_meters DOUBLE PRECISION,
    vulnerability_index DOUBLE PRECISION DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SENSORS (IoT GEOTECHNICAL NODES)
CREATE TABLE IF NOT EXISTS sensors (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id),
    station_name VARCHAR(255) NOT NULL,
    state VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'DEGRADED', 'OFFLINE')),
    battery_percent DOUBLE PRECISION DEFAULT 98.0,
    firmware_version VARCHAR(32) DEFAULT 'v2.4.0',
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SENSOR READINGS TABLE (IoT INGESTION)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(64) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    station_name VARCHAR(255) NOT NULL,
    state VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    soil_moisture DOUBLE PRECISION NOT NULL, -- %
    pore_pressure DOUBLE PRECISION NOT NULL, -- kPa
    tilt_angle DOUBLE PRECISION NOT NULL,   -- degrees
    rainfall DOUBLE PRECISION NOT NULL,     -- 24h mm
    ground_motion DOUBLE PRECISION DEFAULT 0.0,
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'DEGRADED', 'OFFLINE')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. WEATHER OBSERVATIONS TABLE
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) REFERENCES locations(id),
    source VARCHAR(64) NOT NULL DEFAULT 'Open-Meteo',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    temperature_c DOUBLE PRECISION,
    relative_humidity_percent DOUBLE PRECISION,
    precipitation_mm DOUBLE PRECISION,
    rainfall_1h_mm DOUBLE PRECISION,
    rainfall_24h_mm DOUBLE PRECISION,
    rainfall_72h_mm DOUBLE PRECISION,
    soil_moisture_percent DOUBLE PRECISION,
    weather_code INT,
    weather_description VARCHAR(128),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(64) REFERENCES locations(id),
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    score DOUBLE PRECISION NOT NULL CHECK (score BETWEEN 0 AND 100),
    level VARCHAR(32) NOT NULL CHECK (level IN ('LOW', 'MODERATE', 'HIGH', 'SEVERE')),
    primary_threat TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    input_coverage_ratio DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    sources JSONB NOT NULL,
    factor_summary JSONB NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 0.92,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ROADS AND ROAD CONDITIONS
CREATE TABLE IF NOT EXISTS roads (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id),
    name VARCHAR(255) NOT NULL,
    highway_ref VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'CLEAR' CHECK (status IN ('CLEAR', 'CAUTION', 'BLOCKED')),
    blockage_reason TEXT,
    coordinates JSONB, -- GeoJSON LineString coordinates
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SHELTERS & SHELTER CAPACITY TABLE
CREATE TABLE IF NOT EXISTS shelters (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_capacity INT NOT NULL,
    occupied_capacity INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'FULL', 'STANDBY', 'UNSAFE')),
    safety_level VARCHAR(32) NOT NULL DEFAULT 'SAFE' CHECK (safety_level IN ('SAFE', 'ADVISORY', 'UNSAFE')),
    icon_type VARCHAR(32) NOT NULL DEFAULT 'community',
    address TEXT NOT NULL,
    supplies TEXT,
    contact_number VARCHAR(64),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CITIZEN INCIDENT / FIELD REPORTS TABLE
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(32) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id),
    hazard_type VARCHAR(64) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL DEFAULT 27.586,
    longitude DOUBLE PRECISION NOT NULL DEFAULT 91.859,
    severity SMALLINT NOT NULL CHECK (severity BETWEEN 1 AND 5),
    description TEXT NOT NULL,
    photo_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (verification_status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
    response_status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (response_status IN ('SUBMITTED', 'VERIFIED', 'AUTHORITIES_NOTIFIED', 'RESPONSE_ASSIGNED', 'RESOLVED')),
    assigned_team VARCHAR(128),
    estimated_response_minutes INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REPORT STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(32) NOT NULL REFERENCES incident_reports(report_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    location_id VARCHAR(64) REFERENCES locations(id),
    type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL CHECK (severity IN ('INFO', 'WATCH', 'HIGH', 'CRITICAL', 'SEVERE')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    risk_score DOUBLE PRECISION,
    risk_level VARCHAR(32),
    primary_threat TEXT,
    triggered_by TEXT[],
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    source VARCHAR(128) NOT NULL DEFAULT 'SentinalX Operational Risk Engine',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

-- 12. NOTIFICATIONS & MULTI-CHANNEL DELIVERIES
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(64) REFERENCES alerts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id),
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('IN_APP', 'SMS', 'PUSH', 'EMAIL')),
    recipient_type VARCHAR(32) NOT NULL CHECK (recipient_type IN ('CITIZEN', 'RESPONDER', 'AUTHORITY')),
    target_destination VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'QUEUED' CHECK (delivery_status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'PROVIDER_NOT_CONFIGURED')),
    delivery_provider VARCHAR(64),
    delivery_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(128) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    actor_id VARCHAR(128),
    actor_role VARCHAR(64),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_observations_loc ON weather_observations(location_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_loc_time ON risk_assessments(location_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_report_id ON incident_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(response_status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_submitted_at ON incident_reports(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status_created ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(delivery_status, created_at DESC);

-- SEED PRODUCTION LOCATIONS
INSERT INTO locations (id, name, state, latitude, longitude, elevation_meters, vulnerability_index)
VALUES 
('tawang', 'Tawang Sector', 'Arunachal Pradesh', 27.586, 91.859, 3048, 0.78),
('gangtok', 'Gangtok / Sevoke Corridor', 'Sikkim', 27.338, 88.606, 1650, 0.72),
('rangpo', 'Rangpo Transit Corridor', 'Sikkim', 27.177, 88.533, 350, 0.65)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;

-- SEED PRODUCTION SENSORS
INSERT INTO sensors (id, location_id, station_name, state, latitude, longitude, status, battery_percent)
VALUES 
('SENSOR-TW-01', 'tawang', 'Tawang Pass Surface Inclinometer Node Alpha', 'Arunachal Pradesh', 27.589, 91.865, 'ONLINE', 97.4),
('SENSOR-TW-02', 'tawang', 'Zemithang Piezometer Station Beta', 'Arunachal Pradesh', 27.705, 91.718, 'ONLINE', 94.2),
('SENSOR-SK-01', 'gangtok', 'Sevoke Teesta Riverbank Slope Monitor', 'Sikkim', 27.338, 88.606, 'ONLINE', 96.0),
('SENSOR-SK-02', 'gangtok', 'Ranipool Subsidence Array', 'Sikkim', 27.301, 88.585, 'ONLINE', 91.5)
ON CONFLICT (id) DO NOTHING;

-- SEED PRODUCTION SHELTERS
INSERT INTO shelters (id, location_id, name, sector, latitude, longitude, total_capacity, occupied_capacity, status, safety_level, icon_type, address, supplies, contact_number)
VALUES 
('shelter-tw-1', 'tawang', 'Tawang Community Center', 'tawang', 27.592, 91.875, 250, 38, 'OPEN', 'SAFE', 'community', 'Upper Tawang Road, Near Monpa Cultural Complex', 'Full medical aid, clean water, generator power, winter blankets', '+91 3794 222 201'),
('shelter-tw-2', 'tawang', 'Government Relief Camp', 'tawang', 27.579, 91.848, 400, 152, 'OPEN', 'SAFE', 'camp', 'Helipad Grounds, Lumla Road Junction', 'Emergency rations, first responder post, field beds', '+91 3794 222 202'),
('shelter-tw-3', 'tawang', 'District Relief Center', 'tawang', 27.595, 91.840, 600, 360, 'OPEN', 'SAFE', 'district', 'DC Office Complex, High Ground Sector', 'Disaster management command post, satellite communication hub', '+91 3794 222 203'),
('shelter-gtk-1', 'gangtok', 'Gangtok Indoor Stadium Relief Center', 'gangtok', 27.332, 88.614, 600, 420, 'OPEN', 'SAFE', 'district', 'Paljor Stadium Rd, Gangtok', 'Medical triage desk, food distribution, water purification, power backup', '+91 3592 202 202'),
('shelter-gtk-2', 'gangtok', 'Rangpo Highway Transit Shelter', 'gangtok', 27.318, 88.598, 250, 230, 'OPEN', 'SAFE', 'camp', 'NH-10 Checkpost Transit Base, Rangpo', 'Emergency transit beds, trauma kits, mobile SATCOM unit', '+91 3592 202 404')
ON CONFLICT (id) DO NOTHING;

-- SEED PRODUCTION ACTIVE ROADS
INSERT INTO roads (id, location_id, name, highway_ref, status, blockage_reason)
VALUES 
('ROAD-TW-13', 'tawang', 'NH-13 Trans-Arunachal Highway', 'NH-13', 'CAUTION', 'Single lane open around Km 14 slope reinforcement'),
('ROAD-TW-SAFE-BYPASS', 'tawang', 'East Ridge Bypass Corridor', 'RIDGE-RD', 'CLEAR', 'Cleared by Border Roads Organisation (BRO)'),
('ROAD-SK-10', 'gangtok', 'NH-10 Siliguri-Gangtok Highway', 'NH-10', 'CAUTION', 'Active debris watch along Teesta River escarpment')
ON CONFLICT (id) DO NOTHING;

-- SEED ACTIVE SEED REPORT
INSERT INTO incident_reports (
    report_id, hazard_type, location_name, latitude, longitude, severity, description, verification_status, response_status, assigned_team, estimated_response_minutes
) VALUES (
    'SX-LS-2048',
    'Landslide',
    'Tawang Sector, North Eastern Region',
    27.586,
    91.859,
    4,
    'Observed active rockfall and debris accumulation on highway shoulder near Km 4. Road partially blocked.',
    'VERIFIED',
    'RESPONSE_ASSIGNED',
    'SDRF Quick Response Unit Alpha (Tawang HQ)',
    15
) ON CONFLICT (report_id) DO NOTHING;

INSERT INTO report_status_history (report_id, status, message, timestamp)
VALUES 
('SX-LS-2048', 'SUBMITTED', 'Report logged via citizen field interface.', NOW() - INTERVAL '30 minutes'),
('SX-LS-2048', 'VERIFIED', 'Cross-verified with geotechnical sensor node telemetry.', NOW() - INTERVAL '25 minutes'),
('SX-LS-2048', 'AUTHORITIES_NOTIFIED', 'Alert dispatched to district disaster management authority.', NOW() - INTERVAL '20 minutes'),
('SX-LS-2048', 'RESPONSE_ASSIGNED', 'SDRF Quick Response Unit dispatched from Tawang HQ.', NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;
