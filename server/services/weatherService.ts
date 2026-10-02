/**
 * LogiShield AI - Open-Meteo Meteorological Weather Integration Service
 */

import { WeatherCondition } from '../../src/types/index.js';
import { WEATHER_CONDITIONS, LOCATIONS } from '../data/syntheticDatabase.js';

export async function fetchLiveWeatherConditions(): Promise<WeatherCondition[]> {
  try {
    // Fetch live weather for Sector Bravo (Glacier Ridge lat=34.580, lng=76.750) from Open-Meteo
    const targetLoc = LOCATIONS.find(l => l.id === 'loc-02');
    if (targetLoc) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLoc.coordinates[0]}&longitude=${targetLoc.coordinates[1]}&current=temperature_2m,wind_speed_10m,snowfall,visibility`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        if (current) {
          const temp = current.temperature_2m || -28;
          const wind = current.wind_speed_10m || 68;
          const snow = current.snowfall || 45;
          const vis = current.visibility || 180;

          // Compute impact score
          const impact = Number((1.0 + Math.abs(temp < 0 ? temp : 0) * 0.03 + (wind / 50) + (snow / 20)).toFixed(2));
          const accessibility = Math.max(10, Math.round(100 - (impact * 30)));

          return WEATHER_CONDITIONS.map(w => {
            if (w.locationId === 'loc-02') {
              return {
                ...w,
                temperatureCelsius: Math.round(temp),
                windSpeedKmh: Math.round(wind),
                snowfallCm: Math.round(snow),
                visibilityMeters: Math.round(vis),
                terrainAccessibilityScore: accessibility,
                logisticsImpactScore: impact,
                lastUpdated: new Date().toISOString(),
              };
            }
            return w;
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[LogiShield Weather] Open-Meteo API call unavailable. Using cached weather conditions:', err.message);
  }

  return WEATHER_CONDITIONS;
}
