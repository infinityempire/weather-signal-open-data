# AI & Cloud Status Tracker — Source Assessment

**Date:** 20 August 2026

## Verified official sources

| Provider | Official source | Programmatic form | Planned use | Notes |
|---|---|---|---|---|
| GitHub | [GitHub Status API](https://www.githubstatus.com/api) | Documented `https://www.githubstatus.com/api/v2/summary.json` | Current roll-up, components, unresolved incidents, recent incident history | Endpoint tested: HTTP 200 JSON. API documents incident impact and status fields. |
| Anthropic / Claude | [Claude Status](https://status.claude.com/) | `https://status.claude.com/api/v2/summary.json` and `https://status.claude.com/history.rss` | Current service condition, recent incident records and source feed | Both JSON and RSS endpoints tested: HTTP 200. |
| OpenAI | [OpenAI Status](https://status.openai.com/) | `https://status.openai.com/api/v2/summary.json` | Aggregate current availability, components and incident summary | Endpoint tested: HTTP 200 JSON. The page is powered by incident.io and states availability is aggregate; individual availability can vary. Do not represent results as customer-specific. |
| Midjourney | [Midjourney Status](https://status.midjourney.com/) | Official page URL found; machine-readable feed not verified | Deferred pending a documented feed/API and terms review | Exclude from the initial automated source set rather than rely on third-party monitoring data. |

## Differentiation to implement

The product will not duplicate a provider's current-status page. It will produce a transparent **Dependency Stability Lens** for users who rely on multiple providers. The lens combines: (1) current official status, (2) documented incident impact/severity, (3) incident recency and duration within the retained history, and (4) an explicit cross-provider dependency posture. Scores will be reproducible from published rules and will be labeled as an independent interpretation, not a provider SLA or official availability measurement.

## Initial scope decision

The first release should collect machine-readable, official feeds for GitHub, Claude and OpenAI. Midjourney stays out of automatic collection until its official machine-readable interface and usage terms are validated. This avoids presenting unofficial third-party outage data as authoritative.

## References

1. [GitHub Status API](https://www.githubstatus.com/api)
2. [Claude Status](https://status.claude.com/)
3. [OpenAI Status](https://status.openai.com/)
4. [Midjourney Status](https://status.midjourney.com/)
