/**
 * Logistics Management Portal - Enterprise Application Header
 */

import React from 'react';
import { 
  Building2, 
  HelpCircle, 
  MessageSquare,
  Radio,
  User
} from 'lucide-react';

interface HeaderProps {
  currentModuleTitle: string;
  onOpenGuidelines: () => void;
  onOpenAssistant: () => void;
  isTelemetryActive: boolean;
  onToggleTelemetry: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModuleTitle,
  onOpenGuidelines,
  onOpenAssistant,
  isTelemetryActive,
  onToggleTelemetry,
}) => {
  return (
    <header className="border-b border-slate-700 bg-slate-900 sticky top-0 z-40">
      {/* Top Environment & Operational Status Strip */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-1 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[11px] font-mono">
            Environment: DEMO
          </span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Central Logistics & Supply Chain Management Portal</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={onToggleTelemetry}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            title="Toggle live telemetry feed polling"
          >
            <Radio className={`w-3 h-3 ${isTelemetryActive ? 'text-blue-400' : 'text-slate-500'}`} />
            <span>Field Sensors: {isTelemetryActive ? 'Active' : 'Paused'}</span>
          </button>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="font-mono text-slate-400">System Time: 02 Oct 2026, 14:55</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Organization & Current Location */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-700 flex items-center justify-center text-white font-semibold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight text-white leading-tight">
                Logistics Management System
              </div>
              <div className="text-[11px] text-slate-400">
                Supply Chain & Forward Transport Control
              </div>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">{currentModuleTitle}</span>
          </div>
        </div>

        {/* Right: Functional Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenGuidelines}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>User Guidelines</span>
          </button>

          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Logistics Assistant</span>
          </button>

          {/* User Account */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-right">
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight text-left">
              <p className="text-xs font-medium text-slate-200">V. Ramanathan</p>
              <p className="text-[10px] text-slate-400">Logistics Officer</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
