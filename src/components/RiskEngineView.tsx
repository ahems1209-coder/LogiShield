/**
 * Logistics Management Portal - Risk & Alerts View
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { api } from '../services/api.js';
import { LocationRiskReport } from '../types/index.js';

interface RiskEngineViewProps {
  onInspectChain?: (sectorId: string) => void;
}

export const RiskEngineView: React.FC<RiskEngineViewProps> = ({ onInspectChain }) => {
  const [reports, setReports] = useState<LocationRiskReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    api.getRiskReports().then(res => {
      setReports(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const criticalCount = reports.filter(r => r.riskLevel === 'CRITICAL').length;
  const highCount = reports.filter(r => r.riskLevel === 'HIGH').length;
  const elevatedCount = reports.filter(r => r.riskLevel === 'ELEVATED').length;
  const normalCount = reports.filter(r => r.riskLevel === 'NOMINAL').length;

  const filtered = reports.filter(r => {
    if (filterLevel === 'ALL') return true;
    return r.riskLevel === filterLevel;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Risk & Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational supply risk assessment evaluated across inventory drawdown, demand surges, transport route bottlenecks, and weather conditions.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Risk Summary Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setFilterLevel(filterLevel === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className={`p-3 rounded text-left border transition-colors ${
            filterLevel === 'CRITICAL'
              ? 'bg-red-950/60 border-red-700'
              : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="text-[11px] font-medium text-red-400 uppercase">Critical Risk</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{criticalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Immediate resupply required</div>
        </button>

        <button
          onClick={() => setFilterLevel(filterLevel === 'HIGH' ? 'ALL' : 'HIGH')}
          className={`p-3 rounded text-left border transition-colors ${
            filterLevel === 'HIGH'
              ? 'bg-amber-950/60 border-amber-700'
              : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="text-[11px] font-medium text-amber-400 uppercase">High Risk</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{highCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Review inventory buffer</div>
        </button>

        <button
          onClick={() => setFilterLevel(filterLevel === 'ELEVATED' ? 'ALL' : 'ELEVATED')}
          className={`p-3 rounded text-left border transition-colors ${
            filterLevel === 'ELEVATED'
              ? 'bg-slate-750 border-slate-600'
              : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="text-[11px] font-medium text-slate-300 uppercase">Medium / Elevated</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{elevatedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Standard monitoring</div>
        </button>

        <button
          onClick={() => setFilterLevel(filterLevel === 'NOMINAL' ? 'ALL' : 'NOMINAL')}
          className={`p-3 rounded text-left border transition-colors ${
            filterLevel === 'NOMINAL'
              ? 'bg-emerald-950/60 border-emerald-700'
              : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="text-[11px] font-medium text-emerald-400 uppercase">Normal Status</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{normalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Adequate supply buffers</div>
        </button>
      </div>

      {/* Main Risk Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Location Supply Risk Registry</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Showing {filtered.length} locations (Filter: {filterLevel})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium text-center">Risk Level</th>
                <th className="py-2.5 px-4 font-medium text-center">Score (0–100)</th>
                <th className="py-2.5 px-4 font-medium">Primary Reason</th>
                <th className="py-2.5 px-4 font-medium text-center">Critical Items</th>
                <th className="py-2.5 px-4 font-medium">Recommended Action</th>
                <th className="py-2.5 px-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {filtered.map(report => {
                const isCritical = report.riskLevel === 'CRITICAL';
                const isHigh = report.riskLevel === 'HIGH';
                return (
                  <tr key={report.locationId} className="hover:bg-slate-750/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-white">
                      {report.locationName}
                    </td>

                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isCritical
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {report.riskLevel}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono font-bold">
                      <span className={isCritical ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-slate-300'}>
                        {report.compositeRiskScore}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 max-w-sm">
                      {report.highContributingFactors[0]}
                    </td>

                    <td className="py-2.5 px-4 text-center font-mono">
                      {report.stockOutImminentCount > 0 ? (
                        <span className="text-red-400 font-semibold">{report.stockOutImminentCount} depleting</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-slate-300 max-w-md">
                      {report.recommendedAction}
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => onInspectChain && onInspectChain(report.locationId)}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Review Analysis
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
