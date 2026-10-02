/**
 * Logistics Management Portal - Field Sensor Telemetry View
 */

import React, { useEffect, useState } from 'react';
import {
  Radio,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.js';
import { IoTSensorTelemetry } from '../types/index.js';

export const IoTTelemetryView: React.FC = () => {
  const [sensors, setSensors] = useState<IoTSensorTelemetry[]>([]);
  const [isSimActive, setIsSimActive] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = () => {
    api.getIoT().then(res => {
      setSensors(res.sensors);
      setIsSimActive(res.simulationActive);
      setLastUpdate(res.lastUpdate);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSim = async () => {
    const res = await api.toggleIoTSimulation();
    setIsSimActive(res.simulationActive);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Field Sensor Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active digital telemetry monitoring forward fuel tank depth percentages, cold-chain storage temperatures, and crate seal sensors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSim}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
          >
            <Radio className={`w-3.5 h-3.5 ${isSimActive ? 'text-blue-400' : 'text-slate-500'}`} />
            <span>Telemetry Polling: {isSimActive ? 'Active' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Sensors Table */}
      <div className="bg-slate-800/60 border border-slate-700 rounded overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Active Sensor Devices</span>
          <span className="text-slate-400 font-mono text-[11px]">
            Polling Interval: 5 seconds · Last Received: {lastUpdate ? lastUpdate.slice(11, 19) + ' UTC' : 'Syncing...'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4 font-medium">Sensor ID</th>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium">Store Code</th>
                <th className="py-2.5 px-4 font-medium">Measurement Type</th>
                <th className="py-2.5 px-4 font-medium text-right">Telemetry Value</th>
                <th className="py-2.5 px-4 font-medium text-center">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Battery</th>
                <th className="py-2.5 px-4 font-medium text-right">Signal</th>
                <th className="py-2.5 px-4 font-medium text-right">Last Beacon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 text-slate-200">
              {sensors.map(sensor => {
                const isAlarm = sensor.storageConditionStatus === 'ALARM';
                return (
                  <tr key={sensor.sensorId} className="hover:bg-slate-750/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{sensor.sensorId}</td>
                    <td className="py-3 px-4 font-medium text-white">{sensor.locationName}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{sensor.itemCode}</td>
                    <td className="py-3 px-4 text-slate-300">{sensor.sensorType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={isAlarm ? 'text-red-400' : 'text-slate-100'}>
                        {sensor.telemetryValue} {sensor.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isAlarm
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-750 text-slate-300'
                      }`}>
                        {sensor.storageConditionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{sensor.batteryPercent}%</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{sensor.signalStrengthDbm} dBm</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">{sensor.lastBeaconTimestamp.slice(11, 19)}</td>
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
