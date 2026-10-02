/**
 * LogiShield AI - Core Engine Unit Tests
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcDaysRemaining, calcReorderPoint, LOCATIONS, INVENTORY_ITEMS, SUPPLY_ROUTES, TRANSPORT_ASSETS, WEATHER_CONDITIONS } from '../server/data/syntheticDatabase.js';
import { calculateLocationRisk } from '../server/services/riskEngine.js';
import { generateForecastForItem } from '../server/services/forecastEngine.js';
import { generateReplenishmentRecommendations } from '../server/services/replenishmentEngine.js';
import { runWhatIfSimulation } from '../server/services/simulatorEngine.js';

test('Inventory Calculations: calcDaysRemaining and calcReorderPoint', () => {
  // Days remaining = currentStock / predictedDailyConsumption
  const days = calcDaysRemaining(320, 92);
  assert.equal(days, 3.5);

  // Zero demand edge case
  const daysZero = calcDaysRemaining(500, 0);
  assert.equal(daysZero, 999);

  // Reorder point = (leadTimeDays * predictedDailyConsumption) + safetyStock
  const rop = calcReorderPoint(5, 92, 150);
  assert.equal(rop, 610);
});

test('Risk Engine: Location Risk Calculation and Thresholds', () => {
  const targetLoc = LOCATIONS.find(l => l.id === 'loc-02')!;
  const weather = WEATHER_CONDITIONS.find(w => w.locationId === targetLoc.id);

  const report = calculateLocationRisk(
    targetLoc,
    INVENTORY_ITEMS,
    SUPPLY_ROUTES,
    TRANSPORT_ASSETS,
    weather
  );

  assert.ok(report.compositeRiskScore >= 0 && report.compositeRiskScore <= 100, 'Score must be 0-100');
  assert.equal(report.locationId, 'loc-02');
  assert.ok(['NOMINAL', 'ELEVATED', 'HIGH', 'CRITICAL'].includes(report.riskLevel));
});

test('Demand Forecasting: Model Inference and Metrics', () => {
  const item = INVENTORY_ITEMS[0];
  const weather = WEATHER_CONDITIONS.find(w => w.locationId === item.locationId);

  const forecast = generateForecastForItem(item, weather);

  assert.equal(forecast.itemId, item.id);
  assert.equal(forecast.forecastNext14Days.length, 14);
  assert.ok(forecast.metrics.r2Score >= 0 && forecast.metrics.r2Score <= 1.0);
  assert.ok(forecast.metrics.rmse >= 0);
  assert.ok(forecast.recommendedReorderQty >= 0);
});

test('Replenishment Engine: Automated Recommendation Queue', () => {
  const recommendations = generateReplenishmentRecommendations(
    INVENTORY_ITEMS,
    LOCATIONS,
    SUPPLY_ROUTES,
    TRANSPORT_ASSETS
  );

  assert.ok(Array.isArray(recommendations));
  assert.ok(recommendations.length > 0, 'Should generate replenishment recommendations for critical items');

  const topRec = recommendations[0];
  assert.ok(topRec.recommendedOrderQty > 0);
  assert.ok(topRec.reorderPoint > 0);
});

test('Scenario Planning Simulator: Stress Test Recalculation', () => {
  const result = runWhatIfSimulation(
    {
      demandModifierPercent: 20,
      transportCapacityPercent: -15,
      weatherSeverityLevel: 'SEVERE',
      leadTimeModifierDays: 2,
      currentInventoryModifierPercent: 0,
    },
    LOCATIONS,
    INVENTORY_ITEMS,
    SUPPLY_ROUTES,
    TRANSPORT_ASSETS,
    WEATHER_CONDITIONS
  );

  assert.ok(result.affectedLocationsCount >= 0);
  assert.ok(result.totalDeficitQuantity >= 0);
  assert.ok(result.locationsComparison.length > 0);
});
