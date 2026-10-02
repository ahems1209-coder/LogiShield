/**
 * LogiShield AI - Deterministic Operational Data Seed Script
 */

import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { pool } from './index.js';
import {
  LOCATIONS,
  INVENTORY_ITEMS,
  TRANSPORT_ASSETS,
  SUPPLY_ROUTES,
  WEATHER_CONDITIONS,
  IOT_SENSORS,
  INITIAL_ALERTS
} from '../data/syntheticDatabase.js';

export async function seedDatabase() {
  console.log('[LogiShield Seed] Seeding operational dataset into database...');
  if (!pool) {
    console.log('[LogiShield Seed] PostgreSQL pool not configured. Skipping DB seed.');
    return;
  }

  try {
    const passwordHash = await bcrypt.hash('LogiShield@2026', 10);

    // 1. Seed Demo Accounts
    const users = [
      { id: 'usr-admin-01', email: 'admin@logishield.demo', name: 'Commander General (Admin)', role: 'ADMIN' },
      { id: 'usr-super-01', email: 'supervisor@logishield.demo', name: 'Logistics Supervisor', role: 'SUPERVISOR' },
      { id: 'usr-planner-01', email: 'planner@logishield.demo', name: 'V. Ramanathan (Planner)', role: 'LOGISTICS_PLANNER' }
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET name = $4, role = $5`,
        [u.id, u.email, passwordHash, u.name, u.role]
      );
    }

    // 2. Seed Locations
    for (const loc of LOCATIONS) {
      await pool.query(
        `INSERT INTO locations (
          id, name, code, type, coordinates_lat, coordinates_lng,
          elevation_meters, terrain, commander_callsign, base_status,
          connected_depot_id, distance_from_base_km, winter_stocking_target_days
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET base_status = $10`,
        [
          loc.id, loc.name, loc.code, loc.type, loc.coordinates[0], loc.coordinates[1],
          loc.elevationMeters, loc.terrain, loc.commanderCallsign, loc.baseStatus,
          loc.connectedDepotId || null, loc.distanceFromBaseKm, loc.winterStockingTargetDays
        ]
      );
    }

    // 3. Seed Inventory
    for (const item of INVENTORY_ITEMS) {
      await pool.query(
        `INSERT INTO inventory (
          id, location_id, location_name, item_code, name, category, unit,
          current_stock, safety_stock, capacity_max, average_daily_consumption,
          predicted_daily_consumption, lead_time_days, days_remaining, reorder_point,
          risk_score, risk_level, last_stock_check
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO UPDATE SET current_stock = $8, risk_score = $16, risk_level = $17`,
        [
          item.id, item.locationId, item.locationName, item.itemCode, item.name,
          item.category, item.unit, item.currentStock, item.safetyStock, item.capacityMax,
          item.averageDailyConsumption, item.predictedDailyConsumption, item.leadTimeDays,
          item.daysRemaining, item.reorderPoint, item.riskScore, item.riskLevel, item.lastStockCheck
        ]
      );
    }

    // 4. Seed Transport Assets
    for (const a of TRANSPORT_ASSETS) {
      await pool.query(
        `INSERT INTO transport_assets (
          id, name, asset_tag, type, status, current_location_id,
          destination_location_id, payload_capacity_kg, current_payload_kg, utilization_rate
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET status = $5, current_payload_kg = $9`,
        [
          a.id, a.name, a.assetTag, a.vehicleType || 'HEAVY_6X6_TRUCK', a.status, a.currentLocationId,
          a.destinationLocationId || null, a.payloadCapacityKg, a.currentPayloadKg, a.utilizationRate
        ]
      );
    }

    // 5. Seed Routes
    for (const r of SUPPLY_ROUTES) {
      await pool.query(
        `INSERT INTO routes (
          id, name, from_location_id, to_location_id, distance_km,
          transit_hours_nominal, transit_hours_current, road_condition, convoy_capacity_daily_trucks
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET road_condition = $8, transit_hours_current = $7`,
        [
          r.id, r.name, r.fromLocationId, r.toLocationId, r.distanceKm,
          r.transitHoursNominal, r.transitHoursCurrent, r.roadCondition, r.convoyCapacityDailyTrucks
        ]
      );
    }

    // 6. Seed Weather Conditions
    for (const w of WEATHER_CONDITIONS) {
      await pool.query(
        `INSERT INTO weather_conditions (
          id, location_id, location_name, temperature_celsius, snowfall_cm,
          wind_speed_kmh, visibility_meters, terrain_accessibility_score,
          logistics_impact_score, forecast_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET temperature_celsius = $4, forecast_summary = $10`,
        [
          `wth-${w.locationId}`, w.locationId, w.locationName, w.temperatureCelsius,
          w.snowfallCm, w.windSpeedKmh, w.visibilityMeters, w.terrainAccessibilityScore,
          w.logisticsImpactScore, w.forecastSummary
        ]
      );
    }

    // 7. Seed Initial Alerts
    for (const alt of INITIAL_ALERTS) {
      await pool.query(
        `INSERT INTO alerts (
          id, severity, type, location_id, location_name, headline, reason, recommended_action, acknowledged
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          alt.id, alt.severity, alt.type, alt.locationId, alt.locationName,
          alt.headline, alt.reason, alt.recommendedAction, alt.acknowledged
        ]
      );
    }

    console.log('[LogiShield Seed] Operational dataset seeded successfully.');
  } catch (err: any) {
    console.error('[LogiShield Seed Error]:', err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
