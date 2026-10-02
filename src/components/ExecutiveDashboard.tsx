/**
 * Logistics Management Portal - Enterprise Logistics Dashboard
 */

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  PackageCheck,
  Truck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api.js';
import { ExecutiveDashboardSummary, InventoryItem, LocationRiskReport } from '../types/index.js';

interface ExecutiveDashboardProps {
  onSelectModule: (moduleId: string) => void;
  onInspectSector?: (sectorId: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onSelectModule,
  onInspectSector,
}) => {
  const [data, setData] = useState<{
    summary: ExecutiveDashboardSummary;
    riskDistribution: { name: string; count: number; fill: string }[];
    categoryAggregates: { category: string; stock: number; demand: number; gap: number }[];
    topRisks: LocationRiskReport[];
  } | null>(null);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [replenishmentList, setReplenishmentList] = useState<any[]>([]);
  const [transportMetrics, setTransportMetrics] = useState<any | null>(null);
  const [forecastPoints, setForecastPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getInventory(),
      api.getReplenishments(),
      api.getTransport(),
      api.getForecast('inv-b01'),
    ]).then(([dashRes, invRes, replRes, transRes, fcRes]) => {
      setData(dashRes);
      setInventoryItems(invRes);
      setReplenishmentList(replRes);
      setTransportMetrics(transRes.metrics);

      // Build forecast series dynamically
      const hist = (fcRes.historicalPoints || []).slice(-7);
      const fut = (fcRes.forecastNext14Days || []).slice(0, 6);
      const chartPoints = [
        ...hist.map(h => ({ period: h.date.slice(5), historical: h.consumption, forecast: null })),
        ...fut.map(f => ({ period: `${f.date.slice(5)} (F)`, historical: null, forecast: f.predictedDemand }))
      ];
      setForecastPoints(chartPoints);

      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs font-mono">
        Loading logistics dashboard data...
      </div>
    );
  }

  const { summary } = data;

  // Dynamic Chart 1: Inventory Status by Category
  const inventoryCategoryData = data.categoryAggregates.map(cat => ({
    category: cat.category,
    currentStock: cat.stock,
    safetyStock: Math.round(cat.stock * 0.4),
  }));

  // Dynamic Chart 2: Demand Forecast
  const demandForecastData = forecastPoints;

  // Table items requiring attention (filter for critical/high or low days remaining)
  const itemsRequiringAttention = inventoryItems
    .filter(item => item.daysRemaining <= 10 || item.riskLevel === 'CRITICAL' || item.riskLevel === 'HIGH')
    .slice(0, 7);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Logistics Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of inventory, demand, transport, and supply risks across forward locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400 font-mono">
            Last updated: <span className="text-slate-200">02 Oct 2026, 14:55</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Maximum 4 metrics, clean, no glowing) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>TOTAL INVENTORY</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {summary.totalInventoryUnits.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            20 monitored depot & outpost locations
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>AT-RISK ITEMS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {summary.criticalItemsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Days remaining ≤ 5 days or below safety stock
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>PENDING REPLENISHMENT</span>
            <PackageCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {replenishmentList.length} <span className="text-xs text-slate-400 font-normal">orders</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {replenishmentList.filter(r => r.priority === 'CRITICAL').length} critical priority, {replenishmentList.filter(r => r.priority !== 'CRITICAL').length} standard priority
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>TRANSPORT AVAILABLE</span>
            <Truck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {summary.transportFleetUtilizationPercent}% <span className="text-xs text-slate-400 font-normal">utilization</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {transportMetrics ? `${transportMetrics.availableAssets} vehicles ready for dispatch, ${transportMetrics.enRouteAssets} in transit` : 'Fleet status active'}
          </div>
        </div>
      </div>

      {/* 3. Charts Row: Inventory Status & Demand Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Inventory Status */}
        <div className="bg-slate-800/60 border border-slate-700 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Inventory Status by Supply Class</h2>
              <p className="text-[11px] text-slate-400">Current available inventory compared to minimum safety threshold</p>
            </div>
            <button
              onClick={() => onSelectModule('inventory')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <span>View Inventory</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="currentStock" name="Current Stock" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="safetyStock" name="Safety Buffer" fill="#64748b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Demand Forecast */}
        <div className="bg-slate-800/60 border border-slate-700 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Demand Forecast Trend</h2>
              <p className="text-[11px] text-slate-400">Class III High-Altitude Fuel (7-day actual vs 7-day forecast)</p>
            </div>
            <button
              onClick={() => onSelectModule('forecast')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <span>View Forecast</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demandForecastData} margin={{ top: 10, right: 15, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
                />
                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="historical" name="Historical Demand" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Items Requiring Attention (Clean Enterprise Table) */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Items Requiring Attention</h2>
            <p className="text-[11px] text-slate-400">Stores approaching replenishment reorder point or critical stock levels</p>
          </div>
          <button
            onClick={() => onSelectModule('risk')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View All Risk Alerts →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium">Item</th>
                <th className="py-2.5 px-4 font-medium text-right">Current Stock</th>
                <th className="py-2.5 px-4 font-medium text-right">Daily Consumption</th>
                <th className="py-2.5 px-4 font-medium text-right">Days Remaining</th>
                <th className="py-2.5 px-4 font-medium text-center">Risk Level</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {itemsRequiringAttention.map(item => {
                const isCritical = item.riskLevel === 'CRITICAL' || item.daysRemaining <= 4;
                const isHigh = item.riskLevel === 'HIGH' || item.daysRemaining <= 7;
                return (
                  <tr key={item.id} className="hover:bg-slate-750/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium">
                      {item.locationName}
                    </td>
                    <td className="py-2.5 px-4">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.itemCode}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {item.currentStock.toLocaleString()} <span className="text-[10px] text-slate-400">{item.unit.split(' ')[0]}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {item.predictedDailyConsumption}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      <span className={isCritical ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-slate-300'}>
                        {item.daysRemaining} days
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isCritical
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isCritical ? (
                        <button
                          onClick={() => onSelectModule('replenishment')}
                          className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-[11px] font-medium transition-colors"
                        >
                          Replenish
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectModule('decision-chain')}
                          className="text-slate-300 hover:text-white text-[11px] font-medium"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Transport Fleet Status Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Transport Fleet Status</h2>
            <p className="text-[11px] text-slate-400">Available vehicles, movements in transit, and capacity utilization</p>
          </div>
          <button
            onClick={() => onSelectModule('transport')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            Manage Transport Fleet →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b border-slate-700 bg-slate-900/40 text-xs">
          <div>
            <span className="text-slate-400">Available Vehicles:</span>
            <div className="text-base font-bold text-white font-mono mt-0.5">{transportMetrics ? transportMetrics.availableAssets : 6} Units</div>
          </div>
          <div>
            <span className="text-slate-400">Vehicles in Transit:</span>
            <div className="text-base font-bold text-blue-300 font-mono mt-0.5">{transportMetrics ? transportMetrics.enRouteAssets : 4} Units</div>
          </div>
          <div>
            <span className="text-slate-400">Under Scheduled Maintenance:</span>
            <div className="text-base font-bold text-slate-300 font-mono mt-0.5">{transportMetrics ? transportMetrics.maintenanceAssets : 2} Units</div>
          </div>
          <div>
            <span className="text-slate-400">Weather-Restricted Movement:</span>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{transportMetrics ? transportMetrics.groundedAssets : 1} Pass Route</div>
          </div>
        </div>
      </div>
    </div>
  );
};
