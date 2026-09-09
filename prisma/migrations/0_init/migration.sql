-- CreateTable users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "state" TEXT DEFAULT 'Arunachal Pradesh',
    "district" TEXT,
    "notification_preferences" JSONB DEFAULT '{"in_app": true, "sms": true, "push": true}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable locations
CREATE TABLE IF NOT EXISTS "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "elevation_meters" DOUBLE PRECISION,
    "vulnerability_index" DOUBLE PRECISION DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable sensors
CREATE TABLE IF NOT EXISTS "sensors" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "station_name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "battery_percent" DOUBLE PRECISION DEFAULT 98.0,
    "firmware_version" TEXT DEFAULT 'v2.4.0',
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable sensor_readings
CREATE TABLE IF NOT EXISTS "sensor_readings" (
    "id" TEXT NOT NULL,
    "sensor_id" TEXT NOT NULL,
    "station_name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "soil_moisture" DOUBLE PRECISION NOT NULL,
    "pore_pressure" DOUBLE PRECISION NOT NULL,
    "tilt_angle" DOUBLE PRECISION NOT NULL,
    "rainfall" DOUBLE PRECISION NOT NULL,
    "ground_motion" DOUBLE PRECISION DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable weather_observations
CREATE TABLE IF NOT EXISTS "weather_observations" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Open-Meteo',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature_c" DOUBLE PRECISION,
    "relative_humidity_percent" DOUBLE PRECISION,
    "precipitation_mm" DOUBLE PRECISION,
    "rainfall_1h_mm" DOUBLE PRECISION,
    "rainfall_24h_mm" DOUBLE PRECISION,
    "rainfall_72h_mm" DOUBLE PRECISION,
    "soil_moisture_percent" DOUBLE PRECISION,
    "weather_code" INTEGER,
    "weather_description" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable risk_assessments
CREATE TABLE IF NOT EXISTS "risk_assessments" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "location_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "score" DOUBLE PRECISION NOT NULL,
    "level" TEXT NOT NULL,
    "primary_threat" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "input_coverage_ratio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sources" JSONB NOT NULL,
    "factor_summary" JSONB NOT NULL,
    "confidence_score" DOUBLE PRECISION DEFAULT 0.92,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable roads
CREATE TABLE IF NOT EXISTS "roads" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "name" TEXT NOT NULL,
    "highway_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLEAR',
    "blockage_reason" TEXT,
    "coordinates" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roads_pkey" PRIMARY KEY ("id")
);

-- CreateTable road_status_history
CREATE TABLE IF NOT EXISTS "road_status_history" (
    "id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "blockage_reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable shelters
CREATE TABLE IF NOT EXISTS "shelters" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "total_capacity" INTEGER NOT NULL,
    "occupied_capacity" INTEGER NOT NULL DEFAULT 0,
    "available_capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "safety_level" TEXT NOT NULL DEFAULT 'SAFE',
    "icon_type" TEXT NOT NULL DEFAULT 'community',
    "address" TEXT NOT NULL,
    "supplies" TEXT,
    "contact_number" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shelters_pkey" PRIMARY KEY ("id")
);

-- CreateTable incident_reports
CREATE TABLE IF NOT EXISTS "incident_reports" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT,
    "hazard_type" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL DEFAULT 27.586,
    "longitude" DOUBLE PRECISION NOT NULL DEFAULT 91.859,
    "severity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "photo_url" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verification_status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "response_status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "assigned_team" TEXT,
    "estimated_response_minutes" INTEGER DEFAULT 20,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable report_status_history
CREATE TABLE IF NOT EXISTS "report_status_history" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable alerts
CREATE TABLE IF NOT EXISTS "alerts" (
    "id" TEXT NOT NULL,
    "location_id" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "location_name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "risk_score" DOUBLE PRECISION,
    "risk_level" TEXT,
    "primary_threat" TEXT,
    "triggered_by" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL DEFAULT 'SentinalX Operational Risk Engine',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT,
    "user_id" TEXT,
    "channel" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "target_destination" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "delivery_status" TEXT NOT NULL DEFAULT 'QUEUED',
    "delivery_provider" TEXT,
    "delivery_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable notification_deliveries
CREATE TABLE IF NOT EXISTS "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT,
    "alert_id" TEXT,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message_preview" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'System',
    "provider_message_id" TEXT,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable audit_logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "incident_reports_report_id_key" ON "incident_reports"("report_id");
CREATE INDEX IF NOT EXISTS "sensor_readings_sensor_id_idx" ON "sensor_readings"("sensor_id");
CREATE INDEX IF NOT EXISTS "sensor_readings_timestamp_idx" ON "sensor_readings"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "weather_observations_location_id_recorded_at_idx" ON "weather_observations"("location_id", "recorded_at" DESC);
CREATE INDEX IF NOT EXISTS "risk_assessments_location_name_timestamp_idx" ON "risk_assessments"("location_name", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS "incident_reports_report_id_idx" ON "incident_reports"("report_id");
CREATE INDEX IF NOT EXISTS "incident_reports_response_status_idx" ON "incident_reports"("response_status");
CREATE INDEX IF NOT EXISTS "incident_reports_submitted_at_idx" ON "incident_reports"("submitted_at" DESC);
CREATE INDEX IF NOT EXISTS "report_status_history_report_id_idx" ON "report_status_history"("report_id");
CREATE INDEX IF NOT EXISTS "alerts_status_created_at_idx" ON "alerts"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_delivery_status_created_at_idx" ON "notifications"("delivery_status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notification_deliveries_timestamp_idx" ON "notification_deliveries"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "notification_deliveries_channel_idx" ON "notification_deliveries"("channel");
