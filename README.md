# Weather Signal Open Data

Weather Signal is a source-linked comparison of forecast periods for six U.S. cities. It uses the official National Weather Service (NWS) API and turns selected forecast text into transparent informational labels. It is not an official NWS service, a warning system, or emergency guidance.

## Source and rights

NWS says information provided by its API is open data, free to use for any purpose, subject to reasonable rate limits.[1] NWS also states that weather.gov information is public domain unless noted otherwise, but users must not imply NWS/NOAA endorsement or present modified content as official government material.[2]

The collector makes sequential `points` and official forecast calls, caches snapshots for seven days, and sends an identifying `User-Agent`. The dashboard always links to weather.gov and each location’s source forecast.

## Deployment model

GitHub Actions collects NWS data and writes a compact snapshot to Upstash. Netlify builds the static site from that cached snapshot and serves the public dashboard. This separation keeps data collection deterministic and avoids exposing the Upstash token in browser code.

## Setup

Create a GitHub repository from this directory and configure these repository secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token with write access. |
| `NWS_USER_AGENT` | Yes | Identify the app and a contact URL/email, per NWS guidance. |
| `NETLIFY_BUILD_HOOK_URL` | Yes for automatic refresh | A Netlify deploy-hook URL, stored only as a GitHub Actions secret. |

In Netlify, import `infinityempire/weather-signal-open-data` as a Git repository project. Netlify reads `netlify.toml` automatically. Add the following **Netlify environment variables** before the first production deploy: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `SITE_URL` if a custom domain is used. The build command is `npm ci && npm run build` and the publish directory is `public`.

Create a Netlify deploy hook and save its URL as the `NETLIFY_BUILD_HOOK_URL` secret in GitHub. The scheduled GitHub workflow runs every Monday at 12:15 UTC and calls the hook only after a successful NWS collection. Netlify then rebuilds the dashboard from the latest Upstash snapshot.

## Monetization boundary

The product is usable without monetization. If voluntary project support or sponsorship is later enabled in Netlify, it must remain visibly separated from forecast content, be labeled as optional support or sponsorship, and never imply NWS/NOAA endorsement. Do not modify data and call it official, do not use the dashboard for safety-critical decisions, and do not claim guaranteed income. The product includes no advertising script, click incentives, paywall, or revenue guarantee.

## Local run

```bash
cp .env.example .env
npm ci
npm run collect
npm run build
npm test
```

## References

[1]: https://www.weather.gov/documentation/services-web-API "NWS API Web Service"
[2]: https://www.weather.gov/disclaimer "NWS Disclaimer"
