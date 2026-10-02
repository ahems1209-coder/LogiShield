/**
 * Logistics Management Portal - Scenario Planning View
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../services/api.js';
import { WhatIfScenarioInput, WhatIfScenarioResult } from '../types/index.js';

export const WhatIfSimulatorView: React.FC = () => {
  const [params, setParams] = useState<WhatIfScenarioInput>({
    demandModifierPercent: 20,
    transportCapacityPercent: -15,
    weatherSeverityLevel: 'SEVERE',
    leadTimeModifierDays: 2,
    currentInventoryModifierPercent: 0,
  });

  const [result, setResult] = useState<WhatIfScenarioResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runScenario = (inputParams: WhatIfScenarioInput) => {
    setLoading(true);
    api.runSimulation(inputParams).then(res => {
      setResult(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    runScenario(params);
  }, []);

  const handleReset = () => {
    const defaultParams: WhatIfScenarioInput = {
      demandModifierPercent: 0,
      transportCapacityPercent: 0,
      weatherSeverityLevel: 'NORMAL',
      leadTimeModifierDays: 0,
      currentInventoryModifierPercent: 0,
    };
    setParams(defaultParams);
    runScenario(defaultParams);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Scenario Planning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Simulate operational contingency conditions: demand surges, route disruptions, weather severity, and inventory shifts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={() => runScenario(params)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Scenario</span>
          </button>
        </div>
      </div>

      {/* Scenario Inputs Form */}
      <div className="bg-slate-800/80 border border-slate-700 rounded p-4 space-y-4">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
          Scenario Input Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          {/* Input 1: Demand Change */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Daily Demand Change:</span>
              <span className="font-mono font-bold text-blue-300">
                {params.demandModifierPercent >= 0 ? `+${params.demandModifierPercent}%` : `${params.demandModifierPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="60"
              step="5"
              value={params.demandModifierPercent}
              onChange={e => {
                const val = Number(e.target.value);
                setParams(prev => ({ ...prev, demandModifierPercent: val }));
                runScenario({ ...params, demandModifierPercent: val });
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-40%</span>
              <span>0% Baseline</span>
              <span>+60%</span>
            </div>
          </div>

          {/* Input 2: Transport Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Transport Fleet Capacity:</span>
              <span className={`font-mono font-bold ${params.transportCapacityPercent < 0 ? 'text-amber-400' : 'text-blue-300'}`}>
                {params.transportCapacityPercent >= 0 ? `+${params.transportCapacityPercent}%` : `${params.transportCapacityPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={params.transportCapacityPercent}
              onChange={e => {
                const val = Number(e.target.value);
                setParams(prev => ({ ...prev, transportCapacityPercent: val }));
                runScenario({ ...params, transportCapacityPercent: val });
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>-50% (Deficit)</span>
              <span>100%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Input 3: Weather Severity */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Weather Impact Severity:</span>
              <span className="font-mono font-bold text-amber-300">
                {params.weatherSeverityLevel}
              </span>
            </div>
            <select
              value={params.weatherSeverityLevel}
              onChange={e => {
                const val = e.target.value as any;
                setParams(prev => ({ ...prev, weatherSeverityLevel: val }));
                runScenario({ ...params, weatherSeverityLevel: val });
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="LOW">Low (Clear Pass Mobility)</option>
              <option value="NORMAL">Normal (Standard Seasonal Delay)</option>
              <option value="SEVERE">Severe (Snow & Ice Restricted)</option>
              <option value="EXTREME_BLIZZARD">Extreme Blizzard (Pass Closure)</option>
            </select>
          </div>

          {/* Input 4: Lead Time Shift */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-300">Lead Time Delay:</span>
              <span className="font-mono font-bold text-slate-200">
                +{params.leadTimeModifierDays} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={params.leadTimeModifierDays}
              onChange={e => {
                const val = Number(e.target.value);
                setParams(prev => ({ ...prev, leadTimeModifierDays: val }));
                runScenario({ ...params, leadTimeModifierDays: val });
              }}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 days (On time)</span>
              <span>+7 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scenario Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
              <span className="text-slate-400">Affected Locations:</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {result.affectedLocationsCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Locations experiencing stock shift</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
              <span className="text-slate-400">High Risk Locations:</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                {result.highRiskLocationsCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Risk score ≥ 65</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
              <span className="text-slate-400">Projected Supply Deficit:</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                +{result.totalDeficitQuantity.toLocaleString()} <span className="text-xs text-slate-400 font-normal">units</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Additional supply required</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-xs">
              <span className="text-slate-400">Additional Transport Requirement:</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {result.fleetRequiredCount} Convoys
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Standard 6x6 truck equivalents</div>
            </div>
          </div>

          {/* Scenario Overview Note */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-white block mb-0.5">Scenario Summary:</span>
            {result.copilotSummary}
          </div>

          {/* Location-by-Location Comparison Table */}
          <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-semibold text-white">
              Location Comparison: Baseline vs Scenario
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Location</th>
                    <th className="py-2.5 px-3 font-medium text-center">Baseline Risk</th>
                    <th className="py-2.5 px-3 font-medium text-center">Scenario Risk</th>
                    <th className="py-2.5 px-3 font-medium text-center">Risk Change</th>
                    <th className="py-2.5 px-3 font-medium text-center">Baseline Stock Days</th>
                    <th className="py-2.5 px-3 font-medium text-center">Scenario Stock Days</th>
                    <th className="py-2.5 px-3 font-medium text-right">Added Supply Deficit</th>
                    <th className="py-2.5 px-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-200">
                  {result.locationsComparison.map(loc => (
                    <tr key={loc.locationId} className="hover:bg-slate-750/30 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-white">{loc.locationName}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{loc.baselineRisk}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">{loc.simulatedRisk}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">
                        <span className={loc.riskDelta > 0 ? 'text-amber-400' : 'text-slate-400'}>
                          {loc.riskDelta > 0 ? `+${loc.riskDelta}` : `${loc.riskDelta}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{loc.baselineStockOutDays}d</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-white">{loc.simulatedStockOutDays}d</td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {loc.recommendedAddedSupply > 0 ? (
                          <span className="text-amber-400 font-semibold">+{loc.recommendedAddedSupply.toLocaleString()} units</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          loc.status === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-800' :
                          loc.status === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {loc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
