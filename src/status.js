// Product design: official-source AI & cloud dependency tracker. Every score is a transparent, independent interpretation—not a vendor SLA.
import 'dotenv/config';
import { setStatusSnapshot } from './store.js';

export const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', officialUrl: 'https://status.openai.com/', summaryUrl: 'https://status.openai.com/api/v2/summary.json', incidentsUrl: 'https://status.openai.com/api/v2/incidents.json', focus: 'API and model dependencies' },
  { id: 'claude', name: 'Claude', officialUrl: 'https://status.claude.com/', summaryUrl: 'https://status.claude.com/api/v2/summary.json', incidentsUrl: 'https://status.claude.com/api/v2/incidents.json', feedUrl: 'https://status.claude.com/history.rss', focus: 'Claude API and developer workflow dependencies' },
  { id: 'github', name: 'GitHub', officialUrl: 'https://www.githubstatus.com/', summaryUrl: 'https://www.githubstatus.com/api/v2/summary.json', incidentsUrl: 'https://www.githubstatus.com/api/v2/incidents.json', focus: 'Source control and deployment workflow dependencies' }
];

const impactWeight = { none: 0, minor: 6, major: 13, critical: 20 };
const componentWeight = { operational: 0, none: 0, degraded_performance: 12, minor: 12, partial_outage: 30, major: 30, major_outage: 55, critical: 55 };

function clean(value) { return String(value ?? '').trim(); }
function statusKey(value) { return clean(value).toLowerCase().replace(/[\s-]+/g, '_'); }
function parseTime(value) { const time = Date.parse(value ?? ''); return Number.isNaN(time) ? null : time; }

async function getJson(url, { fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json', 'User-Agent': 'DependencyStabilityLens/1.0 (+https://github.com/infinityempire/weather-signal-open-data)' } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Official status endpoint returned HTTP ${response.status} for ${url}.`);
  return payload;
}

export function classifyOfficialStatus(status) {
  const key = statusKey(status);
  const weight = componentWeight[key] ?? 12;
  if (weight >= 55) return { key, weight, tone: 'critical', label: 'Major disruption' };
  if (weight >= 30) return { key, weight, tone: 'elevated', label: 'Partial outage' };
  if (weight >= 12) return { key, weight, tone: 'watch', label: 'Degraded performance' };
  return { key, weight: 0, tone: 'steady', label: 'Operational' };
}

function recentResolvedPenalty(incidents, now) {
  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  return Math.min(25, incidents.reduce((total, incident) => {
    const created = parseTime(incident.created_at);
    const isResolved = statusKey(incident.status) === 'resolved' || statusKey(incident.status) === 'postmortem';
    return total + (isResolved && created && created >= cutoff ? impactWeight[statusKey(incident.impact)] ?? 6 : 0);
  }, 0));
}

function incidentView(incident) {
  const created = parseTime(incident.created_at);
  const resolved = parseTime(incident.resolved_at);
  const durationMinutes = created && resolved && resolved >= created ? Math.round((resolved - created) / 60000) : null;
  return {
    name: clean(incident.name) || 'Official incident',
    status: clean(incident.status) || 'Unknown',
    impact: clean(incident.impact) || 'none',
    createdAt: incident.created_at ?? null,
    resolvedAt: incident.resolved_at ?? null,
    durationMinutes
  };
}

export function stabilityFor({ summary = {}, incidents = [], now = new Date() } = {}) {
  const components = (summary.components ?? []).filter((component) => !component.group);
  const rollup = classifyOfficialStatus(summary.status?.indicator || 'none');
  const degradedComponents = components.filter((component) => classifyOfficialStatus(component.status).weight > 0);
  const componentPenalty = Math.max(rollup.weight, ...degradedComponents.map((component) => classifyOfficialStatus(component.status).weight), 0);
  const unresolved = incidents.filter((incident) => ['investigating', 'identified', 'monitoring'].includes(statusKey(incident.status)));
  const unresolvedPenalty = Math.min(20, Math.max(0, ...unresolved.map((incident) => impactWeight[statusKey(incident.impact)] ?? 6)));
  const historyPenalty = recentResolvedPenalty(incidents, now);
  const score = Math.max(0, 100 - componentPenalty - unresolvedPenalty - historyPenalty);
  const resolved = incidents.filter((incident) => incidentView(incident).durationMinutes !== null);
  const averageResolutionMinutes = resolved.length ? Math.round(resolved.reduce((sum, incident) => sum + incidentView(incident).durationMinutes, 0) / resolved.length) : null;
  const current = componentPenalty ? classifyOfficialStatus(degradedComponents[0]?.status || summary.status?.indicator) : rollup;
  return {
    score,
    current: { label: current.label, tone: current.tone, officialDescription: clean(summary.status?.description) || current.label },
    deductions: { current: componentPenalty, unresolved: unresolvedPenalty, recentHistory: historyPenalty },
    affectedComponents: degradedComponents.slice(0, 5).map((component) => ({ name: component.name, status: component.status })),
    unresolvedIncidents: unresolved.slice(0, 3).map(incidentView),
    recentIncidents: incidents.slice(0, 5).map(incidentView),
    averageResolutionMinutes,
    componentsObserved: components.length
  };
}

export async function fetchProviderStatus(provider, { fetchImpl = fetch, now = new Date() } = {}) {
  const [summary, incidentsPayload] = await Promise.all([getJson(provider.summaryUrl, { fetchImpl }), getJson(provider.incidentsUrl, { fetchImpl })]);
  const incidents = incidentsPayload.incidents ?? [];
  return { ...provider, collectedAt: now.toISOString(), ...stabilityFor({ summary, incidents, now }) };
}

export function dependencyPosture(providers) {
  const liveIssues = providers.filter((provider) => provider.current.tone !== 'steady');
  const historyWatch = providers.filter((provider) => provider.score < 88);
  if (liveIssues.length >= 2) return { label: 'Cross-provider live exposure', tone: 'critical', rationale: `${liveIssues.length} providers currently report a non-operational official state.` };
  if (liveIssues.length === 1) return { label: 'Single-provider live watch', tone: 'watch', rationale: `${liveIssues[0].name} currently reports a non-operational official state.` };
  if (historyWatch.length >= 2) return { label: 'Recent multi-provider incident activity', tone: 'watch', rationale: `No tracked provider currently reports a non-operational state, but ${historyWatch.length} scores reflect official incident activity in the prior seven days.` };
  if (historyWatch.length === 1) return { label: 'Recent single-provider incident activity', tone: 'watch', rationale: `No tracked provider currently reports a non-operational state; ${historyWatch[0].name}'s score reflects official incident activity in the prior seven days.` };
  return { label: 'Diversified posture', tone: 'steady', rationale: 'No tracked provider currently has a non-operational official component or a score below 88.' };
}

export async function collectStatusSnapshot({ fetchImpl = fetch, now = new Date(), providers = PROVIDERS } = {}) {
  const collectedProviders = [];
  for (const provider of providers) collectedProviders.push(await fetchProviderStatus(provider, { fetchImpl, now }));
  return {
    kind: 'dependency-stability-lens',
    timestamp: now.toISOString(),
    title: 'Dependency Stability Lens',
    methodology: 'Weekly Stability Score begins at 100 and deducts only current official severity, unresolved official incidents, and official incidents initiated within the prior seven days. It is an independent interpretation, not vendor uptime, an SLA, a benchmark, or a prediction.',
    providers: collectedProviders,
    portfolio: dependencyPosture(collectedProviders),
    sources: providers.map(({ id, name, officialUrl, summaryUrl, incidentsUrl, feedUrl }) => ({ id, name, officialUrl, summaryUrl, incidentsUrl, feedUrl: feedUrl ?? null }))
  };
}

export async function runCollection() { const snapshot = await collectStatusSnapshot(); await setStatusSnapshot(snapshot); return snapshot; }
