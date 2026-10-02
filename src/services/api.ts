/**
 * LogiShield AI - Frontend API Service Client
 */

import {
  ExecutiveDashboardSummary,
  InventoryItem,
  ItemForecast,
  LocationNode,
  LocationRiskReport,
  OperationalAlert,
  PredictiveDecisionChainData,
  ReplenishmentRecommendation,
  SupplyRoute,
  TransportAsset,
  WeatherCondition,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  IoTSensorTelemetry
} from '../types/index.js';

export const api = {
  // Token Helpers
  getToken(): string | null {
    return localStorage.getItem('logishield_auth_token');
  },

  setToken(token: string): void {
    localStorage.setItem('logishield_auth_token', token);
  },

  clearToken(): void {
    localStorage.removeItem('logishield_auth_token');
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ success: boolean; token: string; user: { id: string; email: string; name: string; role: string } }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async register(email: string, password: string, name: string, role?: string): Promise<{ success: boolean; token: string; user: { id: string; email: string; name: string; role: string } }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getMe(): Promise<{ success: boolean; user: { userId: string; email: string; role: string; name: string } }> {
    const res = await fetch('/api/auth/me', {
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to retrieve current user session');
    return res.json();
  },

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { ...this.getAuthHeaders() },
      });
    } catch {
      // Ignore network errors on logout
    }
    this.clearToken();
    return { success: true };
  },

  async getDashboard(): Promise<{
    summary: ExecutiveDashboardSummary;
    riskDistribution: { name: string; count: number; fill: string }[];
    categoryAggregates: { category: string; stock: number; demand: number; gap: number }[];
    topRisks: LocationRiskReport[];
    recentAlerts: OperationalAlert[];
  }> {
    const res = await fetch('/api/dashboard', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  async getLocations(): Promise<(LocationNode & { riskScore: number; riskLevel: string; weatherImpact: number; itemCount: number; criticalItemCount: number })[]> {
    const res = await fetch('/api/locations', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load locations');
    return res.json();
  },

  async getInventory(sectorId?: string, category?: string): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    if (sectorId) params.append('sectorId', sectorId);
    if (category) params.append('category', category);
    const res = await fetch(`/api/inventory?${params.toString()}`, { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load inventory');
    return res.json();
  },

  async getForecast(itemId?: string): Promise<ItemForecast> {
    const url = itemId ? `/api/forecast/${itemId}` : '/api/forecast';
    const res = await fetch(url, { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load forecast data');
    return res.json();
  },

  async getRiskReports(): Promise<LocationRiskReport[]> {
    const res = await fetch('/api/risk', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load risk reports');
    return res.json();
  },

  async getTransport(): Promise<{
    assets: TransportAsset[];
    metrics: {
      totalAssets: number;
      availableAssets: number;
      enRouteAssets: number;
      maintenanceAssets: number;
      groundedAssets: number;
      totalCapacityKg: number;
      utilizedCapacityKg: number;
      overallUtilizationPercent: number;
    };
  }> {
    const res = await fetch('/api/transport', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load transport data');
    return res.json();
  },

  async getRoutes(): Promise<(SupplyRoute & { fromName: string; toName: string; coordinates: [[number, number], [number, number]] })[]> {
    const res = await fetch('/api/routes', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load routes');
    return res.json();
  },

  async getWeather(): Promise<WeatherCondition[]> {
    const res = await fetch('/api/weather', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load weather data');
    return res.json();
  },

  async getIoT(): Promise<{
    sensors: IoTSensorTelemetry[];
    simulationActive: boolean;
    lastUpdate: string;
  }> {
    const res = await fetch('/api/iot', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load IoT telemetry');
    return res.json();
  },

  async toggleIoTSimulation(): Promise<{ simulationActive: boolean }> {
    const res = await fetch('/api/iot/toggle-simulation', {
      method: 'POST',
      headers: { ...this.getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to toggle IoT simulation');
    return res.json();
  },

  async getReplenishments(): Promise<ReplenishmentRecommendation[]> {
    const res = await fetch('/api/replenishment', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load replenishment queue');
    return res.json();
  },

  async dispatchReplenishment(recommendationId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/replenishment/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ recommendationId }),
    });
    if (!res.ok) throw new Error('Failed to dispatch replenishment');
    return res.json();
  },

  async runSimulation(params: WhatIfScenarioInput): Promise<WhatIfScenarioResult> {
    const res = await fetch('/api/simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run simulation');
    return res.json();
  },

  async getAlerts(): Promise<OperationalAlert[]> {
    const res = await fetch('/api/alerts', { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/alerts/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ alertId }),
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async getDecisionChain(sectorId?: string, itemId?: string): Promise<PredictiveDecisionChainData> {
    const url = sectorId
      ? `/api/decision-chain/${sectorId}${itemId ? `/${itemId}` : ''}`
      : '/api/decision-chain';
    const res = await fetch(url, { headers: { ...this.getAuthHeaders() } });
    if (!res.ok) throw new Error('Failed to load decision chain');
    return res.json();
  },

  async queryCopilot(userQuery: string, selectedSectorId?: string): Promise<{
    reply: string;
    citedEntities: {
      sectors: string[];
      items: string[];
      priorityAction: string;
    };
  }> {
    const res = await fetch('/api/copilot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify({ userQuery, selectedSectorId }),
    });
    if (!res.ok) throw new Error('Failed to query LogiCopilot');
    return res.json();
  },
};
