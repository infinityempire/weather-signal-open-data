// Data source: api.weather.gov public data. This collector uses only official endpoints and identifies the application.
import 'dotenv/config';
import { setWeatherSnapshot } from './store.js';

const POINTS_URL = 'https://api.weather.gov/points';
export const LOCATIONS = [
  { id: 'new-york', label: 'New York, NY', lat: 40.7128, lon: -74.006 },
  { id: 'chicago', label: 'Chicago, IL', lat: 41.8781, lon: -87.6298 },
  { id: 'miami', label: 'Miami, FL', lat: 25.7617, lon: -80.1918 },
  { id: 'denver', label: 'Denver, CO', lat: 39.7392, lon: -104.9903 },
  { id: 'los-angeles', label: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
  { id: 'seattle', label: 'Seattle, WA', lat: 47.6062, lon: -122.3321 }
];

export function signalFor(period) {
  const text = `${period.shortForecast ?? ''} ${period.detailedForecast ?? ''}`.toLowerCase();
  const temperature = Number(period.temperature ?? 0);
  if (/(tornado|severe thunderstorm|thunderstorm)/.test(text)) return { type: 'Storm watch', tone: 'storm', rationale: 'Forecast language includes thunderstorm or severe-weather terms.' };
  if (/(rain|showers|drizzle|precipitation|snow|sleet)/.test(text)) return { type: 'Wet conditions', tone: 'rain', rationale: 'Forecast language includes precipitation terms.' };
  if (/(windy|gust|breezy)/.test(text)) return { type: 'Wind watch', tone: 'wind', rationale: 'Forecast language includes wind terms.' };
  if (temperature >= 90) return { type: 'Heat signal', tone: 'heat', rationale: 'Forecast temperature is at least 90°F.' };
  if (temperature <= 32) return { type: 'Freeze signal', tone: 'cold', rationale: 'Forecast temperature is at or below 32°F.' };
  return { type: 'Steady conditions', tone: 'calm', rationale: 'No configured heat, freeze, precipitation, wind, or storm signal was detected.' };
}

function userAgent() { return process.env.NWS_USER_AGENT || 'WeatherSignalOpenData/1.0 (contact: github.com/infinityempire/weather-signal-open-data)'; }
async function getJson(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { Accept: 'application/geo+json', 'User-Agent': userAgent() } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.title || data.detail || `NWS API returned HTTP ${response.status}.`);
  return data;
}

export async function fetchLocationForecast(location, { fetchImpl = fetch } = {}) {
  const points = await getJson(`${POINTS_URL}/${location.lat},${location.lon}`, fetchImpl);
  const forecastUrl = points.properties?.forecast;
  if (!forecastUrl) throw new Error(`NWS did not provide a forecast URL for ${location.label}.`);
  const forecast = await getJson(forecastUrl, fetchImpl);
  const periods = (forecast.properties?.periods ?? []).slice(0, 4).map((period) => ({
    name: period.name, startTime: period.startTime, endTime: period.endTime, isDaytime: period.isDaytime,
    temperature: period.temperature, temperatureUnit: period.temperatureUnit, windSpeed: period.windSpeed,
    windDirection: period.windDirection, shortForecast: period.shortForecast, detailedForecast: period.detailedForecast,
    precipitationChance: period.probabilityOfPrecipitation?.value ?? null, signal: signalFor(period)
  }));
  return { ...location, forecastUrl, updated: forecast.properties?.updated ?? null, periods };
}

export async function collectWeatherSnapshot({ fetchImpl = fetch, now = new Date(), locations = LOCATIONS } = {}) {
  const forecasts = [];
  for (const location of locations) forecasts.push(await fetchLocationForecast(location, { fetchImpl }));
  return {
    kind: 'nws-weather-signal', timestamp: now.toISOString(), title: 'Weather Signal Open Data',
    source: { name: 'National Weather Service API', url: 'https://api.weather.gov', disclaimerUrl: 'https://www.weather.gov/disclaimer' },
    methodology: 'Forecast periods are collected sequentially from the official NWS API. Signals are simple, documented labels applied to current forecast text and temperature; they are not official warnings or predictions.',
    locations: forecasts
  };
}

export async function runCollection() { const snapshot = await collectWeatherSnapshot(); await setWeatherSnapshot(snapshot); return snapshot; }
