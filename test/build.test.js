import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite } from '../src/build.js';
import { signalFor } from '../src/nws.js';

test('classifies documented weather signals', () => {
  assert.equal(signalFor({ shortForecast: 'Thunderstorms likely', temperature: 70 }).type, 'Storm watch');
  assert.equal(signalFor({ shortForecast: 'Sunny', temperature: 94 }).type, 'Heat signal');
  assert.equal(signalFor({ shortForecast: 'Clear', temperature: 20 }).type, 'Freeze signal');
});

test('builds a source-linked weather dashboard without default monetization', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'weather-signal-'));
  const snapshot = { kind: 'nws-weather-signal', timestamp: '2026-08-19T00:00:00.000Z', locations: [{ label: 'Test City, ST', forecastUrl: 'https://api.weather.gov/gridpoints/TST/1,1/forecast', periods: [{ name: 'Today', temperature: 73, temperatureUnit: 'F', windSpeed: '5 mph', windDirection: 'NW', shortForecast: 'Sunny', precipitationChance: 0, signal: { type: 'Steady conditions', tone: 'calm' } }] }] };
  const prior = process.env.SITE_URL; process.env.SITE_URL = 'https://example.github.io/weather-signal-open-data';
  try {
    const result = await buildSite({ snapshot, outputDir }); const html = await readFile(path.join(outputDir, 'index.html'), 'utf8'); const robots = await readFile(path.join(outputDir, 'robots.txt'), 'utf8');
    assert.equal(result.pages, 2); assert.match(html, /Test City, ST/); assert.match(html, /Official weather\.gov/); assert.doesNotMatch(html, /paypal\.me/); assert.match(robots, /Allow: \//);
  } finally { if (prior === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = prior; await rm(outputDir, { recursive: true, force: true }); }
});
