-- LogiShield AI - Production PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'LOGISTICS_PLANNER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  coordinates_lat NUMERIC(8,4) NOT NULL,
  coordinates_lng NUMERIC(8,4) NOT NULL,
  elevation_meters INT NOT NULL,
  terrain VARCHAR(50) NOT NULL,
  commander_callsign VARCHAR(100),
  base_status VARCHAR(50) NOT NULL DEFAULT 'OPERATIONAL',
  connected_depot_id VARCHAR(64),
  distance_from_base_km INT NOT NULL DEFAULT 0,
  winter_stocking_target_days INT NOT NULL DEFAULT 180
);

CREATE TABLE IF NOT EXISTS inventory (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  safety_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  capacity_max NUMERIC(12,2) NOT NULL DEFAULT 0,
  average_daily_consumption NUMERIC(10,2) NOT NULL DEFAULT 0,
  predicted_daily_consumption NUMERIC(10,2) NOT NULL DEFAULT 0,
  lead_time_days INT NOT NULL DEFAULT 3,
  days_remaining NUMERIC(10,2) NOT NULL DEFAULT 999,
  reorder_point NUMERIC(12,2) NOT NULL DEFAULT 0,
  risk_score INT NOT NULL DEFAULT 0,
  risk_level VARCHAR(20) NOT NULL DEFAULT 'NOMINAL',
  last_stock_check TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_history (
  id VARCHAR(64) PRIMARY KEY,
  item_id VARCHAR(64) NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  location_id VARCHAR(64) NOT NULL,
  opening_stock NUMERIC(12,2) NOT NULL,
  consumed_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_qty NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_stock NUMERIC(12,2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consumption_history (
  id VARCHAR(64) PRIMARY KEY,
  item_id VARCHAR(64) NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  date_str VARCHAR(20) NOT NULL,
  consumption_qty NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
  id VARCHAR(64) PRIMARY KEY,
  item_id VARCHAR(64) NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  location_id VARCHAR(64) NOT NULL,
  forecast_date VARCHAR(20) NOT NULL,
  predicted_demand NUMERIC(10,2) NOT NULL,
  upper_bound NUMERIC(10,2) NOT NULL,
  lower_bound NUMERIC(10,2) NOT NULL,
  projected_stock NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_assets (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  asset_tag VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  current_location_id VARCHAR(64) NOT NULL,
  destination_location_id VARCHAR(64),
  payload_capacity_kg INT NOT NULL,
  current_payload_kg INT NOT NULL DEFAULT 0,
  utilization_rate INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS routes (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  from_location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  to_location_id VARCHAR(64) NOT NULL REFERENCES locations(id),
  distance_km INT NOT NULL,
  transit_hours_nominal NUMERIC(8,2) NOT NULL,
  transit_hours_current NUMERIC(8,2) NOT NULL,
  road_condition VARCHAR(50) NOT NULL,
  convoy_capacity_daily_trucks INT NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS weather_conditions (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  location_name VARCHAR(255) NOT NULL,
  temperature_celsius NUMERIC(5,2) NOT NULL,
  snowfall_cm NUMERIC(6,2) NOT NULL DEFAULT 0,
  wind_speed_kmh NUMERIC(6,2) NOT NULL DEFAULT 0,
  visibility_meters INT NOT NULL DEFAULT 10000,
  terrain_accessibility_score INT NOT NULL DEFAULT 100,
  logistics_impact_score NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  forecast_summary TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry (
  id VARCHAR(64) PRIMARY KEY,
  sensor_id VARCHAR(64) NOT NULL,
  location_id VARCHAR(64) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  telemetry_value NUMERIC(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  storage_condition_status VARCHAR(20) NOT NULL,
  battery_percent INT NOT NULL DEFAULT 100,
  signal_strength_dbm INT NOT NULL DEFAULT -75,
  last_beacon_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id VARCHAR(64) PRIMARY KEY,
  location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  composite_risk_score INT NOT NULL,
  risk_level VARCHAR(20) NOT NULL,
  inventory_risk INT NOT NULL,
  demand_risk INT NOT NULL,
  transport_risk INT NOT NULL,
  environmental_risk INT NOT NULL,
  lead_time_risk INT NOT NULL,
  contributing_factors_json TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(64) PRIMARY KEY,
  severity VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location_id VARCHAR(64) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  headline VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  recommended_action TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS replenishment_orders (
  id VARCHAR(64) PRIMARY KEY,
  priority VARCHAR(20) NOT NULL,
  location_id VARCHAR(64) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  current_stock NUMERIC(12,2) NOT NULL,
  safety_stock NUMERIC(12,2) NOT NULL,
  reorder_point NUMERIC(12,2) NOT NULL,
  recommended_order_qty NUMERIC(12,2) NOT NULL,
  days_until_stock_out NUMERIC(10,2) NOT NULL,
  suggested_origin_depot_id VARCHAR(64) NOT NULL,
  suggested_origin_depot_name VARCHAR(255) NOT NULL,
  suggested_transport_mode VARCHAR(255) NOT NULL,
  route_id VARCHAR(64) NOT NULL,
  route_distance_km INT NOT NULL,
  estimated_transit_days NUMERIC(8,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RECOMMENDED',
  calculation_rationale TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenario_runs (
  id VARCHAR(64) PRIMARY KEY,
  demand_modifier_pct INT NOT NULL,
  transport_capacity_pct INT NOT NULL,
  weather_severity_level VARCHAR(50) NOT NULL,
  lead_time_modifier_days INT NOT NULL,
  inventory_modifier_pct INT NOT NULL,
  affected_locations_count INT NOT NULL,
  high_risk_locations_count INT NOT NULL,
  total_deficit_qty INT NOT NULL,
  fleet_required_count INT NOT NULL,
  copilot_summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  executing_user_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(64),
  details_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR HIGH-PERFORMANCE OPERATIONAL LOOKUPS
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_risk ON inventory(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_replenishment_priority ON replenishment_orders(priority);
CREATE INDEX IF NOT EXISTS idx_telemetry_sensor ON telemetry(sensor_id);
