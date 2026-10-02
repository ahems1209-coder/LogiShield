/**
 * Logistics Management Portal - Enterprise Sidebar Navigation
 */

import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Truck,
  PackageCheck,
  GitBranch,
  SlidersHorizontal,
  Bell,
  MessageSquare,
  CloudSun,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  activeAlertsCount,
}) => {
  const sections = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'forecast', label: 'Demand Forecast', icon: TrendingUp },
        { id: 'risk', label: 'Risk & Alerts', icon: AlertTriangle },
      ],
    },
    {
      group: 'LOGISTICS',
      items: [
        { id: 'map', label: 'Locations & GIS', icon: MapPin },
        { id: 'transport', label: 'Routes & Transport', icon: Truck },
        { id: 'replenishment', label: 'Replenishment', icon: PackageCheck },
        { id: 'weather', label: 'Weather & Terrain', icon: CloudSun },
        { id: 'iot', label: 'Field Sensors', icon: Radio },
      ],
    },
    {
      group: 'ANALYTICS',
      items: [
        { id: 'decision-chain', label: 'Risk Analysis', icon: GitBranch },
        { id: 'simulator', label: 'Scenario Planning', icon: SlidersHorizontal },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'alerts', label: 'Notifications', icon: Bell, badge: activeAlertsCount },
        { id: 'copilot', label: 'Logistics Assistant', icon: MessageSquare },
      ],
    },
  ];

  return (
    <aside className="w-60 border-r border-slate-700 bg-slate-900/90 flex flex-col shrink-0 min-h-[calc(100vh-73px)]">
      <div className="p-3 space-y-5 flex-1 overflow-y-auto">
        {sections.map(section => (
          <div key={section.group}>
            <div className="px-2.5 pb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectModule(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors text-xs ${
                      isActive
                        ? 'bg-blue-900/50 text-blue-200 font-medium border border-blue-700/60'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* System Status Footnote */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/60">
        <div className="flex items-center justify-between">
          <span>System Status:</span>
          <span className="text-slate-300">Operational</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
          <span>Version 3.2.0</span>
          <span>Build 10-2026</span>
        </div>
      </div>
    </aside>
  );
};
