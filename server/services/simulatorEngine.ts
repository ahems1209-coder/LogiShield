/**
 * LogiShield AI - Forward Supply Chain Intelligence
 * Real-Time What-If Scenario Stress Simulator
 */

import {
  InventoryItem,
  LocationNode,
  SupplyRoute,
  TransportAsset,
  WeatherCondition,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  RiskLevel
} from '../../src/types/index.js';
import { calculateLocationRisk } from './riskEngine.js';

export function runWhatIfSimulation(
  params: WhatIfScenarioInput,
  locations: LocationNode[],
  baseItems: InventoryItem[],
  baseRoutes: SupplyRoute[],
  baseAssets: TransportAsset[],
  baseWeather: WeatherCondition[]
): WhatIfScenarioResult {
  const demandMult = 1 + (params.demandModifierPercent / 100);
  const transportMult = 1 + (params.transportCapacityPercent / 100);
  const inventoryMult = 1 + (params.currentInventoryModifierPercent / 100);

  // Weather severity multiplier
  let weatherMultiplier = 1.0;
  if (params.weatherSeverityLevel === 'SEVERE') weatherMultiplier = 1.35;
  if (params.weatherSeverityLevel === 'EXTREME_BLIZZARD') weatherMultiplier = 1.85;
  if (params.weatherSeverityLevel === 'LOW') weatherMultiplier = 0.85;

  // 1. Simulate altered inventory and demands
  const simulatedItems: InventoryItem[] = baseItems.map(item => {
    const simStock = Math.max(10, Math.round(item.currentStock * inventoryMult));
    const simPredDemand = Math.max(1, Math.round(item.predictedDailyConsumption * demandMult * weatherMultiplier * 10) / 10);
    const simLeadTime = Math.max(1, item.leadTimeDays + params.leadTimeModifierDays);
    const simDaysRemaining = Number((simStock / simPredDemand).toFixed(1));
    const simROP = Math.round((simLeadTime * simPredDemand) + item.safetyStock);

    let riskLevel: RiskLevel = 'NOMINAL';
    if (simDaysRemaining <= 4) riskLevel = 'CRITICAL';
    else if (simDaysRemaining <= 7) riskLevel = 'HIGH';
    else if (simDaysRemaining <= 12) riskLevel = 'ELEVATED';

    return {
      ...item,
      currentStock: simStock,
      predictedDailyConsumption: simPredDemand,
      leadTimeDays: simLeadTime,
      daysRemaining: simDaysRemaining,
      reorderPoint: simROP,
      riskLevel,
    };
  });

  // 2. Simulate routes under altered conditions
  const simulatedRoutes: SupplyRoute[] = baseRoutes.map(r => {
    let extraHours = 0;
    if (params.weatherSeverityLevel === 'SEVERE') extraHours = r.transitHoursNominal * 0.4;
    if (params.weatherSeverityLevel === 'EXTREME_BLIZZARD') extraHours = r.transitHoursNominal * 1.1;
    return {
      ...r,
      transitHoursCurrent: Number((r.transitHoursCurrent + extraHours).toFixed(1)),
      convoyCapacityDailyTrucks: Math.max(1, Math.round(r.convoyCapacityDailyTrucks * transportMult)),
    };
  });

  // 3. Compute baseline vs simulated metrics per location
  let totalDeficit = 0;
  let affectedCount = 0;
  let highRiskCount = 0;
  let totalStockOutShift = 0;

  const locationComparisons = locations
    .filter(l => l.type === 'FORWARD_POST' || l.type === 'SECTOR_HQ')
    .map(loc => {
      const locWeather = baseWeather.find(w => w.locationId === loc.id);
      
      const baselineReport = calculateLocationRisk(loc, baseItems, baseRoutes, baseAssets, locWeather);
      const simulatedReport = calculateLocationRisk(loc, simulatedItems, simulatedRoutes, baseAssets, locWeather);

      const locBaseItems = baseItems.filter(i => i.locationId === loc.id);
      const locSimItems = simulatedItems.filter(i => i.locationId === loc.id);

      const baseAvgDays = locBaseItems.length > 0
        ? locBaseItems.reduce((acc, i) => acc + i.daysRemaining, 0) / locBaseItems.length
        : 20;

      const simAvgDays = locSimItems.length > 0
        ? locSimItems.reduce((acc, i) => acc + i.daysRemaining, 0) / locSimItems.length
        : 15;

      const daysDelta = Number((simAvgDays - baseAvgDays).toFixed(1));
      totalStockOutShift += daysDelta;

      let additionalRequired = 0;
      for (let idx = 0; idx < locSimItems.length; idx++) {
        const item = locSimItems[idx];
        if (item.currentStock <= item.reorderPoint) {
          const deficit = Math.max(0, item.reorderPoint - item.currentStock);
          additionalRequired += deficit;
          totalDeficit += deficit;
        }
      }

      const riskDelta = simulatedReport.compositeRiskScore - baselineReport.compositeRiskScore;
      if (Math.abs(riskDelta) >= 5 || daysDelta < -1) {
        affectedCount++;
      }
      if (simulatedReport.compositeRiskScore >= 65) {
        highRiskCount++;
      }

      return {
        locationId: loc.id,
        locationName: loc.name,
        baselineRisk: baselineReport.compositeRiskScore,
        simulatedRisk: simulatedReport.compositeRiskScore,
        riskDelta,
        baselineStockOutDays: Number(baseAvgDays.toFixed(1)),
        simulatedStockOutDays: Number(simAvgDays.toFixed(1)),
        recommendedAddedSupply: additionalRequired,
        status: simulatedReport.riskLevel,
      };
    });

  // Calculate fleet requirements
  const avgTruckCapacity = 8000;
  const fleetRequired = Math.ceil(totalDeficit / (avgTruckCapacity * 0.75));

  const copilotSummary = `Under this scenario (Demand ${params.demandModifierPercent >= 0 ? '+' : ''}${params.demandModifierPercent}%, Transport ${params.transportCapacityPercent >= 0 ? '+' : ''}${params.transportCapacityPercent}%, Weather: ${params.weatherSeverityLevel}, Lead time: +${params.leadTimeModifierDays}d), ${affectedCount} forward sectors experience accelerated depletion. Critical risk is concentrated at ${locationComparisons.filter(l => l.status === 'CRITICAL').map(l => l.locationName.split(' ')[1]).join(', ') || 'none'}. Total additional supply demand is ${totalDeficit.toLocaleString()} units, requiring an estimated ${fleetRequired} heavy convoy dispatches.`;

  return {
    scenarioParameters: params,
    affectedLocationsCount: affectedCount,
    highRiskLocationsCount: highRiskCount,
    avgStockOutDaysShift: Number((totalStockOutShift / (locationComparisons.length || 1)).toFixed(1)),
    totalDeficitQuantity: totalDeficit,
    fleetRequiredCount: fleetRequired,
    locationsComparison: locationComparisons.sort((a, b) => b.simulatedRisk - a.simulatedRisk),
    copilotSummary,
  };
}
