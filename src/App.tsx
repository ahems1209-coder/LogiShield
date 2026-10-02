/**
 * Logistics Management Portal - Main Application Orchestrator
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { ExecutiveDashboard } from './components/ExecutiveDashboard.js';
import { PredictiveDecisionChain } from './components/PredictiveDecisionChain.js';
import { DemandForecastingView } from './components/DemandForecastingView.js';
import { InventoryIntelligenceView } from './components/InventoryIntelligenceView.js';
import { RiskEngineView } from './components/RiskEngineView.js';
import { GisLogisticsView } from './components/GisLogisticsView.js';
import { TransportManagementView } from './components/TransportManagementView.js';
import { EnvironmentalView } from './components/EnvironmentalView.js';
import { IoTTelemetryView } from './components/IoTTelemetryView.js';
import { ReplenishmentView } from './components/ReplenishmentView.js';
import { WhatIfSimulatorView } from './components/WhatIfSimulatorView.js';
import { LogiCopilotView } from './components/LogiCopilotView.js';
import { AlertCenterView } from './components/AlertCenterView.js';
import { GuidedDemoModal } from './components/GuidedDemoModal.js';
import { api } from './services/api.js';

export default function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState<boolean>(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(4);
  const [isTelemetryActive, setIsTelemetryActive] = useState<boolean>(true);

  useEffect(() => {
    api.getDashboard().then(res => {
      setActiveAlertsCount(res.summary.activeAlertsCount);
    }).catch(err => console.error(err));

    api.getIoT().then(res => {
      setIsTelemetryActive(res.simulationActive);
    }).catch(err => console.error(err));
  }, []);

  const handleToggleTelemetry = async () => {
    try {
      const res = await api.toggleIoTSimulation();
      setIsTelemetryActive(res.simulationActive);
    } catch (err) {
      console.error(err);
    }
  };

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'dashboard': return 'Logistics Dashboard';
      case 'inventory': return 'Inventory Management';
      case 'forecast': return 'Demand Forecast';
      case 'risk': return 'Risk & Alerts';
      case 'map': return 'Locations & GIS';
      case 'transport': return 'Routes & Transport';
      case 'replenishment': return 'Replenishment Planning';
      case 'decision-chain': return 'Risk Analysis';
      case 'simulator': return 'Scenario Planning';
      case 'alerts': return 'Notifications';
      case 'copilot': return 'Logistics Assistant';
      case 'weather': return 'Weather & Terrain';
      case 'iot': return 'Field Sensors';
      default: return 'Logistics Portal';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentModuleTitle={getModuleTitle()}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenAssistant={() => setActiveModule('copilot')}
        isTelemetryActive={isTelemetryActive}
        onToggleTelemetry={handleToggleTelemetry}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={mod => setActiveModule(mod)}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-900/60">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && (
              <ExecutiveDashboard
                onSelectModule={mod => setActiveModule(mod)}
                onInspectSector={secId => {
                  setActiveModule('decision-chain');
                }}
              />
            )}

            {activeModule === 'decision-chain' && (
              <PredictiveDecisionChain
                onNavigateToForecast={() => setActiveModule('forecast')}
                onNavigateToReplenishment={() => setActiveModule('replenishment')}
              />
            )}

            {activeModule === 'forecast' && (
              <DemandForecastingView />
            )}

            {activeModule === 'inventory' && (
              <InventoryIntelligenceView />
            )}

            {activeModule === 'risk' && (
              <RiskEngineView
                onInspectChain={secId => {
                  setActiveModule('decision-chain');
                }}
              />
            )}

            {activeModule === 'map' && (
              <GisLogisticsView
                onInspectChain={secId => {
                  setActiveModule('decision-chain');
                }}
              />
            )}

            {activeModule === 'transport' && (
              <TransportManagementView />
            )}

            {activeModule === 'weather' && (
              <EnvironmentalView />
            )}

            {activeModule === 'iot' && (
              <IoTTelemetryView />
            )}

            {activeModule === 'replenishment' && (
              <ReplenishmentView />
            )}

            {activeModule === 'simulator' && (
              <WhatIfSimulatorView />
            )}

            {activeModule === 'copilot' && (
              <LogiCopilotView />
            )}

            {activeModule === 'alerts' && (
              <AlertCenterView
                onInspectLocation={locId => {
                  setActiveModule('map');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Guidelines Modal */}
      <GuidedDemoModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
        onNavigateToModule={mod => setActiveModule(mod)}
      />
    </div>
  );
}
