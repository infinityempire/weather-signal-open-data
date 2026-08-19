import 'dotenv/config';

const DEFAULT_KEY = 'weather-signal:latest';

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

export function weatherCacheKey() { return process.env.UPSTASH_CACHE_KEY || DEFAULT_KEY; }
export async function getWeatherSnapshot(options) { const value = await execute(['GET', weatherCacheKey()], options); return value ? JSON.parse(value) : null; }
export async function setWeatherSnapshot(data, { ttlSeconds = Number.parseInt(process.env.CACHE_TTL_SECONDS ?? '21600', 10), ...options } = {}) { return execute(['SET', weatherCacheKey(), JSON.stringify(data), 'EX', ttlSeconds], options); }
