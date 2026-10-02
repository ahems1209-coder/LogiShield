/**
 * Logistics Management Portal - Replenishment Planning Workflow
 */

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Plus,
} from 'lucide-react';
import { api } from '../services/api.js';
import { ReplenishmentRecommendation } from '../types/index.js';

export const ReplenishmentView: React.FC = () => {
  const [recommendations, setRecommendations] = useState<ReplenishmentRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    api.getReplenishments().then(res => {
      setRecommendations(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (rec: ReplenishmentRecommendation) => {
    try {
      setDispatchingId(rec.id);
      await api.dispatchReplenishment(rec.id);
      setStatusMessage(`Approved and staged replenishment order for ${rec.itemName} to ${rec.locationName}.`);
      loadData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setDispatchingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === recommendations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(recommendations.map(r => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Replenishment Planning
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated replenishment queue calculated using Lead Time Demand, Current Stock, and Safety Stock buffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recalculate</span>
          </button>

          <button
            onClick={() => {
              if (recommendations[0]) handleApprove(recommendations[0]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Priority 1</span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono">
            {selectedIds.length} of {recommendations.length} items selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={selectedIds.length === 0}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            Review Selected
          </button>
          <button
            disabled={selectedIds.length === 0}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            Create Procurement Request
          </button>
        </div>
      </div>

      {/* Main Workflow Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === recommendations.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 bg-slate-800"
                  />
                </th>
                <th className="py-2.5 px-3 font-medium">Location</th>
                <th className="py-2.5 px-3 font-medium">Item Description</th>
                <th className="py-2.5 px-3 font-medium text-right">Current Stock</th>
                <th className="py-2.5 px-3 font-medium text-right">Reorder Point</th>
                <th className="py-2.5 px-3 font-medium text-right">Required Quantity</th>
                <th className="py-2.5 px-3 font-medium text-center">Priority</th>
                <th className="py-2.5 px-3 font-medium">Origin Depot & Transport</th>
                <th className="py-2.5 px-3 font-medium text-center">Status</th>
                <th className="py-2.5 px-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {recommendations.map(rec => {
                const isSelected = selectedIds.includes(rec.id);
                const isCritical = rec.priority === 'CRITICAL';
                const isHigh = rec.priority === 'HIGH';
                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-750/30 transition-colors ${
                      isSelected ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rec.id)}
                        className="rounded border-slate-700 bg-slate-800"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {rec.locationName}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-200">{rec.itemName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{rec.itemCode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {rec.currentStock.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {rec.reorderPoint.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      +{rec.recommendedOrderQty.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isCritical
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {rec.priority}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{rec.suggestedOriginDepotName}</div>
                      <div className="text-[10px] text-slate-400">{rec.suggestedTransportMode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {rec.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleApprove(rec)}
                        disabled={dispatchingId === rec.id}
                        className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        {dispatchingId === rec.id ? 'Staging...' : 'Approve'}
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
