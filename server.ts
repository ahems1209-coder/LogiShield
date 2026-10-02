/**
 * LogiShield AI - Forward Supply Chain Intelligence
 * Operational Full-Stack Express Server & Predictive REST APIs
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './server/routes/authRoutes.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from './server/middleware/authMiddleware.js';
import { pool, isPostgresConnected, query } from './server/db/index.js';
import { fetchThingSpeakTelemetry } from './server/services/thingspeakService.js';
import { fetchLiveWeatherConditions } from './server/services/weatherService.js';
import {
  LOCATIONS,
  INVENTORY_ITEMS,
  TRANSPORT_ASSETS,
  SUPPLY_ROUTES,
  WEATHER_CONDITIONS,
  IOT_SENSORS,
  INITIAL_ALERTS,
  calcDaysRemaining,
  calcReorderPoint,
} from './server/data/syntheticDatabase.js';
import { generateForecastForItem } from './server/services/forecastEngine.js';
import { calculateLocationRisk } from './server/services/riskEngine.js';
import { generateReplenishmentRecommendations } from './server/services/replenishmentEngine.js';
import { runWhatIfSimulation } from './server/services/simulatorEngine.js';
import { askLogiCopilot, CopilotContextPayload } from './server/services/copilotService.js';
import {
  ExecutiveDashboardSummary,
  PredictiveDecisionChainData,
  WhatIfScenarioInput,
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const startTime = Date.now();

app.use(express.json());

// Mount Authentication Controller Routes (/api/auth/*)
app.use('/api/auth', authRoutes);

// In-memory mutable state for runtime interaction resilience
let inventoryState = [...INVENTORY_ITEMS];
let alertsState = [...INITIAL_ALERTS];
let iotSensorsState = [...IOT_SENSORS];
let isIoTSimulationActive = true;

// Background periodic simulated IoT jitter (every 12 seconds)
setInterval(() => {
  if (!isIoTSimulationActive) return;
  iotSensorsState = iotSensorsState.map(sensor => {
    let delta = (Math.random() - 0.5) * 0.4;
    let newVal = Math.max(0, Number((sensor.telemetryValue + delta).toFixed(1)));
    return {
      ...sensor,
      telemetryValue: newVal,
      lastBeaconTimestamp: new Date().toISOString(),
    };
  });
}, 12000);

// Helper to compute system snapshot for Gemini AI Copilot Grounding
function getSystemSnapshot() {
  const risks = LOCATIONS.map(loc => {
    const w = WEATHER_CONDITIONS.find(w => w.locationId === loc.id);
    return calculateLocationRisk(loc, inventoryState, SUPPLY_ROUTES, TRANSPORT_ASSETS, w);
  }).sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);

  const criticalLocations = risks.filter(r => r.compositeRiskScore >= 75).map(r => r.locationName);
  const replenishments = generateReplenishmentRecommendations(inventoryState, LOCATIONS, SUPPLY_ROUTES, TRANSPORT_ASSETS);

  const availableFleet = TRANSPORT_ASSETS.filter(a => a.status === 'AVAILABLE').length;
  const avgFleetUtil = Math.round(
    TRANSPORT_ASSETS.reduce((acc, a) => acc + a.utilizationRate, 0) / TRANSPORT_ASSETS.length
  );

  return {
    totalLocations: LOCATIONS.length,
    criticalLocations,
    topRisks: risks.slice(0, 4).map(r => ({
      sector: r.locationName,
      score: r.compositeRiskScore,
      primaryFactor: r.highContributingFactors[0] || 'Nominal',
    })),
    imminentStockOuts: inventoryState
      .filter(i => i.daysRemaining <= 5)
      .map(i => ({
        sector: i.locationName,
        item: i.name,
        daysLeft: i.daysRemaining,
        stock: i.currentStock,
        rop: i.reorderPoint,
      })),
    topReplenishments: replenishments.slice(0, 4).map(r => ({
      sector: r.locationName,
      item: r.itemName,
      priority: r.priority,
      qty: r.recommendedOrderQty,
      mode: r.suggestedTransportMode,
    })),
    fleetStatus: {
      total: TRANSPORT_ASSETS.length,
      available: availableFleet,
      utilizationPct: avgFleetUtil,
    },
    weatherAlerts: WEATHER_CONDITIONS
      .filter(w => w.logisticsImpactScore > 1.3)
      .map(w => ({
        sector: w.locationName,
        impact: w.logisticsImpactScore,
        summary: w.forecastSummary,
      })),
  };
}

// ==========================================
// REST API ROUTES (/api/*)
// ==========================================

// Health Check Endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  let dbHealthy = false;
  if (pool && isPostgresConnected) {
    try {
      await pool.query('SELECT 1');
      dbHealthy = true;
    } catch (err) {
      dbHealthy = false;
    }
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round((Date.now() - startTime) / 1000),
    database: {
      provider: 'PostgreSQL (Supabase)',
      connected: dbHealthy,
    },
    externalIntegrations: {
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'fallback_mode',
      thingspeak: process.env.THINGSPEAK_CHANNEL_ID ? 'configured' : 'synthetic_mode',
      openMeteo: 'available',
    },
  });
});

// 1. Executive Dashboard Summary
app.get('/api/dashboard', (req: Request, res: Response) => {
  const criticalItems = inventoryState.filter(i => i.daysRemaining <= 5 || i.riskScore >= 75);
  const risks = LOCATIONS.map(loc => {
    const w = WEATHER_CONDITIONS.find(w => w.locationId === loc.id);
    return calculateLocationRisk(loc, inventoryState, SUPPLY_ROUTES, TRANSPORT_ASSETS, w);
  });

  const atRiskLocations = risks.filter(r => r.compositeRiskScore >= 65);
  const totalStock = inventoryState.reduce((acc, i) => acc + i.currentStock, 0);
  const predicted7DayDemand = Math.round(
    inventoryState.reduce((acc, i) => acc + (i.predictedDailyConsumption * 7), 0)
  );

  const fleetUtilization = Math.round(
    TRANSPORT_ASSETS.reduce((acc, a) => acc + a.utilizationRate, 0) / TRANSPORT_ASSETS.length
  );

  const avgLeadTime = Number(
    (inventoryState.reduce((acc, i) => acc + i.leadTimeDays, 0) / inventoryState.length).toFixed(1)
  );

  const readinessScore = Number(
    (100 - (atRiskLocations.length / LOCATIONS.length) * 35).toFixed(1)
  );

  const summary: ExecutiveDashboardSummary = {
    totalLocations: LOCATIONS.length,
    totalInventoryUnits: totalStock,
    criticalItemsCount: criticalItems.length,
    predictedDemandNext7Days: predicted7DayDemand,
    atRiskLocationsCount: atRiskLocations.length,
    transportFleetUtilizationPercent: fleetUtilization,
    activeAlertsCount: alertsState.filter(a => !a.acknowledged).length,
    averageReplenishmentLeadTimeDays: avgLeadTime,
    systemReliabilityScore: readinessScore,
    lastSimSync: new Date().toISOString(),
  };

  const riskDistribution = [
    { name: 'Critical (80-100)', count: risks.filter(r => r.compositeRiskScore >= 80).length, fill: '#ef4444' },
    { name: 'High (65-79)', count: risks.filter(r => r.compositeRiskScore >= 65 && r.compositeRiskScore < 80).length, fill: '#f97316' },
    { name: 'Elevated (45-64)', count: risks.filter(r => r.compositeRiskScore >= 45 && r.compositeRiskScore < 65).length, fill: '#eab308' },
    { name: 'Nominal (0-44)', count: risks.filter(r => r.compositeRiskScore < 45).length, fill: '#10b981' },
  ];

  const categories = [
    { key: 'CLASS_III_POL_FUEL', label: 'Class III (POL/Fuel)' },
    { key: 'CLASS_I_RATIONS', label: 'Class I (Rations)' },
    { key: 'CLASS_V_AMMUNITION', label: 'Class V (Ammunition)' },
    { key: 'CLASS_VIII_MEDICAL', label: 'Class VIII (Medical)' },
    { key: 'CLASS_II_EQUIPMENT', label: 'Class II (Gear/Clothing)' },
    { key: 'CLASS_IX_SPARES', label: 'Class IX (Spares)' },
  ];

  const categoryAggregates = categories.map(cat => {
    const catItems = inventoryState.filter(i => i.category === cat.key);
    const stock = catItems.reduce((acc, i) => acc + i.currentStock, 0);
    const demand = Math.round(catItems.reduce((acc, i) => acc + (i.predictedDailyConsumption * 7), 0));
    const safety = catItems.reduce((acc, i) => acc + i.safetyStock, 0);
    const gap = stock - safety;
    return {
      category: cat.label,
      stock,
      demand,
      gap,
    };
  });

  res.json({
    summary,
    riskDistribution,
    categoryAggregates,
    topRisks: risks.sort((a, b) => b.compositeRiskScore - a.compositeRiskScore).slice(0, 5),
    recentAlerts: alertsState.slice(0, 4),
  });
});

// 2. Locations
app.get('/api/locations', (req: Request, res: Response) => {
  const locationsWithRisk = LOCATIONS.map(loc => {
    const weather = WEATHER_CONDITIONS.find(w => w.locationId === loc.id);
    const risk = calculateLocationRisk(loc, inventoryState, SUPPLY_ROUTES, TRANSPORT_ASSETS, weather);
    const locItems = inventoryState.filter(i => i.locationId === loc.id);
    return {
      ...loc,
      riskScore: risk.compositeRiskScore,
      riskLevel: risk.riskLevel,
      weatherImpact: weather ? weather.logisticsImpactScore : 1.0,
      itemCount: locItems.length,
      criticalItemCount: locItems.filter(i => i.daysRemaining <= 4).length,
    };
  });
  res.json(locationsWithRisk);
});

// 3. Inventory Records
app.get('/api/inventory', (req: Request, res: Response) => {
  const { sectorId, category } = req.query;
  let items = [...inventoryState];

  if (sectorId && typeof sectorId === 'string') {
    items = items.filter(i => i.locationId === sectorId);
  }
  if (category && typeof category === 'string') {
    items = items.filter(i => i.category === category);
  }

  res.json(items);
});

// 4. ML Demand Forecasting Engine
app.get('/api/forecast/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const item = inventoryState.find(i => i.id === itemId) || inventoryState[0];
  const weather = WEATHER_CONDITIONS.find(w => w.locationId === item.locationId);
  const forecast = generateForecastForItem(item, weather);
  res.json(forecast);
});

app.get('/api/forecast', (req: Request, res: Response) => {
  const item = inventoryState.find(i => i.id === 'inv-b01') || inventoryState[0];
  const weather = WEATHER_CONDITIONS.find(w => w.locationId === item.locationId);
  const forecast = generateForecastForItem(item, weather);
  res.json(forecast);
});

// 5. Risk Intelligence Matrix
app.get('/api/risk', (req: Request, res: Response) => {
  const reports = LOCATIONS.map(loc => {
    const weather = WEATHER_CONDITIONS.find(w => w.locationId === loc.id);
    return calculateLocationRisk(loc, inventoryState, SUPPLY_ROUTES, TRANSPORT_ASSETS, weather);
  }).sort((a, b) => b.compositeRiskScore - a.compositeRiskScore);

  res.json(reports);
});

// 6. Transport Fleet Management
app.get('/api/transport', (req: Request, res: Response) => {
  const totalFleetCapacity = TRANSPORT_ASSETS.reduce((a, b) => a + b.payloadCapacityKg, 0);
  const currentUtilizedPayload = TRANSPORT_ASSETS.reduce((a, b) => a + b.currentPayloadKg, 0);

  res.json({
    assets: TRANSPORT_ASSETS,
    metrics: {
      totalAssets: TRANSPORT_ASSETS.length,
      availableAssets: TRANSPORT_ASSETS.filter(a => a.status === 'AVAILABLE').length,
      enRouteAssets: TRANSPORT_ASSETS.filter(a => a.status === 'EN_ROUTE').length,
      maintenanceAssets: TRANSPORT_ASSETS.filter(a => a.status === 'MAINTENANCE').length,
      groundedAssets: TRANSPORT_ASSETS.filter(a => a.status === 'WEATHER_GROUNDED').length,
      totalCapacityKg: totalFleetCapacity,
      utilizedCapacityKg: currentUtilizedPayload,
      overallUtilizationPercent: Math.round((currentUtilizedPayload / totalFleetCapacity) * 100),
    },
  });
});

// 7. Supply Corridors & GIS Routes
app.get('/api/routes', (req: Request, res: Response) => {
  const enrichedRoutes = SUPPLY_ROUTES.map(route => {
    const origin = LOCATIONS.find(l => l.id === route.fromLocationId);
    const dest = LOCATIONS.find(l => l.id === route.toLocationId);
    return {
      ...route,
      fromName: origin?.name || 'Origin Base',
      toName: dest?.name || 'Destination Outpost',
      coordinates: [origin?.coordinates || [34.0, 76.0], dest?.coordinates || [34.5, 76.5]],
    };
  });
  res.json(enrichedRoutes);
});

// 8. Meteorological Weather Integration (Open-Meteo Integration)
app.get('/api/weather', async (req: Request, res: Response) => {
  const weatherList = await fetchLiveWeatherConditions();
  res.json(weatherList);
});

// 9. Field Sensor IoT Telemetry (ThingSpeak Integration)
app.get('/api/iot', async (req: Request, res: Response) => {
  const telemetryData = await fetchThingSpeakTelemetry();
  res.json({
    sensors: telemetryData.sensors,
    simulationActive: isIoTSimulationActive,
    source: telemetryData.source,
    lastUpdate: telemetryData.lastUpdate,
  });
});

app.post('/api/iot/toggle-simulation', (req: Request, res: Response) => {
  isIoTSimulationActive = !isIoTSimulationActive;
  res.json({ simulationActive: isIoTSimulationActive });
});

// 10. Replenishment Queue & Dispatch Action
app.get('/api/replenishment', (req: Request, res: Response) => {
  const recommendations = generateReplenishmentRecommendations(
    inventoryState,
    LOCATIONS,
    SUPPLY_ROUTES,
    TRANSPORT_ASSETS
  );
  res.json(recommendations);
});

app.post('/api/replenishment/dispatch', async (req: Request, res: Response) => {
  const { recommendationId } = req.body;
  
  const recItem = inventoryState.find(i => `repl-${i.id}` === recommendationId);
  if (recItem) {
    recItem.currentStock += Math.round(recItem.safetyStock * 0.8);
    recItem.daysRemaining = calcDaysRemaining(recItem.currentStock, recItem.predictedDailyConsumption);
    recItem.reorderPoint = calcReorderPoint(recItem.leadTimeDays, recItem.predictedDailyConsumption, recItem.safetyStock);
    recItem.riskScore = Math.max(20, recItem.riskScore - 30);
    recItem.riskLevel = recItem.riskScore >= 65 ? 'HIGH' : recItem.riskScore >= 45 ? 'ELEVATED' : 'NOMINAL';

    // Persist change to PostgreSQL if connected
    if (pool && isPostgresConnected) {
      try {
        await query(
          `UPDATE inventory SET current_stock = $1, days_remaining = $2, reorder_point = $3, risk_score = $4, risk_level = $5 WHERE id = $6`,
          [recItem.currentStock, recItem.daysRemaining, recItem.reorderPoint, recItem.riskScore, recItem.riskLevel, recItem.id]
        );

        await query(
          `INSERT INTO replenishment_orders (
            id, priority, location_id, location_name, item_code, item_name, category,
            current_stock, safety_stock, reorder_point, recommended_order_qty, days_until_stock_out,
            suggested_origin_depot_id, suggested_origin_depot_name, suggested_transport_mode, route_id,
            route_distance_km, estimated_transit_days, status, calculation_rationale
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            `repl-ord-${Date.now()}`, 'HIGH', recItem.locationId, recItem.locationName, recItem.itemCode, recItem.name, recItem.category,
            recItem.currentStock, recItem.safetyStock, recItem.reorderPoint, Math.round(recItem.safetyStock * 0.8), recItem.daysRemaining,
            'loc-09', 'Sector HQ North (Base Trident)', 'Heavy 4x4 Convoy', 'route-02', 68, 0.3, 'DISPATCHED', 'Emergency resupply authorized via portal action.'
          ]
        );
      } catch (dbErr: any) {
        console.warn('[LogiShield DB] Failed to persist replenishment dispatch:', dbErr.message);
      }
    }
  }

  const newAlert = {
    id: `alt-dispatch-${Date.now()}`,
    severity: 'INFO' as const,
    type: 'TRANSPORT_SHORTAGE' as const,
    locationId: recItem?.locationId || 'loc-02',
    locationName: recItem?.locationName || 'Sector Bravo',
    headline: `Emergency Replenishment Convoy Dispatched to ${recItem?.locationName || 'Forward Post'}`,
    reason: `4x4 High-Mobility Convoy departed depot with priority cargo. Estimated arrival in 7.5 hours.`,
    timestamp: new Date().toISOString(),
    recommendedAction: 'Alert Road-Opening Party for pass escort.',
    acknowledged: false,
  };
  alertsState.unshift(newAlert);

  res.json({ success: true, message: 'Replenishment order authorized and convoy staged.' });
});

// 11. What-If Scenario Simulator
app.post('/api/simulation', (req: Request, res: Response) => {
  const params: WhatIfScenarioInput = req.body || {
    demandModifierPercent: 20,
    transportCapacityPercent: -15,
    weatherSeverityLevel: 'SEVERE',
    leadTimeModifierDays: 2,
    currentInventoryModifierPercent: 0,
  };

  const results = runWhatIfSimulation(
    params,
    LOCATIONS,
    inventoryState,
    SUPPLY_ROUTES,
    TRANSPORT_ASSETS,
    WEATHER_CONDITIONS
  );

  res.json(results);
});

// 12. Operational Alert Log
app.get('/api/alerts', (req: Request, res: Response) => {
  res.json(alertsState);
});

app.post('/api/alerts/acknowledge', async (req: Request, res: Response) => {
  const { alertId } = req.body;
  alertsState = alertsState.map(a => a.id === alertId ? { ...a, acknowledged: true } : a);

  if (pool && isPostgresConnected) {
    try {
      await query(`UPDATE alerts SET acknowledged = TRUE WHERE id = $1`, [alertId]);
    } catch (err) {}
  }

  res.json({ success: true });
});

// 13. PREDICTIVE DECISION CHAIN (Flagship Feature)
app.get('/api/decision-chain/:sectorId?/:itemId?', (req: Request, res: Response) => {
  const targetSectorId = req.params.sectorId || 'loc-02';
  const targetItemId = req.params.itemId || 'inv-b01';

  const sector = LOCATIONS.find(l => l.id === targetSectorId) || LOCATIONS[1];
  const item = inventoryState.find(i => i.id === targetItemId) || inventoryState.find(i => i.locationId === sector.id) || inventoryState[0];
  const weather = WEATHER_CONDITIONS.find(w => w.locationId === sector.id);
  const route = SUPPLY_ROUTES.find(r => r.toLocationId === sector.id) || SUPPLY_ROUTES[1];

  const forecast = generateForecastForItem(item, weather);
  const risk = calculateLocationRisk(sector, inventoryState, SUPPLY_ROUTES, TRANSPORT_ASSETS, weather);

  const past7Days = (forecast.historicalPoints || []).slice(-7).map(p => p.consumption);
  const consumptionSurgePct = Math.round(
    ((item.predictedDailyConsumption - item.averageDailyConsumption) / item.averageDailyConsumption) * 100
  );

  const chain: PredictiveDecisionChainData = {
    sector,
    item,
    step1_Data: {
      historicalConsumption7Days: past7Days.length > 0 ? past7Days : [64, 68, 71, 74, 82, 88, 92],
      currentStock: item.currentStock,
      safetyStock: item.safetyStock,
      consumptionTrendPercent: consumptionSurgePct,
      inventoryDeltaPercent: -24.1,
      transportAvailabilityPercent: -18.5,
      environmentalPenalty: weather ? weather.logisticsImpactScore : 2.35,
    },
    step2_Forecast: {
      predictedDailyDemand: item.predictedDailyConsumption,
      baselineDailyDemand: item.averageDailyConsumption,
      demandIncreasePercent: consumptionSurgePct,
      modelConfidencePercent: forecast.metrics.confidencePercent,
      expectedStockOutDays: forecast.expectedStockOutDays || Math.round(item.daysRemaining),
    },
    step3_Risk: {
      compositeScore: risk.compositeRiskScore,
      level: risk.riskLevel,
      breakdown: risk.breakdown,
      primaryDriver: risk.highContributingFactors[0] || 'Inventory proximity to safety buffer',
    },
    step4_Impact: {
      expectedStockOutDate: forecast.expectedStockOutDate || 'In 3.5 Days',
      criticalDeficitUnits: Math.max(0, item.reorderPoint - item.currentStock),
      operationalReadinessDropPercent: 42,
      contingencyBufferHours: Math.round(item.daysRemaining * 24),
    },
    step5_Recommendation: {
      actionRequired: `Immediate push replenishment of ${Math.max(350, item.reorderPoint - item.currentStock)} ${item.unit}`,
      priority: risk.compositeRiskScore >= 80 ? 'CRITICAL' : 'HIGH',
      reorderQuantity: Math.max(350, item.reorderPoint - item.currentStock),
      dispatchRoute: route.name,
      recommendedAsset: 'Tata LPTA 715 4x4 High-Mobility Tanker (Convoy 3)',
      estimatedTransitHours: route.transitHoursCurrent,
    },
  };

  res.json(chain);
});

// 14. LogiCopilot (Gemini AI Advisor)
app.post('/api/copilot/query', async (req: Request, res: Response) => {
  try {
    const { userQuery, selectedSectorId } = req.body;
    const systemSnapshot = getSystemSnapshot();

    const payload: CopilotContextPayload = {
      userQuery: userQuery || 'Provide logistics situation briefing.',
      selectedSectorId,
      systemSnapshot,
    };

    const result = await askLogiCopilot(payload);
    res.json(result);
  } catch (err: any) {
    console.error('Copilot query error:', err);
    res.status(500).json({
      reply: 'LogiCopilot operational advisor temporarily unavailable. Please refer to dashboard metrics.',
      citedEntities: { sectors: [], items: [], priorityAction: '' },
    });
  }
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[LogiShield Express Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorCode: err.code || 'INTERNAL_SERVER_ERROR',
  });
});

// ==========================================
// Vite Middleware in Dev or Static Serving in Prod
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LogiShield AI Backend Server running on port ${PORT}`);
  });
}

startServer();
