/**
 * Logistics Management Portal - Routes & Transport Management View
 */

import React, { useEffect, useState } from 'react';
import {
  Truck,
  RefreshCw,
  Navigation,
} from 'lucide-react';
import { api } from '../services/api.js';
import { TransportAsset, SupplyRoute } from '../types/index.js';

export const TransportManagementView: React.FC = () => {
  const [assets, setAssets] = useState<TransportAsset[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getTransport(),
      api.getRoutes(),
    ]).then(([transRes, routesRes]) => {
      setAssets(transRes.assets);
      setMetrics(transRes.metrics);
      setRoutes(routesRes);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAssets = assets.filter(a => {
    if (statusFilter === 'ALL') return true;
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Routes & Transport Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet allocation, vehicle payload utilization, and supply corridor transit tracking.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Fleet Status</span>
        </button>
      </div>

      {/* Fleet Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">Total Vehicles:</span>
            <div className="font-bold text-base font-mono text-white mt-0.5">{metrics.totalAssets} Units</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Available for Dispatch:</span>
            <div className="font-bold text-base font-mono text-emerald-400 mt-0.5">{metrics.availableAssets} Units</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Vehicles in Transit:</span>
            <div className="font-bold text-base font-mono text-blue-300 mt-0.5">{metrics.enRouteAssets} Units</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Under Maintenance:</span>
            <div className="font-bold text-base font-mono text-slate-300 mt-0.5">{metrics.maintenanceAssets} Units</div>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Overall Capacity Utilization:</span>
            <div className="font-bold text-base font-mono text-white mt-0.5">{metrics.overallUtilizationPercent}%</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Filter Vehicle Status:</span>
        {['ALL', 'AVAILABLE', 'EN_ROUTE', 'MAINTENANCE'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === st
                ? 'bg-blue-700 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Fleet Assets Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-semibold text-white">
          Transport Asset Fleet Registry
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Asset ID</th>
                <th className="py-2.5 px-4 font-medium">Vehicle Description</th>
                <th className="py-2.5 px-4 font-medium">Current Location</th>
                <th className="py-2.5 px-4 font-medium">Destination / Route</th>
                <th className="py-2.5 px-4 font-medium text-right">Payload Load / Capacity</th>
                <th className="py-2.5 px-4 font-medium text-right">Utilization</th>
                <th className="py-2.5 px-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {filteredAssets.map(asset => {
                const isAvail = asset.status === 'AVAILABLE';
                const isTransit = asset.status === 'EN_ROUTE';
                return (
                  <tr key={asset.id} className="hover:bg-slate-750/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-slate-400">{asset.assetTag}</td>
                    <td className="py-2.5 px-4 font-medium text-white">{asset.name}</td>
                    <td className="py-2.5 px-4 text-slate-300">Hub {asset.currentLocationId}</td>
                    <td className="py-2.5 px-4 text-slate-300">{asset.destinationLocationId ? `Sector ${asset.destinationLocationId}` : 'Standby Depot'}</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {asset.currentPayloadKg.toLocaleString()} / {asset.payloadCapacityKg.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold">
                      {asset.utilizationRate}%
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isAvail
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : isTransit
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : 'bg-slate-750 text-slate-300'
                      }`}>
                        {asset.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Corridors Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-semibold text-white">
          Active Supply Corridors & Road Conditions
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Corridor Name</th>
                <th className="py-2.5 px-4 font-medium">Origin to Destination</th>
                <th className="py-2.5 px-4 font-medium text-right">Distance</th>
                <th className="py-2.5 px-4 font-medium text-right">Standard Transit Time</th>
                <th className="py-2.5 px-4 font-medium text-right">Current Transit Time</th>
                <th className="py-2.5 px-4 font-medium text-center">Road Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {routes.map(r => (
                <tr key={r.id} className="hover:bg-slate-750/30 transition-colors">
                  <td className="py-2.5 px-4 font-medium text-white">{r.name}</td>
                  <td className="py-2.5 px-4 text-slate-300">{r.fromName} → {r.toName}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{r.distanceKm} km</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{r.transitHoursNominal} hrs</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-white">{r.transitHoursCurrent} hrs</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      r.roadCondition === 'CLEAR_ASPHALT' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      r.roadCondition === 'UNPAVED_GRAVEL' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {r.roadCondition.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
