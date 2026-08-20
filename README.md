# Dependency Stability Lens

**Dependency Stability Lens** is a source-linked AI and cloud status tracker for teams that rely on more than one provider. It is not another copy of a vendor’s live status banner: it normalizes official current component states and incident history into a transparent **Weekly Stability Score** and a cross-provider dependency posture.

> The score is an independent interpretation of public operational signals. It is not a vendor SLA, an uptime guarantee, a customer-specific availability measurement, or a prediction.

## Sources and product boundary

The first release collects only public, machine-readable status data from official OpenAI, Claude and GitHub endpoints. GitHub documents status, component and incident JSON endpoints; its incident records include standard status and impact classifications.[1] Claude publishes its official status history and RSS feed.[2] OpenAI publishes aggregate component availability and notes that individual customer availability may differ by tier, model and feature.[3]

Every provider card links to the original official status page. The site is unaffiliated with, not endorsed by, and not an official product of any tracked provider. Midjourney is intentionally excluded until an official machine-readable source and suitable usage terms are verified.

## Deployment model

GitHub Actions collects official status JSON weekly and writes a compact snapshot to Upstash. Netlify builds the static site from that cached snapshot and serves the public dashboard. This separation keeps collection deterministic and avoids exposing the Upstash token in browser code.

## Setup

Create a GitHub repository from this directory and configure these repository secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token with write access. |
| `NETLIFY_BUILD_HOOK_URL` | Yes for automatic refresh | A Netlify deploy-hook URL, stored only as a GitHub Actions secret. |

In Netlify, import `infinityempire/weather-signal-open-data` as a Git repository project. Netlify reads `netlify.toml` automatically. Add the following **Netlify environment variables** before the first production deploy: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally `SITE_URL` if a custom domain is used. The build command is `npm ci && npm run build` and the publish directory is `public`.

Create a Netlify deploy hook and save its URL as the `NETLIFY_BUILD_HOOK_URL` secret in GitHub. The scheduled GitHub workflow runs every Monday at 12:15 UTC and calls the hook only after a successful status collection. Netlify then rebuilds the dashboard from the latest Upstash snapshot.

## Monetization boundary

The product is usable without monetization. If voluntary project support or sponsorship is later enabled in Netlify, it must remain visibly separated from the score and source content, be labeled as optional support or sponsorship, and never imply provider endorsement. Do not describe the independent score as official provider data, and do not claim guaranteed income. The product includes no advertising script, click incentives, paywall, or revenue guarantee.

## Local run

```bash
cp .env.example .env
npm ci
npm run collect
npm run build
npm test
```

## References

[1]: https://www.githubstatus.com/api "GitHub Status API"
[2]: https://status.claude.com/ "Claude Status"
[3]: https://status.openai.com/ "OpenAI Status"
