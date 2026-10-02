/**
 * LogiShield AI - Forward Supply Chain Intelligence
 * Deterministic Multi-Echelon Replenishment Engine & Transport Optimizer
 */

import {
  InventoryItem,
  LocationNode,
  ReplenishmentRecommendation,
  SupplyRoute,
  TransportAsset
} from '../../src/types/index.js';

export function generateReplenishmentRecommendations(
  items: InventoryItem[],
  locations: LocationNode[],
  routes: SupplyRoute[],
  assets: TransportAsset[]
): ReplenishmentRecommendation[] {
  const recommendations: ReplenishmentRecommendation[] = [];

  for (const item of items) {
    // Only forward posts or intermediate sectors require supply pushes
    const location = locations.find(l => l.id === item.locationId);
    if (!location || location.type === 'CORPS_LOGISTICS_BASE') continue;

    // Days remaining = currentStock / predictedDailyConsumption
    const daysRemaining = item.predictedDailyConsumption > 0
      ? item.currentStock / item.predictedDailyConsumption
      : 999;

    // Lead time demand = leadTimeDays * predictedDailyConsumption
    const leadTimeDemand = item.leadTimeDays * item.predictedDailyConsumption;
    // Reorder Point (ROP) = Lead Time Demand + Safety Stock
    const reorderPoint = leadTimeDemand + item.safetyStock;

    // Does item need replenishment?
    // Trigger if current stock is below ROP OR days remaining <= (leadTimeDays + 2)
    const isReplenishmentRequired = item.currentStock <= reorderPoint || daysRemaining <= (item.leadTimeDays + 1.5);

    if (isReplenishmentRequired) {
      let priority: ReplenishmentRecommendation['priority'] = 'LOW';
      if (daysRemaining <= 4 || item.currentStock < item.safetyStock) {
        priority = 'CRITICAL';
      } else if (daysRemaining <= 7 || item.currentStock <= reorderPoint * 0.9) {
        priority = 'HIGH';
      } else if (daysRemaining <= 10) {
        priority = 'MEDIUM';
      }

      // Economic replenishment batch quantity (EOQ / Target Stocking Level)
      // Target Stock = Capacity limit or 14-day supply buffer + safety stock
      const targetStock = Math.min(
        item.capacityMax,
        Math.round((item.predictedDailyConsumption * Math.max(14, item.leadTimeDays * 2.5)) + item.safetyStock)
      );
      const recommendedOrderQty = Math.max(50, Math.round(targetStock - item.currentStock));

      // Determine optimal origin depot and route
      const directRoute = routes.find(r => r.toLocationId === item.locationId);
      const originDepotId = location.connectedDepotId || (directRoute ? directRoute.fromLocationId : 'loc-09');
      const originDepot = locations.find(l => l.id === originDepotId) || locations.find(l => l.id === 'loc-09')!;

      // Determine transport mode based on terrain and weather
      let suggestedTransportMode = 'Medium 4x4 Stallion Convoy';
      if (location.elevationMeters > 4800 || (directRoute && directRoute.roadCondition === 'SNOW_ICE_BOUND')) {
        suggestedTransportMode = 'Heavy 6x6 Snowplow Convoy & High-Altitude Rotary Standby';
      } else if (location.terrain === 'RUGGED_VALLEY' && directRoute?.roadCondition === 'LANDSLIDE_RISK') {
        suggestedTransportMode = 'Mountain Mule Pack Column + 4x4 Quick Transit';
      }

      const routeDistanceKm = directRoute ? directRoute.distanceKm : location.distanceFromBaseKm;
      const estimatedTransitDays = directRoute
        ? Number((directRoute.transitHoursCurrent / 24).toFixed(1))
        : Number((item.leadTimeDays).toFixed(1));

      const rationale = `Current stock (${item.currentStock} ${item.unit}) is below the calculated Reorder Point of ${Math.round(reorderPoint)} ${item.unit}. At a daily consumption rate of ${item.predictedDailyConsumption} ${item.unit}/day, stock depletion will occur in ${daysRemaining.toFixed(1)} days against a transit lead time of ${item.leadTimeDays} days.`;

      recommendations.push({
        id: `repl-${item.id}`,
        priority,
        locationId: item.locationId,
        locationName: item.locationName,
        itemCode: item.itemCode,
        itemName: item.name,
        category: item.category,
        currentStock: item.currentStock,
        safetyStock: item.safetyStock,
        reorderPoint: Math.round(reorderPoint),
        recommendedOrderQty,
        daysUntilStockOut: Number(daysRemaining.toFixed(1)),
        suggestedOriginDepotId: originDepot.id,
        suggestedOriginDepotName: originDepot.name,
        suggestedTransportMode,
        routeId: directRoute ? directRoute.id : 'route-01',
        routeDistanceKm,
        estimatedTransitDays,
        status: priority === 'CRITICAL' ? 'PENDING_APPROVAL' : 'PENDING_APPROVAL',
        calculationRationale: rationale,
      });
    }
  }

  // Sort by priority: CRITICAL first, then HIGH, MEDIUM, LOW
  const priorityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return recommendations.sort((a, b) => {
    const pw = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pw !== 0) return pw;
    return a.daysUntilStockOut - b.daysUntilStockOut;
  });
}
