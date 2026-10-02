/**
 * Logistics Management Portal - Demand Forecasting Analytics View
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api } from '../services/api.js';
import { InventoryItem, ItemForecast } from '../types/index.js';

export const DemandForecastingView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('inv-b01');
  const [forecast, setForecast] = useState<ItemForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getInventory().then(res => {
      setItems(res);
    });
  }, []);

  const loadForecast = (id: string) => {
    setLoading(true);
    api.getForecast(id).then(res => {
      setForecast(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadForecast(selectedItemId);
  }, [selectedItemId]);

  if (loading && !forecast) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Calculating demand projections...
      </div>
    );
  }

  if (!forecast) return null;

  // Prepare chart series combining 14-day history and 14-day future forecast
  const historySlice = (forecast.historicalPoints || []).slice(-14);
  const chartData = [
    ...historySlice.map((h, i) => ({
      period: `-${14 - i}d`,
      historical: h.consumption,
      forecast: null as number | null,
      upperBound: null as number | null,
      lowerBound: null as number | null,
      projectedStock: null as number | null,
    })),
    ...forecast.forecastNext14Days.map(f => ({
      period: `+${f.dayNumber}d (${f.date.slice(5)})`,
      historical: null as number | null,
      forecast: f.predictedDemand,
      upperBound: f.upperBound95,
      lowerBound: f.lowerBound95,
      projectedStock: f.projectedStock,
    })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Demand Forecast
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical demand forecasting based on historical consumption, weekly seasonality, and lead-time factors.
          </p>
        </div>

        {/* Resource Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Select Item:</span>
          <select
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
          >
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.locationName.split(' ')[0]} - {item.name.slice(0, 30)} ({item.itemCode})
              </option>
            ))}
          </select>

          <button
            onClick={() => loadForecast(selectedItemId)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Recalculate Forecast"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Model Evaluation Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
        <div>
          <span className="text-slate-400 text-[11px]">Model Type:</span>
          <div className="font-semibold text-white mt-0.5">OLS + 7-Day Harmonics</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">R² Score (Goodness of Fit):</span>
          <div className="font-mono font-bold text-slate-200 mt-0.5">{forecast.metrics.r2Score}</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">RMSE (Mean Error):</span>
          <div className="font-mono font-bold text-slate-200 mt-0.5">{forecast.metrics.rmse} units</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">MAE (Absolute Error):</span>
          <div className="font-mono font-bold text-slate-200 mt-0.5">{forecast.metrics.mae} units</div>
        </div>
        <div>
          <span className="text-slate-400 text-[11px]">Confidence Level:</span>
          <div className="font-mono font-bold text-blue-400 mt-0.5">{forecast.metrics.confidencePercent}% (95% CI)</div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-slate-800/60 border border-slate-700 rounded p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
          <div>
            <h2 className="text-sm font-semibold text-white">
              14-Day Demand Projection & Confidence Interval
            </h2>
            <p className="text-[11px] text-slate-400">
              Showing actual historical daily demand transitioning into projected demand with 95% confidence bounds
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Current Stock: <strong className="text-white">{forecast.currentStock.toLocaleString()}</strong></span>
            <span>Stock-Out Horizon: <strong className={forecast.expectedStockOutDays && forecast.expectedStockOutDays <= 5 ? 'text-red-400' : 'text-slate-200'}>
              {forecast.expectedStockOutDate ? `${forecast.expectedStockOutDays} Days (${forecast.expectedStockOutDate})` : 'Adequate (>14d)'}
            </strong></span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="ciFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" tickLine={false} />
              <YAxis yAxisId="demand" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis yAxisId="stock" orientation="right" stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', borderRadius: '4px', fontSize: '11px', color: '#f8fafc' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              <Line yAxisId="demand" type="monotone" dataKey="historical" name="Historical Demand" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5 }} />
              <Line yAxisId="demand" type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2.5 }} />
              <Area yAxisId="demand" type="monotone" dataKey="upperBound" name="95% Upper Bound" stroke="#60a5fa" strokeWidth={1} strokeDasharray="2 2" fill="url(#ciFill)" />
              <Line yAxisId="demand" type="monotone" dataKey="lowerBound" name="95% Lower Bound" stroke="#60a5fa" strokeWidth={1} strokeDasharray="2 2" dot={false} />
              <Line yAxisId="stock" type="monotone" dataKey="projectedStock" name="Projected Remaining Stock" stroke="#ef4444" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast Summary Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-semibold text-white">
          Forecast Summary & Calculated Reorder Requirement
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Selected Item</th>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium text-right">Current Daily Demand</th>
                <th className="py-2.5 px-4 font-medium text-right">Forecast Daily Demand</th>
                <th className="py-2.5 px-4 font-medium text-right">Projected Change</th>
                <th className="py-2.5 px-4 font-medium text-right">Expected Stock-Out</th>
                <th className="py-2.5 px-4 font-medium text-right">Recommended Reorder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              <tr>
                <td className="py-3 px-4 font-medium text-white">{forecast.itemName}</td>
                <td className="py-3 px-4 text-slate-300">{forecast.locationName}</td>
                <td className="py-3 px-4 text-right font-mono">
                  {items.find(i => i.id === selectedItemId)?.averageDailyConsumption} units/day
                </td>
                <td className="py-3 px-4 text-right font-mono font-semibold text-amber-300">
                  {forecast.forecastNext14Days[0]?.predictedDemand} units/day
                </td>
                <td className="py-3 px-4 text-right font-mono text-amber-400 font-semibold">
                  {(() => {
                    const currentAvg = items.find(i => i.id === selectedItemId)?.averageDailyConsumption || 1;
                    const predFirst = forecast.forecastNext14Days[0]?.predictedDemand || currentAvg;
                    const diff = (((predFirst - currentAvg) / currentAvg) * 100).toFixed(1);
                    return Number(diff) >= 0 ? `+${diff}%` : `${diff}%`;
                  })()}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {forecast.expectedStockOutDate ? `${forecast.expectedStockOutDays} days (${forecast.expectedStockOutDate})` : 'Adequate (>14d)'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">
                  +{forecast.recommendedReorderQty.toLocaleString()} units
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
