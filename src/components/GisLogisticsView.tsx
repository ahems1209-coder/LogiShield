/**
 * Logistics Management Portal - GIS & Locations View
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.js';
import { LocationNode, SupplyRoute, WeatherCondition } from '../types/index.js';

interface GisLogisticsViewProps {
  onInspectChain?: (sectorId: string) => void;
}

export const GisLogisticsView: React.FC<GisLogisticsViewProps> = ({ onInspectChain }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [locations, setLocations] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [weatherList, setWeatherList] = useState<WeatherCondition[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterRouteStatus, setFilterRouteStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getLocations(),
      api.getRoutes(),
      api.getWeather(),
    ]).then(([locs, rts, wth]) => {
      setLocations(locs);
      setRoutes(rts);
      setWeatherList(wth);
      setSelectedLocation(locs.find(l => l.id === 'loc-02') || locs[0]);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || locations.length === 0) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [34.35, 76.65],
        zoom: 9,
        zoomControl: true,
      });

      // Standard CartoDB Dark Matter / Positron layer for clean enterprise mapping
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 16,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Draw route corridors
    routes.forEach(r => {
      if (filterRouteStatus !== 'ALL' && r.roadCondition !== filterRouteStatus) return;

      const strokeColor =
        r.roadCondition === 'CLEAR_ASPHALT' ? '#10b981' :
        r.roadCondition === 'UNPAVED_GRAVEL' ? '#f59e0b' :
        r.roadCondition === 'LANDSLIDE_RISK' ? '#f97316' : '#ef4444';

      const polyline = L.polyline(r.coordinates, {
        color: strokeColor,
        weight: 3,
        opacity: 0.8,
      }).addTo(map);

      polyline.bindTooltip(
        `<div style="font-size: 11px;"><strong>${r.name}</strong><br/>Status: ${r.roadCondition.replace(/_/g, ' ')} (${r.transitHoursCurrent} hrs)</div>`,
        { sticky: true }
      );
    });

    // Draw location markers
    locations.forEach(loc => {
      if (filterRisk !== 'ALL' && loc.riskLevel !== filterRisk) return;

      const markerColor =
        loc.riskLevel === 'CRITICAL' ? '#ef4444' :
        loc.riskLevel === 'HIGH' ? '#f59e0b' : '#3b82f6';

      const customIcon = L.divIcon({
        className: 'standard-gis-pin',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            background: ${markerColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 9px;
            font-weight: 600;
          ">
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker(loc.coordinates, { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedLocation(loc);
      });

      marker.bindTooltip(
        `<div style="font-size: 11px;"><strong>${loc.name}</strong><br/>Risk: ${loc.riskLevel} (${loc.riskScore}/100)</div>`,
        { direction: 'top', offset: [0, -8] }
      );
    });
  }, [locations, routes, filterRisk, filterRouteStatus]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Locations & Route GIS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial tracking of forward locations, supply depots, mountain pass routes, and transit conditions.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-300">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Warning / High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-slate-300">Critical</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Filters + Center Map + Right Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Filter & Location List Panel */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4 space-y-4 text-xs">
          <div>
            <span className="font-semibold text-white block mb-2">Filter by Risk:</span>
            <select
              value={filterRisk}
              onChange={e => setFilterRisk(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Risk</option>
              <option value="NOMINAL">Normal Status</option>
            </select>
          </div>

          <div>
            <span className="font-semibold text-white block mb-2">Filter by Route Condition:</span>
            <select
              value={filterRouteStatus}
              onChange={e => setFilterRouteStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Route Statuses</option>
              <option value="CLEAR_ASPHALT">Clear Asphalt</option>
              <option value="UNPAVED_GRAVEL">Unpaved Gravel</option>
              <option value="LANDSLIDE_RISK">Landslide Risk</option>
              <option value="SNOW_ICE_BOUND">Snow & Ice Bound</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-700">
            <span className="font-semibold text-white block mb-2">Quick Select Location:</span>
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`w-full text-left px-2 py-1.5 rounded transition-colors text-[11px] truncate flex items-center justify-between ${
                    selectedLocation?.id === loc.id
                      ? 'bg-blue-900/50 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate">{loc.name}</span>
                  <span className={`text-[10px] font-mono px-1 py-0.2 rounded shrink-0 ${
                    loc.riskScore >= 80 ? 'text-red-400' :
                    loc.riskScore >= 65 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {loc.riskScore}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Map */}
        <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700 rounded h-[500px] overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Right Information Panel */}
        <div className="bg-slate-800/80 border border-slate-700 rounded p-4 space-y-4 text-xs flex flex-col justify-between">
          {selectedLocation ? (
            <div className="space-y-3">
              <div className="border-b border-slate-700 pb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Location ID: {selectedLocation.code}</span>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedLocation.name}</h2>
                <div className="text-[11px] text-slate-400">Elevation: {selectedLocation.elevationMeters}m · Terrain: {selectedLocation.terrain.replace(/_/g, ' ')}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tracked Item Types:</span>
                  <span className="font-mono font-bold text-white">{selectedLocation.itemCount || 4} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Critical / Depleting Items:</span>
                  <span className={`font-mono font-bold ${selectedLocation.criticalItemCount > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                    {selectedLocation.criticalItemCount || 0} items
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Assessment:</span>
                  <span className={`font-medium ${selectedLocation.riskScore >= 80 ? 'text-red-400' : selectedLocation.riskScore >= 65 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {selectedLocation.riskLevel} ({selectedLocation.riskScore}/100)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Priority Replenishment:</span>
                  <span className="font-mono text-slate-200">
                    {selectedLocation.riskScore >= 80 ? 'Required (Priority P1)' : selectedLocation.riskScore >= 65 ? 'Required (Priority P2)' : 'Nominal Buffer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance from Base:</span>
                  <span className="font-mono text-slate-200">{selectedLocation.distanceFromBaseKm} km</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 border border-slate-700 rounded text-slate-300 leading-snug">
                <span className="font-semibold text-slate-200 block mb-0.5">Route Status Note:</span>
                Pass corridor is currently {selectedLocation.riskScore >= 80 ? 'ice-restricted. All-weather heavy convoys required.' : 'clear for standard transport movements.'}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Click a location on the map to view details.
            </div>
          )}

          {selectedLocation && (
            <div className="pt-2 border-t border-slate-700">
              <button
                onClick={() => onInspectChain && onInspectChain(selectedLocation.id)}
                className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white rounded font-medium text-xs transition-colors"
              >
                View Detailed Risk Analysis
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
