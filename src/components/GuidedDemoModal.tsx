/**
 * Logistics Management Portal - System Guidelines & Workflow Guide
 */

import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  ArrowRight,
} from 'lucide-react';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule: (moduleId: string) => void;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToModule,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: '1. Logistics Dashboard',
      moduleId: 'dashboard',
      badge: 'OVERVIEW',
      description: 'The dashboard provides immediate visibility into total inventory across all supply classes, items approaching critical safety buffers, pending replenishment orders, and overall vehicle fleet utilization.',
      guideline: 'Check the "Items Requiring Attention" table regularly to identify stores with days-of-supply dropping below lead time.',
    },
    {
      step: 2,
      title: '2. Risk & Alerts',
      moduleId: 'risk',
      badge: 'RISK REGISTRY',
      description: 'The Risk & Alerts table compiles a composite 0–100 score for each monitored location based on inventory drawdown, demand spikes, pass route conditions, weather friction, and lead time.',
      guideline: 'Locations flagged as Critical (score ≥ 80) require immediate replenishment dispatch authorization.',
    },
    {
      step: 3,
      title: '3. Demand Forecast',
      moduleId: 'forecast',
      badge: 'FORECASTING',
      description: 'The demand forecast module applies Ordinary Least Squares regression with 7-day harmonic seasonality and sub-zero weather multipliers to project daily demand across the upcoming 14 days.',
      guideline: 'Examine the 95% statistical confidence bounds to understand upper-bound variance during periods of adverse weather.',
    },
    {
      step: 4,
      title: '4. Locations & GIS',
      moduleId: 'map',
      badge: 'GIS MAPPING',
      description: 'The GIS module visually links location inventory to mountain pass corridors and road conditions (Clear, Unpaved, Landslide Risk, Snowbound), computing transit delays in real-time.',
      guideline: 'Review pass statuses before scheduling convoy movements to ensure selected vehicles meet road transit requirements.',
    },
    {
      step: 5,
      title: '5. Risk Analysis (Causal Trace)',
      moduleId: 'decision-chain',
      badge: 'CAUSAL TRACE',
      description: 'The Risk Analysis view traces the full reasoning chain: Ingestion Signals → Demand Forecast → Risk Scoring → Operational Impact → Recommended Action.',
      guideline: 'Logistics officers can inspect root causes and approve priority replenishment dispatches directly from this workflow.',
    },
    {
      step: 6,
      title: '6. Scenario Planning',
      moduleId: 'simulator',
      badge: 'PLANNING',
      description: 'The Scenario Planning module enables stress testing against contingency conditions: demand surges (±50%), fleet capacity deficits, blizzard severity, and lead time delays.',
      guideline: 'Run scenarios prior to seasonal pass closures to calculate additional forward buffer requirements.',
    },
    {
      step: 7,
      title: '7. Logistics Assistant',
      moduleId: 'copilot',
      badge: 'ASSISTANT',
      description: 'The Logistics Assistant utility answers operational questions grounded strictly in active database records, demand forecasts, and transport assignments.',
      guideline: 'Use the assistant for quick status summaries, stock-out horizon checks, and replenishment priority reviews.',
    },
  ];

  const current = steps[currentStep - 1];

  const handleGoToModule = () => {
    onNavigateToModule(current.moduleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full p-5 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">
                System Guidelines & Workflow Guide
              </h2>
              <p className="text-xs text-slate-400">
                Operating procedures for the central logistics management portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between gap-1">
          {steps.map(s => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s.step === currentStep
                  ? 'bg-blue-500'
                  : s.step < currentStep
                  ? 'bg-blue-800'
                  : 'bg-slate-700'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-900 border border-slate-700 rounded p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">Section {current.step} of 7</span>
            <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
              {current.badge}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white">
            {current.title}
          </h3>

          <div className="space-y-2 text-xs leading-relaxed">
            <p className="text-slate-200">
              {current.description}
            </p>
            <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded text-slate-300">
              <span className="font-semibold text-blue-300 block mb-0.5">Operating Guideline:</span>
              {current.guideline}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 rounded text-xs transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleGoToModule}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-medium transition-colors"
          >
            <span>Open {current.title.split('. ')[1]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
            disabled={currentStep === 7}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 rounded text-xs transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
