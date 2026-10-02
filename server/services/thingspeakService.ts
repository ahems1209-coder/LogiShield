/**
 * LogiShield AI - ThingSpeak IoT Telemetry Integration Service
 */

import { IoTSensorTelemetry } from '../../src/types/index.js';
import { IOT_SENSORS } from '../data/syntheticDatabase.js';

export async function fetchThingSpeakTelemetry(): Promise<{
  sensors: IoTSensorTelemetry[];
  source: 'THINGSPEAK_LIVE' | 'FALLBACK_SYNTHETIC';
  lastUpdate: string;
}> {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const readKey = process.env.THINGSPEAK_READ_API_KEY;

  if (channelId && readKey) {
    try {
      const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readKey}&results=5`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.feeds && data.feeds.length > 0) {
          const latestFeed = data.feeds[data.feeds.length - 1];
          const liveValue = Number(parseFloat(latestFeed.field1 || '26.6').toFixed(1));

          // Merge live ThingSpeak channel feed into Sector Bravo Tank Sensor
          const mergedSensors = IOT_SENSORS.map(s => {
            if (s.sensorId === 'IOT-BRAVO-FUEL-01') {
              return {
                ...s,
                telemetryValue: liveValue,
                lastBeaconTimestamp: latestFeed.created_at || new Date().toISOString(),
                label: 'THINGSPEAK LIVE FEED' as const,
              };
            }
            return s;
          });

          return {
            sensors: mergedSensors,
            source: 'THINGSPEAK_LIVE',
            lastUpdate: new Date().toISOString(),
          };
        }
      }
    } catch (err: any) {
      console.warn('[LogiShield IoT] ThingSpeak API unavailable or timed out. Using fallback telemetry:', err.message);
    }
  }

  return {
    sensors: IOT_SENSORS,
    source: 'FALLBACK_SYNTHETIC',
    lastUpdate: new Date().toISOString(),
  };
}
