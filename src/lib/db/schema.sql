-- ==========================================================
-- SentinalX: AI-Based Landslide Risk Monitoring System in NER
-- Database Schema Migration (PostgreSQL / Supabase)
-- SIH Problem Statement: SIH26001
-- ==========================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INCIDENT / FIELD REPORTS TABLE
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(32) NOT NULL UNIQUE,
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

-- 2. REPORT STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS report_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(32) NOT NULL REFERENCES incident_reports(report_id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SENSOR READINGS TABLE
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(64) NOT NULL,
    station_name VARCHAR(255) NOT NULL,
    state VARCHAR(64) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    soil_moisture DOUBLE PRECISION NOT NULL, -- percentage or volumetric
    pore_pressure DOUBLE PRECISION NOT NULL, -- kPa
    tilt_angle DOUBLE PRECISION NOT NULL,   -- degrees
    rainfall DOUBLE PRECISION NOT NULL,     -- 24h mm
    status VARCHAR(32) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'DEGRADED', 'OFFLINE')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    score DOUBLE PRECISION NOT NULL CHECK (score BETWEEN 0 AND 100),
    level VARCHAR(32) NOT NULL CHECK (level IN ('SAFE', 'MODERATE', 'HIGH', 'CRITICAL')),
    primary_threat TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    input_coverage_ratio DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    sources JSONB NOT NULL,
    factor_summary JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_incident_reports_report_id ON incident_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(response_status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_submitted_at ON incident_reports(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_status_history_report_id ON report_status_history(report_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_timestamp ON risk_assessments(timestamp DESC);

-- INITIAL SEED DATA FOR DEMO SCENARIO (SX-LS-2048)
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
