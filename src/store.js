// Product design: a neutral Upstash snapshot store for the Dependency Stability Lens, independent of any provider.
import 'dotenv/config';

const DEFAULT_KEY = 'dependency-stability-lens:latest';

function credentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.');
  return { url, token };
}

async function execute(command, { fetchImpl = fetch } = {}) {
  const { url, token } = credentials();
  const response = await fetchImpl(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error(payload.error || `Upstash REST returned HTTP ${response.status}.`);
  return payload.result;
}

export function statusCacheKey() { return process.env.UPSTASH_CACHE_KEY || DEFAULT_KEY; }
export async function getStatusSnapshot(options) { const value = await execute(['GET', statusCacheKey()], options); return value ? JSON.parse(value) : null; }
export async function setStatusSnapshot(data, { ttlSeconds = Number.parseInt(process.env.CACHE_TTL_SECONDS ?? '604800', 10), ...options } = {}) { return execute(['SET', statusCacheKey(), JSON.stringify(data), 'EX', ttlSeconds], options); }
