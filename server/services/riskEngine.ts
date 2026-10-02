/**
 * LogiShield AI - Forward Supply Chain Intelligence
 * Transparent Risk Intelligence Engine (0-100 Score Breakdown)
 */

import {
  InventoryItem,
  LocationNode,
  LocationRiskReport,
  RiskFactorDecomposition,
  RiskLevel,
  SupplyRoute,
  TransportAsset,
  WeatherCondition
} from '../../src/types/index.js';

export function calculateLocationRisk(
  location: LocationNode,
  items: InventoryItem[],
  routes: SupplyRoute[],
  assets: TransportAsset[],
  weather?: WeatherCondition
): LocationRiskReport {
  const locItems = items.filter(i => i.locationId === location.id);
  const locRoutes = routes.filter(r => r.toLocationId === location.id);

  // 1. INVENTORY RISK (0-100)
  // Evaluates proximity of stock to safety stock and days remaining
  let inventoryRisk = 20;
  let criticalItemsCount = 0;
  let stockOutImminentCount = 0;

  if (locItems.length > 0) {
    let totalItemRisk = 0;
    for (const item of locItems) {
      let itemRisk = 0;
      const ratioToSafety = item.currentStock / (item.safetyStock || 1);

      if (ratioToSafety <= 0.8) {
        itemRisk += 50;
      } else if (ratioToSafety <= 1.2) {
        itemRisk += 30;
      } else if (ratioToSafety <= 2.0) {
        itemRisk += 15;
      }

      if (item.daysRemaining <= 4) {
        itemRisk += 45;
        stockOutImminentCount++;
        criticalItemsCount++;
      } else if (item.daysRemaining <= 7) {
        itemRisk += 25;
        criticalItemsCount++;
      } else if (item.daysRemaining <= 14) {
        itemRisk += 10;
      }

      totalItemRisk += Math.min(100, itemRisk);
    }
    inventoryRisk = Math.min(100, Math.round(totalItemRisk / locItems.length));
  }

  // 2. DEMAND RISK (0-100)
  // Evaluates recent surge over historical average
  let demandRisk = 25;
  if (locItems.length > 0) {
    const surgeRatios = locItems.map(
      i => (i.predictedDailyConsumption / (i.averageDailyConsumption || 1))
    );
    const avgSurgeRatio = surgeRatios.reduce((a, b) => a + b, 0) / surgeRatios.length;
    if (avgSurgeRatio >= 1.35) {
      demandRisk = 88;
    } else if (avgSurgeRatio >= 1.2) {
      demandRisk = 65;
    } else if (avgSurgeRatio >= 1.05) {
      demandRisk = 40;
    } else {
      demandRisk = 20;
    }
  }

  // 3. TRANSPORT RISK (0-100)
  // Evaluates route obstacles, bottlenecked capacity, asset availability
  let transportRisk = 25;
  const directRoute = locRoutes[0];
  if (directRoute) {
    if (directRoute.roadCondition === 'CLOSED') {
      transportRisk = 95;
    } else if (directRoute.roadCondition === 'SNOW_ICE_BOUND') {
      transportRisk = 85;
    } else if (directRoute.roadCondition === 'LANDSLIDE_RISK') {
      transportRisk = 75;
    } else if (directRoute.roadCondition === 'UNPAVED_GRAVEL') {
      transportRisk = 45;
    } else {
      transportRisk = 20;
    }

    if (directRoute.transitHoursCurrent > directRoute.transitHoursNominal * 1.5) {
      transportRisk = Math.min(100, transportRisk + 15);
    }
  }

  // 4. ENVIRONMENTAL RISK (0-100)
  let environmentalRisk = 20;
  if (weather) {
    // Terrain accessibility: 100 = safe, 0 = impassable
    const accessibilityPenalty = Math.max(0, 100 - weather.terrainAccessibilityScore);
    const tempPenalty = weather.temperatureCelsius < -20 ? 30 : weather.temperatureCelsius < -10 ? 15 : 5;
    const windPenalty = weather.windSpeedKmh > 50 ? 25 : weather.windSpeedKmh > 30 ? 10 : 0;
    environmentalRisk = Math.min(100, Math.round((accessibilityPenalty * 0.5) + tempPenalty + windPenalty));
  }

  // 5. LEAD TIME RISK (0-100)
  let leadTimeRisk = 25;
  if (locItems.length > 0) {
    const avgLead = locItems.reduce((a, b) => a + b.leadTimeDays, 0) / locItems.length;
    if (avgLead >= 7) {
      leadTimeRisk = 85;
    } else if (avgLead >= 5) {
      leadTimeRisk = 65;
    } else if (avgLead >= 3) {
      leadTimeRisk = 35;
    } else {
      leadTimeRisk = 15;
    }
  }

  // Composite Risk Score Calculation (Deterministic Weights)
  // 35% Inventory + 25% Demand + 15% Transport + 15% Environment + 10% Lead Time
  const compositeRiskScore = Math.min(
    100,
    Math.round(
      (inventoryRisk * 0.35) +
      (demandRisk * 0.25) +
      (transportRisk * 0.15) +
      (environmentalRisk * 0.15) +
      (leadTimeRisk * 0.10)
    )
  );

  let riskLevel: RiskLevel = 'NOMINAL';
  if (compositeRiskScore >= 80) riskLevel = 'CRITICAL';
  else if (compositeRiskScore >= 65) riskLevel = 'HIGH';
  else if (compositeRiskScore >= 45) riskLevel = 'ELEVATED';

  // Contributing factors list
  const highContributingFactors: string[] = [];
  if (inventoryRisk >= 70) highContributingFactors.push('Inventory below safety stock buffer');
  if (demandRisk >= 60) highContributingFactors.push('Daily consumption trend accelerated significantly');
  if (transportRisk >= 65) highContributingFactors.push('Route transit corridor experiencing delay or ice restriction');
  if (environmentalRisk >= 60) highContributingFactors.push('Severe sub-zero weather and snow drift hampering standard vehicle movement');
  if (leadTimeRisk >= 60) highContributingFactors.push('Delivery lead-time window expanded beyond safe margin');

  if (highContributingFactors.length === 0) {
    highContributingFactors.push('Logistics parameters within acceptable operational limits');
  }

  // Recommended Action
  let recommendedAction = 'Maintain scheduled supply replenishments and routine telemetry monitoring.';
  if (riskLevel === 'CRITICAL') {
    recommendedAction = 'AUTHORIZE PRIORITY CONVOY DISPATCH: Pre-position cold-weather convoys with snowplow escorts and initiate air-courier standby.';
  } else if (riskLevel === 'HIGH') {
    recommendedAction = 'EXPEDITE INTER-DEPOT TRANSFER: Rebalance forward stocks from intermediate sector depot and verify alternate mule/light-4x4 routes.';
  } else if (riskLevel === 'ELEVATED') {
    recommendedAction = 'ALERT LOGISTICS PLANNER: Monitor consumption spikes and queue preventive reorders 48 hours in advance.';
  }

  return {
    locationId: location.id,
    locationName: location.name,
    sectorType: location.type,
    compositeRiskScore,
    riskLevel,
    breakdown: {
      inventoryRisk,
      demandRisk,
      transportRisk,
      environmentalRisk,
      leadTimeRisk,
    },
    criticalItemsCount,
    highContributingFactors,
    recommendedAction,
    stockOutImminentCount,
  };
}
