/**
 * Logistics Management Portal - Weather & Terrain Monitoring View
 */

import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { WeatherCondition } from '../types/index.js';

export const EnvironmentalView: React.FC = () => {
  const [conditions, setConditions] = useState<WeatherCondition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = () => {
    setLoading(true);
    api.getWeather().then(res => {
      setConditions(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Weather & Terrain Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Meteorological sensor readings across high-altitude mountain passes and their calculated logistics delay impact.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Weather Feeds</span>
        </button>
      </div>

      {/* Weather Stations Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 text-xs font-semibold text-white">
          Mountain Pass Weather Stations & Logistics Friction
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Station / Location</th>
                <th className="py-2.5 px-4 font-medium text-right">Temperature</th>
                <th className="py-2.5 px-4 font-medium text-right">Snow Depth</th>
                <th className="py-2.5 px-4 font-medium text-right">Wind Speed</th>
                <th className="py-2.5 px-4 font-medium text-right">Visibility</th>
                <th className="py-2.5 px-4 font-medium text-center">Accessibility Index</th>
                <th className="py-2.5 px-4 font-medium text-center">Delay Multiplier</th>
                <th className="py-2.5 px-4 font-medium">Meteorological Advisory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {conditions.map(c => {
                const isSevere = c.logisticsImpactScore >= 2.0;
                const isModerate = c.logisticsImpactScore >= 1.5;
                return (
                  <tr key={c.locationId} className="hover:bg-slate-750/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{c.locationName}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{c.temperatureCelsius}°C</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{c.snowfallCm} cm</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{c.windSpeedKmh} km/h</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">{c.visibilityMeters} m</td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={c.terrainAccessibilityScore <= 35 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                        {c.terrainAccessibilityScore} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isSevere ? 'bg-red-950 text-red-300 border border-red-800' :
                        isModerate ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-750 text-slate-300'
                      }`}>
                        {c.logisticsImpactScore}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm">{c.forecastSummary}</td>
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
