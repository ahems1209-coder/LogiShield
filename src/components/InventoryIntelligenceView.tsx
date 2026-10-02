/**
 * Logistics Management Portal - Enterprise Inventory Management
 */

import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { InventoryItem } from '../types/index.js';

export const InventoryIntelligenceView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = () => {
    setLoading(true);
    api.getInventory().then(res => {
      setItems(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = [...items];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        i => i.name.toLowerCase().includes(q) ||
             i.itemCode.toLowerCase().includes(q) ||
             i.locationName.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'ALL') {
      result = result.filter(i => i.category === selectedCategory);
    }

    if (selectedLocation !== 'ALL') {
      result = result.filter(i => i.locationId === selectedLocation);
    }

    if (selectedRisk !== 'ALL') {
      result = result.filter(i => i.riskLevel === selectedRisk);
    }

    // Default sort by days remaining ascending
    result.sort((a, b) => a.daysRemaining - b.daysRemaining);

    setFilteredItems(result);
  }, [items, searchTerm, selectedCategory, selectedLocation, selectedRisk]);

  const uniqueLocations = Array.from(new Set(items.map(i => JSON.stringify({ id: i.locationId, name: i.locationName }))))
    .map(s => JSON.parse(s));

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Current stock holdings, daily consumption rates, and calculated reorder thresholds across all locations.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Inventory</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 border border-slate-700 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name, item code, or location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="CLASS_III_POL_FUEL">Class III (Fuel / POL)</option>
            <option value="CLASS_I_RATIONS">Class I (Rations)</option>
            <option value="CLASS_V_AMMUNITION">Class V (Ammunition)</option>
            <option value="CLASS_VIII_MEDICAL">Class VIII (Medical Supplies)</option>
            <option value="CLASS_II_EQUIPMENT">Class II (Equipment & Gear)</option>
            <option value="CLASS_IX_SPARES">Class IX (Vehicle Spares)</option>
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Locations</option>
            {uniqueLocations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical (≤ 4 Days)</option>
            <option value="HIGH">High (5–7 Days)</option>
            <option value="ELEVATED">Elevated</option>
            <option value="NOMINAL">Normal</option>
          </select>
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing {filteredItems.length} of {items.length} records
        </div>
      </div>

      {/* Main Inventory Table with Side Detail Panel */}
      <div className="flex gap-4 items-start">
        {/* Table Area */}
        <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Item Code</th>
                  <th className="py-2.5 px-3 font-medium">Item Description</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium text-right">Current Stock</th>
                  <th className="py-2.5 px-3 font-medium text-right">Safety Stock</th>
                  <th className="py-2.5 px-3 font-medium text-right">Daily Demand</th>
                  <th className="py-2.5 px-3 font-medium text-right">Days Remaining</th>
                  <th className="py-2.5 px-3 font-medium text-right">Reorder Point</th>
                  <th className="py-2.5 px-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {filteredItems.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const isCritical = item.daysRemaining <= 4;
                  const isHigh = item.daysRemaining <= 7;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-950/40 text-white'
                          : 'hover:bg-slate-750/30'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {item.itemCode}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.locationName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {item.currentStock.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">{item.unit.split(' ')[0]}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {item.safetyStock.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.predictedDailyConsumption}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        <span className={isCritical ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-slate-300'}>
                          {item.daysRemaining} days
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {item.reorderPoint.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isCritical
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : isHigh
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {isCritical ? 'Critical' : isHigh ? 'High Risk' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Row Detail Panel (Right Sidebar) */}
        {selectedItem && (
          <div className="w-80 bg-slate-800 border border-slate-700 rounded p-4 space-y-4 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-semibold text-white">Item Specification</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase">{selectedItem.itemCode}</span>
              <h3 className="text-sm font-bold text-white leading-tight">{selectedItem.name}</h3>
              <p className="text-xs text-slate-300 mt-1">Location: {selectedItem.locationName}</p>
            </div>

            <div className="space-y-2 text-xs pt-1 border-t border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-mono text-slate-200">{selectedItem.category.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stock:</span>
                <span className="font-mono font-bold text-white">{selectedItem.currentStock.toLocaleString()} {selectedItem.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safety Buffer:</span>
                <span className="font-mono text-slate-300">{selectedItem.safetyStock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Capacity:</span>
                <span className="font-mono text-slate-300">{selectedItem.capacityMax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Demand (Avg / Pred):</span>
                <span className="font-mono text-slate-200">{selectedItem.averageDailyConsumption} / {selectedItem.predictedDailyConsumption}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Replenishment Lead Time:</span>
                <span className="font-mono text-slate-200">{selectedItem.leadTimeDays} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Days Remaining:</span>
                <span className="font-mono font-bold text-amber-400">{selectedItem.daysRemaining} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reorder Point:</span>
                <span className="font-mono text-slate-200">{selectedItem.reorderPoint.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 leading-snug">
              <span className="font-medium text-slate-200 block mb-1">Stock Status Note:</span>
              {selectedItem.currentStock <= selectedItem.reorderPoint
                ? `Stock (${selectedItem.currentStock}) is below the calculated reorder point (${selectedItem.reorderPoint}). Replenishment order recommended.`
                : 'Current stock is above the reorder point. Inventory buffer remains adequate.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
