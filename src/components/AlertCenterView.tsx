/**
 * Logistics Management Portal - Notifications & Operational Alerts View
 */

import React, { useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { OperationalAlert } from '../types/index.js';

interface AlertCenterViewProps {
  onInspectLocation?: (locationId: string) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({ onInspectLocation }) => {
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const loadData = () => {
    setLoading(true);
    api.getAlerts().then(res => {
      setAlerts(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational warning log for low inventory buffers, demand surges, road pass delays, and transport bottlenecks.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">Severity Filter:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(sev => (
          <button
            key={sev}
            onClick={() => setFilterSeverity(sev)}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              filterSeverity === sev
                ? 'bg-blue-700 text-white font-medium'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {sev} ({sev === 'ALL' ? alerts.length : alerts.filter(a => a.severity === sev).length})
          </button>
        ))}
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium text-center">Severity</th>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium">Notification Type</th>
                <th className="py-2.5 px-4 font-medium">Notification Summary</th>
                <th className="py-2.5 px-4 font-medium">Recommended Action</th>
                <th className="py-2.5 px-4 font-medium text-right">Timestamp</th>
                <th className="py-2.5 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {filteredAlerts.map(alert => {
                const isCritical = alert.severity === 'CRITICAL';
                const isHigh = alert.severity === 'HIGH';
                return (
                  <tr
                    key={alert.id}
                    className={`hover:bg-slate-750/30 transition-colors ${
                      alert.acknowledged ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isCritical
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-750 text-slate-300'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{alert.locationName}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {alert.type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-slate-200 max-w-sm">
                      <div className="font-semibold text-white">{alert.headline}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{alert.reason}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs">{alert.recommendedAction}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                      {alert.timestamp.slice(11, 19)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {alert.acknowledged ? (
                        <span className="text-slate-400 text-[11px] inline-flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors"
                        >
                          Acknowledge
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
    </div>
  );
};
