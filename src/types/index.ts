/**
 * LogiShield AI - Forward Supply Chain Intelligence
 * Type Definitions & Domain Data Contracts
 */

export type SectorType = 'FORWARD_POST' | 'SECTOR_HQ' | 'DIVISION_DEPOT' | 'CORPS_LOGISTICS_BASE';

export type SupplyCategory = 
  | 'CLASS_I_RATIONS' 
  | 'CLASS_II_EQUIPMENT' 
  | 'CLASS_III_POL_FUEL' 
  | 'CLASS_V_AMMUNITION' 
  | 'CLASS_VIII_MEDICAL' 
  | 'CLASS_IX_SPARES';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'NOMINAL';

export interface LocationNode {
  id: string;
  name: string;
  code: string;
  type: SectorType;
  coordinates: [number, number]; // [lat, lng]
  elevationMeters: number;
  terrain: 'HIGH_ALTITUDE' | 'RUGGED_VALLEY' | 'GLACIAL_PASS' | 'PLAINS_TRANSIT';
  commanderCallsign: string;
  baseStatus: 'OPERATIONAL' | 'WEATHER_RESTRICTED' | 'ISOLATED' | 'HIGH_ALERT';
  connectedDepotId?: string;
  distanceFromBaseKm: number;
  winterStockingTargetDays: number;
}

export interface InventoryItem {
  id: string;
  locationId: string;
  locationName: string;
  itemCode: string;
  name: string;
  category: SupplyCategory;
  unit: string;
  currentStock: number;
  safetyStock: number;
  capacityMax: number;
  averageDailyConsumption: number;
  predictedDailyConsumption: number;
  leadTimeDays: number;
  daysRemaining: number;
  reorderPoint: number;
  riskScore: number;
  riskLevel: RiskLevel;
  lastStockCheck: string;
}

export interface ConsumptionHistoryPoint {
  date: string;
  consumption: number;
  demandSurge: boolean;
  weatherImpactFactor: number;
}

export interface ItemForecast {
  itemId: string;
  itemName: string;
  locationId: string;
  locationName: string;
  currentStock: number;
  historicalPoints: ConsumptionHistoryPoint[];
  forecastNext14Days: {
    date: string;
    dayNumber: number;
    predictedDemand: number;
    upperBound95: number;
    lowerBound95: number;
    projectedStock: number;
  }[];
  metrics: {
    modelType: string;
    rmse: number;
    mae: number;
    r2Score: number;
    confidencePercent: number;
    trainingDataPoints: number;
  };
  expectedStockOutDays: number | null; // null if stock won't run out in 14 days
  expectedStockOutDate: string | null;
  recommendedReorderQty: number;
  factors: {
    seasonalityTrend: number;
    environmentalPenalty: number;
    transportDelayPenalty: number;
  };
}

export interface RiskFactorDecomposition {
  inventoryRisk: number;    // 0-100: proximity to safety stock & depletion rate
  demandRisk: number;       // 0-100: surge velocity vs historical baseline
  transportRisk: number;    // 0-100: route bottlenecks & fleet deficit
  environmentalRisk: number;// 0-100: weather severity, pass accessibility
  leadTimeRisk: number;     // 0-100: delivery buffer shrinkage
}

export interface LocationRiskReport {
  locationId: string;
  locationName: string;
  sectorType: SectorType;
  compositeRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  breakdown: RiskFactorDecomposition;
  criticalItemsCount: number;
  highContributingFactors: string[];
  recommendedAction: string;
  stockOutImminentCount: number;
}

export interface TransportAsset {
  id: string;
  assetTag: string;
  vehicleType: 'HEAVY_6X6_TRUCK' | 'MEDIUM_STALLION_4X4' | 'HIGH_ALTITUDE_CHETAK_HELI' | 'LIGHT_TACTICAL_GYPSY' | 'MULE_PACK_CORPS';
  name: string;
  payloadCapacityKg: number;
  currentPayloadKg: number;
  utilizationRate: number; // 0-100%
  status: 'AVAILABLE' | 'EN_ROUTE' | 'MAINTENANCE' | 'WEATHER_GROUNDED';
  currentLocationId: string;
  assignedRouteId?: string;
  destinationLocationId?: string;
  estimatedTravelHours: number;
  fuelAutonomyKm: number;
  allWeatherCertified: boolean;
}

export interface SupplyRoute {
  id: string;
  code: string;
  name: string;
  fromLocationId: string;
  toLocationId: string;
  distanceKm: number;
  transitHoursNominal: number;
  transitHoursCurrent: number;
  roadCondition: 'CLEAR_ASPHALT' | 'UNPAVED_GRAVEL' | 'SNOW_ICE_BOUND' | 'LANDSLIDE_RISK' | 'CLOSED';
  passElevationMeters: number;
  convoyCapacityDailyTrucks: number;
  riskIndex: number; // 0-100
  lastPatrolClearance: string;
}

export interface WeatherCondition {
  locationId: string;
  locationName: string;
  temperatureCelsius: number;
  rainfallMm: number;
  snowfallCm: number;
  windSpeedKmh: number;
  visibilityMeters: number;
  roadCondition: 'CLEAR' | 'SLIPPERY' | 'SNOWBOUND' | 'FROZEN';
  terrainAccessibilityScore: number; // 0-100 (100 = optimal, 20 = impassable)
  logisticsImpactScore: number;      // 1.0 (nominal) to 2.5 (severe multiplier)
  forecastSummary: string;
  lastUpdated: string;
}

export interface IoTSensorTelemetry {
  sensorId: string;
  locationId: string;
  locationName: string;
  itemCode: string;
  sensorType: 'DIGITAL_TANK_LEVEL' | 'RFID_CRATE_TRACKER' | 'COLD_CHAIN_TEMP' | 'VIBRATION_SEAL_MONITOR';
  telemetryValue: number;
  unit: string;
  batteryPercent: number;
  signalStrengthDbm: number;
  storageConditionStatus: 'OPTIMAL' | 'DEGRADED' | 'ALARM';
  simulatedFluctuationActive: boolean;
  lastBeaconTimestamp: string;
  label: 'SIMULATED IoT TELEMETRY' | 'THINGSPEAK LIVE FEED';
}

export interface ReplenishmentRecommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  locationId: string;
  locationName: string;
  itemCode: string;
  itemName: string;
  category: SupplyCategory;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedOrderQty: number;
  daysUntilStockOut: number;
  suggestedOriginDepotId: string;
  suggestedOriginDepotName: string;
  suggestedTransportMode: string;
  routeId: string;
  routeDistanceKm: number;
  estimatedTransitDays: number;
  status: 'PENDING_APPROVAL' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED';
  calculationRationale: string;
}

export interface WhatIfScenarioInput {
  demandModifierPercent: number;       // e.g. +20% or -15%
  transportCapacityPercent: number;   // e.g. -25%
  weatherSeverityLevel: 'LOW' | 'NORMAL' | 'SEVERE' | 'EXTREME_BLIZZARD';
  leadTimeModifierDays: number;       // e.g. +3 days
  currentInventoryModifierPercent: number; // e.g. -10%
}

export interface WhatIfScenarioResult {
  scenarioParameters: WhatIfScenarioInput;
  affectedLocationsCount: number;
  highRiskLocationsCount: number;
  avgStockOutDaysShift: number;
  totalDeficitQuantity: number;
  fleetRequiredCount: number;
  locationsComparison: {
    locationId: string;
    locationName: string;
    baselineRisk: number;
    simulatedRisk: number;
    riskDelta: number;
    baselineStockOutDays: number;
    simulatedStockOutDays: number;
    recommendedAddedSupply: number;
    status: RiskLevel;
  }[];
  copilotSummary: string;
}

export interface OperationalAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  type: 'STOCK_OUT_IMMINENT' | 'CRITICAL_INVENTORY' | 'DEMAND_SPIKE' | 'TRANSPORT_SHORTAGE' | 'ROUTE_DELAY' | 'ENVIRONMENTAL_HAZARD' | 'ABNORMAL_CONSUMPTION';
  locationId: string;
  locationName: string;
  itemCode?: string;
  itemName?: string;
  headline: string;
  reason: string;
  timestamp: string;
  recommendedAction: string;
  acknowledged: boolean;
}

export interface ExecutiveDashboardSummary {
  totalLocations: number;
  totalInventoryUnits: number;
  criticalItemsCount: number;
  predictedDemandNext7Days: number;
  atRiskLocationsCount: number;
  transportFleetUtilizationPercent: number;
  activeAlertsCount: number;
  averageReplenishmentLeadTimeDays: number;
  systemReliabilityScore: number;
  lastSimSync: string;
}

export interface PredictiveDecisionChainData {
  sector: LocationNode;
  item: InventoryItem;
  step1_Data: {
    historicalConsumption7Days: number[];
    currentStock: number;
    safetyStock: number;
    consumptionTrendPercent: number; // e.g. +18.4%
    inventoryDeltaPercent: number;    // e.g. -24.1%
    transportAvailabilityPercent: number; // e.g. -12%
    environmentalPenalty: number;
  };
  step2_Forecast: {
    predictedDailyDemand: number;
    baselineDailyDemand: number;
    demandIncreasePercent: number;
    modelConfidencePercent: number;
    expectedStockOutDays: number;
  };
  step3_Risk: {
    compositeScore: number;
    level: RiskLevel;
    breakdown: RiskFactorDecomposition;
    primaryDriver: string;
  };
  step4_Impact: {
    expectedStockOutDate: string;
    criticalDeficitUnits: number;
    operationalReadinessDropPercent: number;
    contingencyBufferHours: number;
  };
  step5_Recommendation: {
    actionRequired: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    reorderQuantity: number;
    dispatchRoute: string;
    recommendedAsset: string;
    estimatedTransitHours: number;
  };
}
