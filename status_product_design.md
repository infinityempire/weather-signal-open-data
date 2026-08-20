# Dependency Stability Lens — Product Design

## Product positioning

**Dependency Stability Lens** is a source-linked tracker for teams that depend on multiple AI and developer-platform providers. It does not compete with official status pages by restating their banners. Instead, it combines official component states and incident histories into a comparable, explainable view of cross-provider operational exposure.

## What makes it different

| Typical status page | Dependency Stability Lens |
|---|---|
| Shows one provider's present banner | Compares providers that share a team's workflow dependencies |
| Uses the provider's own labels only | Normalizes documented component and incident severity into a transparent independent score |
| Lists incidents chronologically | Highlights recency, affected components and average resolved duration where the official feed supplies timestamps |
| Implies a single-service question: "Is this vendor up?" | Frames a multi-service question: "Where is my dependency exposure today?" |

## Transparent score

The **Weekly Stability Score** starts at 100 and subtracts only documented, reproducible signals from each provider's official status response:

| Input | Maximum deduction | Rule |
|---|---:|---|
| Current component or roll-up severity | 55 | Operational = 0; degraded = 12; partial outage = 30; major/critical = 55. |
| Unresolved incident impact | 20 | Minor = 6; major = 13; critical = 20. |
| Recent resolved incident history | 25 | Incidents that began within the past 7 days are weighted by official impact, capped at 25. |

> The score is an independent interpretation of public operational signals. It is **not** vendor uptime, an SLA measurement, a performance benchmark, or a prediction of future availability.

## Dependency posture

The product converts provider results into an explicit portfolio-level posture:

* **Diversified posture** — no provider currently shows a non-operational official component and no score is below 88.
* **Recent incident activity** — no provider has a current official issue, but one or more scores reflect documented incident history in the preceding seven days.
* **Single-provider live watch** — exactly one provider currently reports a non-operational official state.
* **Cross-provider live exposure** — two or more providers currently report a non-operational official state.

## Initial providers and source boundaries

The first release uses public, machine-readable official status feeds from OpenAI, Anthropic/Claude and GitHub. Midjourney is excluded until an official machine-readable feed and acceptable use terms are verified. All provider names are used only to identify the source. The tracker will link every provider card to its original status page, show collection time, and state that it is unaffiliated with the providers.
