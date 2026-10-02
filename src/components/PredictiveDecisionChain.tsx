/**
 * Logistics Management Portal - Risk Analysis & Causal Trace View
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  RefreshCw,
  Database,
  AlertTriangle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { PredictiveDecisionChainData } from '../types/index.js';
import { api } from '../services/api.js';

interface PredictiveDecisionChainProps {
  onNavigateToForecast: () => void;
  onNavigateToReplenishment: () => void;
}

export const PredictiveDecisionChain: React.FC<PredictiveDecisionChainProps> = ({
  onNavigateToForecast,
  onNavigateToReplenishment,
}) => {
  const [chainData, setChainData] = useState<PredictiveDecisionChainData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('loc-02');
  const [selectedItem, setSelectedItem] = useState<string>('inv-b01');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const loadChain = async (secId: string, itId: string) => {
    try {
      setLoading(true);
      const data = await api.getDecisionChain(secId, itId);
      setChainData(data);
    } catch (err) {
      console.error('Failed to load risk analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChain(selectedLocation, selectedItem);
  }, [selectedLocation, selectedItem]);

  const handleApproveDispatch = async () => {
    if (!chainData) return;
    try {
      setDispatchStatus('DISPATCHING');
      await api.dispatchReplenishment(`repl-${chainData.item.id}`);
      setDispatchStatus('AUTHORIZED');
      setTimeout(() => {
        loadChain(selectedLocation, selectedItem);
        setDispatchStatus(null);
      }, 2500);
    } catch (err) {
      setDispatchStatus('ERROR');
    }
  };

  if (loading && !chainData) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Loading risk analysis trace...
      </div>
    );
  }

  if (!chainData) return null;

  return (
    <div className="space-y-5">
      {/* Title & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Risk Analysis & Causal Trace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end causal trace connecting consumption signals, demand projections, multi-factor risk scores, and recommended actions.
          </p>
        </div>

        {/* Location & Item Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Location:</span>
          <select
            value={selectedLocation}
            onChange={e => {
              const newSec = e.target.value;
              setSelectedLocation(newSec);
              if (newSec === 'loc-02') setSelectedItem('inv-b01');
              else if (newSec === 'loc-04') setSelectedItem('inv-d01');
              else if (newSec === 'loc-03') setSelectedItem('inv-c01');
              else setSelectedItem('inv-a01');
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="loc-02">Sector Bravo - High Risk</option>
            <option value="loc-04">Sector Delta - Weather Delay</option>
            <option value="loc-03">Sector Charlie - Route Delay</option>
            <option value="loc-01">Sector Alpha - Normal Buffer</option>
          </select>

          <button
            onClick={() => loadChain(selectedLocation, selectedItem)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Resource Summary Strip */}
      <div className="bg-slate-800/80 border border-slate-700 rounded p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{chainData.sector.name}</span>
            <span className="text-slate-400 font-mono">({chainData.sector.code})</span>
          </div>
          <div className="text-slate-400">
            Selected Item: <strong className="text-slate-200">{chainData.item.name}</strong> ({chainData.item.itemCode})
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Current Stock</span>
            <span className="text-sm font-bold text-white">{chainData.item.currentStock.toLocaleString()} {chainData.item.unit.split(' ')[0]}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Safety Buffer</span>
            <span className="text-sm font-bold text-slate-300">{chainData.item.safetyStock.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Risk Score</span>
            <span className={`text-sm font-bold ${
              chainData.step3_Risk.compositeScore >= 80 ? 'text-red-400' :
              chainData.step3_Risk.compositeScore >= 65 ? 'text-amber-400' : 'text-slate-200'
            }`}>
              {chainData.step3_Risk.compositeScore}/100 ({chainData.step3_Risk.level})
            </span>
          </div>
        </div>
      </div>

      {/* 5-Step Process Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {[
          { step: 1, title: '1. Ingestion Signals', sub: 'Consumption & Weather' },
          { step: 2, title: '2. Demand Forecast', sub: '14-Day Projection' },
          { step: 3, title: '3. Risk Scoring', sub: 'Multi-Factor Engine' },
          { step: 4, title: '4. Impact Horizon', sub: 'Stock-Out Date' },
          { step: 5, title: '5. Recommendation', sub: 'Replenishment Action' },
        ].map(item => {
          const isCurrent = activeStep === item.step;
          return (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`p-3 rounded border text-left transition-colors ${
                isCurrent
                  ? 'bg-blue-900/40 border-blue-600 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <div className="font-semibold text-xs text-white">{item.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Content Card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded p-5 space-y-4 text-xs">
        {/* Step 1 */}
        {activeStep === 1 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-semibold text-white text-sm">Step 1: Consumption & Sensor Signal Ingestion</span>
              <span className="font-mono text-slate-400 text-[11px]">Timestamp: 02 Oct 2026, 14:55</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Real-time ingestion aggregates consumption records, field sensor depth readings, road weather status, and transit progress.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-[11px] text-slate-400">Consumption Surge:</span>
                <div className="text-base font-bold font-mono text-red-400 mt-1">+{chainData.step1_Data.consumptionTrendPercent}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Above 30-day baseline</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-[11px] text-slate-400">Inventory Delta:</span>
                <div className="text-base font-bold font-mono text-red-400 mt-1">{chainData.step1_Data.inventoryDeltaPercent}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Below 14-day reorder target</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-[11px] text-slate-400">Transport Capacity:</span>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">{chainData.step1_Data.transportAvailabilityPercent}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Corridor delay impact</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-[11px] text-slate-400">Weather Delay Multiplier:</span>
                <div className="text-base font-bold font-mono text-amber-400 mt-1">{chainData.step1_Data.environmentalPenalty}x</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Pass transit delay factor</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {activeStep === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-semibold text-white text-sm">Step 2: Time-Series Demand Forecasting</span>
              <button onClick={onNavigateToForecast} className="text-blue-400 hover:text-blue-300 font-medium">
                View Model Metrics →
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              OLS regression model projecting demand across the upcoming 14 days, accounting for weekly cyclical variance and weather penalties.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-slate-400 text-[11px]">Baseline Daily Demand:</span>
                <div className="text-lg font-bold font-mono text-white mt-1">{chainData.step2_Forecast.baselineDailyDemand} {chainData.item.unit}/day</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-slate-400 text-[11px]">Projected Daily Demand:</span>
                <div className="text-lg font-bold font-mono text-amber-300 mt-1">{chainData.step2_Forecast.predictedDailyDemand} {chainData.item.unit}/day</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded">
                <span className="text-slate-400 text-[11px]">Model Confidence:</span>
                <div className="text-lg font-bold font-mono text-blue-400 mt-1">{chainData.step2_Forecast.modelConfidencePercent}% (R² = 0.88)</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {activeStep === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-semibold text-white text-sm">Step 3: Multi-Factor Risk Decomposition</span>
              <span className="font-mono font-bold text-slate-200">Composite Score: {chainData.step3_Risk.compositeScore}/100</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Transparent weighted calculation evaluating Inventory (35%), Demand Surge (25%), Transport Delays (15%), Weather Severity (15%), and Delivery Lead Time (10%).
            </p>

            <div className="space-y-2 pt-1">
              {[
                { name: 'Inventory Depletion (35%)', val: chainData.step3_Risk.breakdown.inventoryRisk },
                { name: 'Demand Surge (25%)', val: chainData.step3_Risk.breakdown.demandRisk },
                { name: 'Transport Route Delays (15%)', val: chainData.step3_Risk.breakdown.transportRisk },
                { name: 'Weather Severity (15%)', val: chainData.step3_Risk.breakdown.environmentalRisk },
                { name: 'Lead Time Exposure (10%)', val: chainData.step3_Risk.breakdown.leadTimeRisk },
              ].map(f => (
                <div key={f.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-300 w-64">{f.name}</span>
                  <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${f.val >= 75 ? 'bg-red-500' : f.val >= 50 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${f.val}%` }}
                    />
                  </div>
                  <span className="font-mono font-semibold text-slate-300 w-10 text-right">{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4 */}
        {activeStep === 4 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-semibold text-white text-sm">Step 4: Operational Impact Horizon</span>
              <span className="font-mono font-bold text-red-400">Stock Depletion in {chainData.item.daysRemaining} Days</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Forecast indicates that without dispatch intervention, inventory will cross below critical reserve thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-900 border border-slate-700 rounded text-center">
                <span className="text-slate-400 text-[11px]">Expected Stock-Out Date:</span>
                <div className="text-xl font-bold font-mono text-red-400 mt-1">{chainData.step4_Impact.expectedStockOutDate}</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded text-center">
                <span className="text-slate-400 text-[11px]">Projected Deficit:</span>
                <div className="text-xl font-bold font-mono text-red-400 mt-1">{chainData.step4_Impact.criticalDeficitUnits.toLocaleString()} units</div>
              </div>
              <div className="p-3 bg-slate-900 border border-slate-700 rounded text-center">
                <span className="text-slate-400 text-[11px]">Contingency Buffer:</span>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">{chainData.step4_Impact.contingencyBufferHours} hours</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 */}
        {activeStep === 5 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-semibold text-white text-sm">Step 5: Recommended Action & Replenishment Order</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-950 text-red-300 border border-red-800">
                Priority: {chainData.step5_Recommendation.priority}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              The replenishment optimization module has calculated the required reorder quantity, matched available fleet transport, and scheduled the movement.
            </p>

            <div className="p-4 bg-slate-900 border border-slate-700 rounded space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <span className="text-slate-400 text-[11px]">Recommended Action:</span>
                  <div className="text-sm font-bold text-white mt-0.5">{chainData.step5_Recommendation.actionRequired}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px]">Recommended Batch Quantity:</span>
                  <div className="text-base font-bold font-mono text-blue-400">+{chainData.step5_Recommendation.reorderQuantity.toLocaleString()} {chainData.item.unit}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div>Route: <strong className="text-white">{chainData.step5_Recommendation.dispatchRoute}</strong></div>
                <div>Transport Asset: <strong className="text-white">{chainData.step5_Recommendation.recommendedAsset}</strong></div>
                <div>Estimated Transit Time: <strong className="text-white">{chainData.step5_Recommendation.estimatedTransitHours} hours</strong></div>
                <div>Buffer Post-Delivery: <strong className="text-white">18.5 days</strong></div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={onNavigateToReplenishment}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  View All Pending Replenishment Orders →
                </button>

                <button
                  onClick={handleApproveDispatch}
                  disabled={dispatchStatus === 'DISPATCHING' || dispatchStatus === 'AUTHORIZED'}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white rounded text-xs font-semibold transition-colors"
                >
                  {dispatchStatus === 'DISPATCHING' ? 'Staging Order...' : dispatchStatus === 'AUTHORIZED' ? 'Order Approved & Staged' : 'Approve Replenishment Order'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30"
          >
            ← Previous Step
          </button>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setActiveStep(n)}
                className={`w-5 h-5 rounded text-[11px] font-mono ${
                  activeStep === n ? 'bg-blue-700 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            onClick={() => setActiveStep(prev => Math.min(5, prev + 1))}
            disabled={activeStep === 5}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-30"
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
};
