import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite } from '../src/build.js';
import { classifyOfficialStatus, dependencyPosture, stabilityFor } from '../src/status.js';

test('normalizes documented official status severities and derives a transparent score', () => {
  assert.equal(classifyOfficialStatus('operational').weight, 0);
  assert.equal(classifyOfficialStatus('degraded_performance').weight, 12);
  assert.equal(classifyOfficialStatus('major_outage').weight, 55);
  const result = stabilityFor({ summary: { status: { indicator: 'minor', description: 'Minor System Outage' }, components: [{ name: 'API', status: 'degraded_performance' }] }, incidents: [{ name: 'Recent incident', status: 'resolved', impact: 'major', created_at: '2026-08-18T00:00:00.000Z', resolved_at: '2026-08-18T01:00:00.000Z' }], now: new Date('2026-08-19T00:00:00.000Z') });
  assert.equal(result.score, 75); assert.equal(result.deductions.current, 12); assert.equal(result.deductions.recentHistory, 13);
  assert.equal(dependencyPosture([{ name: 'A', score: 100, current: { tone: 'steady' } }, { name: 'B', score: 80, current: { tone: 'watch' } }]).label, 'Single-provider watch');
});

test('builds a source-linked dependency dashboard without default monetization', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'dependency-lens-'));
  const snapshot = { kind: 'dependency-stability-lens', timestamp: '2026-08-20T00:00:00.000Z', portfolio: { label: 'Diversified posture', rationale: 'No tracked provider is below the threshold.' }, providers: [{ name: 'Test Provider', officialUrl: 'https://status.example.com', focus: 'Test dependency', score: 94, current: { label: 'Operational', tone: 'steady', officialDescription: 'All systems operational' }, deductions: { current: 0, unresolved: 0, recentHistory: 6 }, affectedComponents: [], unresolvedIncidents: [], recentIncidents: [{ name: 'Resolved test incident', impact: 'minor', status: 'resolved', durationMinutes: 12 }], averageResolutionMinutes: 12, componentsObserved: 3 }] };
  const prior = process.env.SITE_URL; process.env.SITE_URL = 'https://example.netlify.app';
  try { const result = await buildSite({ snapshot, outputDir }); const html = await readFile(path.join(outputDir, 'index.html'), 'utf8'); const robots = await readFile(path.join(outputDir, 'robots.txt'), 'utf8'); assert.equal(result.pages, 2); assert.match(html, /Dependency Stability Lens/); assert.match(html, /Test Provider/); assert.match(html, /Not affiliated with/); assert.doesNotMatch(html, /paypal\.me/); assert.match(robots, /Allow: \//); } finally { if (prior === undefined) delete process.env.SITE_URL; else process.env.SITE_URL = prior; await rm(outputDir, { recursive: true, force: true }); }
});
