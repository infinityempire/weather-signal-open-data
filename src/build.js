// Site design: a data-led civic weather dashboard with source links, decision boundaries, and clearly separated optional support.
import 'dotenv/config';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWeatherSnapshot } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public');
const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const siteUrl = () => (process.env.SITE_URL || process.env.URL || 'http://localhost:8080').replace(/\/$/, '');
const dateLabel = (value) => new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) + ' UTC';
const signalClass = (tone) => ({ storm: 'storm', rain: 'rain', wind: 'wind', heat: 'heat', cold: 'cold', calm: 'calm' }[tone] || 'calm');

function validHttps(value) { try { return value && new URL(value).protocol === 'https:' ? new URL(value).toString() : null; } catch { return null; } }
function optionalSupport() {
  const paypal = validHttps(process.env.PAYPAL_ME_LINK); const sponsor = validHttps(process.env.SPONSOR_URL); const label = String(process.env.SPONSOR_LABEL || 'Sponsor').trim();
  if (!paypal && !sponsor) return '';
  return `<aside class="support"><p class="eyebrow">Support</p>${sponsor ? `<p><a href="${escapeHtml(sponsor)}" rel="sponsored noopener noreferrer">${escapeHtml(label)} ↗</a></p>` : ''}${paypal ? `<p><a href="${escapeHtml(paypal)}" rel="sponsored noopener noreferrer">Optional project support via PayPal ↗</a></p>` : ''}<p class="meta">Links are clearly labeled and do not affect forecasts or signal labels.</p></aside>`;
}

function page({ title, description, body, canonical }) {
  const base = siteUrl();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow"><link rel="canonical" href="${escapeHtml(canonical || base)}"><title>${escapeHtml(title)}</title><style>
  :root{--ink:#11212c;--muted:#61717a;--paper:#f4f3ec;--panel:#fffdf9;--line:#d9ded9;--nav:#143740;--aqua:#1c806f;--sun:#ffcf5a;--rain:#477eb5;--storm:#574474;--heat:#cc5a2a;--cold:#4386aa;--calm:#6b9579}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Georgia,'Times New Roman',serif;line-height:1.55}a{color:var(--aqua)}header{background:var(--nav);color:#f4f6ef;border-bottom:5px solid var(--sun);padding:1.1rem max(1.2rem,calc((100vw - 78rem)/2));display:flex;justify-content:space-between;align-items:center;gap:1rem}header a{color:inherit;text-decoration:none;font:700 .78rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase}.nav{display:flex;gap:1rem;flex-wrap:wrap}.nav a{opacity:.8}.nav a:hover{opacity:1}main{width:min(78rem,calc(100% - 2.4rem));margin:auto;padding:3.5rem 0 5rem}.eyebrow{font:700 .74rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--aqua)}h1{font-size:clamp(2.9rem,7vw,6rem);line-height:.9;letter-spacing:-.065em;max-width:14ch;margin:.55rem 0 1rem}.lede{font-size:1.18rem;max-width:64ch}.meta{font:500 .8rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--muted)}.top{display:grid;grid-template-columns:1.5fr .8fr;gap:2rem;align-items:end}.notice,.support{padding:1.15rem;border:1px solid var(--line);background:#edf4e8}.cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.25rem;margin-top:2.5rem}.card{background:var(--panel);border:1px solid var(--line);padding:1.3rem}.city{display:flex;justify-content:space-between;gap:1rem;align-items:baseline}.city h2{margin:0;font-size:1.45rem}.signal{display:inline-block;padding:.3rem .55rem;color:white;font:700 .7rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase}.storm{background:var(--storm)}.rain{background:var(--rain)}.wind{background:#45686a}.heat{background:var(--heat)}.cold{background:var(--cold)}.calm{background:var(--calm)}.period{padding:1rem 0;border-top:1px solid var(--line)}.period:first-of-type{border-top:0}.period h3{margin:0 0 .25rem;font-size:1rem}.temp{font-size:1.65rem;font-weight:700}.support{margin-top:2.5rem;background:#fff6da}footer{padding:2rem max(1.2rem,calc((100vw - 78rem)/2));border-top:1px solid var(--line);color:var(--muted);font-size:.9rem}@media(max-width:780px){.top,.cards{grid-template-columns:1fr}main{padding-top:2.3rem}h1{font-size:3.5rem}}
  </style></head><body><header><a href="${escapeHtml(base)}/">Weather Signal</a><nav class="nav"><a href="${escapeHtml(base)}/methodology/">Methodology</a><a href="https://www.weather.gov" rel="noopener noreferrer">Official weather.gov ↗</a></nav></header><main>${body}</main><footer>Built from National Weather Service open data. Not an official NWS product, not emergency guidance, and not a substitute for official alerts.</footer></body></html>`;
}

function locationCard(location) {
  const current = location.periods[0];
  return `<article class="card"><div class="city"><h2>${escapeHtml(location.label)}</h2><a class="meta" href="${escapeHtml(location.forecastUrl)}" rel="noopener noreferrer">Source ↗</a></div><p><span class="signal ${signalClass(current.signal.tone)}">${escapeHtml(current.signal.type)}</span></p>${location.periods.map((period) => `<section class="period"><h3>${escapeHtml(period.name)}</h3><div class="temp">${escapeHtml(period.temperature)}°${escapeHtml(period.temperatureUnit)}</div><p>${escapeHtml(period.shortForecast)}</p><p class="meta">Wind: ${escapeHtml(period.windSpeed)} ${escapeHtml(period.windDirection)}${period.precipitationChance === null ? '' : ` · Precipitation: ${escapeHtml(period.precipitationChance)}%`}</p></section>`).join('')}</article>`;
}

function index(snapshot) {
  const body = `<div class="top"><section><p class="eyebrow">Open civic data dashboard</p><h1>Weather signals, with sources.</h1><p class="lede">A six-city comparison built from official National Weather Service forecast periods. Each label is a simple, documented interpretation of public forecast text and temperature — never an official warning.</p><p class="meta">Collected ${escapeHtml(dateLabel(snapshot.timestamp))} · ${snapshot.locations.length} U.S. locations</p></section><aside class="notice"><strong>For safety decisions, use official information.</strong><p>Check <a href="https://www.weather.gov" rel="noopener noreferrer">weather.gov ↗</a>, local authorities, and active alerts. This site can be delayed or unavailable.</p></aside></div><section class="cards">${snapshot.locations.map(locationCard).join('')}</section>${optionalSupport()}`;
  return page({ title: 'Weather Signal Open Data', description: 'Source-linked NWS forecast comparison for six U.S. cities.', body });
}

function methodology(snapshot) {
  const body = `<p class="eyebrow">Methodology & data use</p><h1>How Weather Signal works.</h1><p class="lede">The site makes sequential requests to the official NWS API for six documented coordinates. It follows the API’s point-to-forecast workflow and caches the result for six hours.</p><h2>Signal labels</h2><p>Forecast text containing thunderstorm terms receives a Storm watch label; precipitation language receives Wet conditions; wind language receives Wind watch; temperatures at or above 90°F receive Heat signal; temperatures at or below 32°F receive Freeze signal. Otherwise the label is Steady conditions. These are transparent convenience labels, not NWS products or forecasts.</p><h2>Data rights and attribution</h2><p>NWS states that its data are in the public domain unless noted otherwise and may be used without charge for lawful purposes. This site attributes NWS, links to sources, does not present modified data as official government material, and does not imply government endorsement.</p><h2>Refresh and limits</h2><p>Forecasts are refreshed every six hours. NWS API availability and timeliness are not guaranteed. The source may revise any forecast between collections.</p><p class="meta">Latest collection: ${escapeHtml(dateLabel(snapshot.timestamp))}</p>${optionalSupport()}<p><a href="${escapeHtml(siteUrl())}/">← Back to the dashboard</a></p>`;
  return page({ title: 'Methodology | Weather Signal Open Data', description: 'Data source, signal labels, attribution, and limits for Weather Signal.', body, canonical: `${siteUrl()}/methodology/` });
}

export async function buildSite({ snapshot, outputDir = OUTPUT_DIR } = {}) {
  const data = snapshot || await getWeatherSnapshot(); if (data?.kind !== 'nws-weather-signal') throw new Error('NWS weather snapshot is required. Run the collector first.');
  const base = siteUrl(); await rm(outputDir, { recursive: true, force: true }); await mkdir(path.join(outputDir, 'methodology'), { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDir, 'index.html'), index(data), 'utf8'),
    writeFile(path.join(outputDir, 'methodology', 'index.html'), methodology(data), 'utf8'),
    writeFile(path.join(outputDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, 'utf8'),
    writeFile(path.join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc><lastmod>${data.timestamp}</lastmod></url>\n  <url><loc>${base}/methodology/</loc><lastmod>${data.timestamp}</lastmod></url>\n</urlset>\n`, 'utf8'),
    writeFile(path.join(outputDir, '.nojekyll'), '', 'utf8')
  ]); return { outputDir, pages: 2, timestamp: data.timestamp };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  buildSite().then((result) => console.info(JSON.stringify({ status: 'built', ...result }))).catch((error) => { console.error(error); process.exit(1); });
}
