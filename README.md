# Weather Signal Open Data

Weather Signal is a source-linked comparison of forecast periods for six U.S. cities. It uses the official National Weather Service (NWS) API and turns selected forecast text into transparent informational labels. It is not an official NWS service, a warning system, or emergency guidance.

## Source and rights

NWS says information provided by its API is open data, free to use for any purpose, subject to reasonable rate limits.[1] NWS also states that weather.gov information is public domain unless noted otherwise, but users must not imply NWS/NOAA endorsement or present modified content as official government material.[2]

The collector makes sequential `points` and official forecast calls, caches snapshots for six hours, and sends an identifying `User-Agent`. The dashboard always links to weather.gov and each location’s source forecast.

## Setup

Create a GitHub repository from this directory and configure these repository secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token with write access. |
| `NWS_USER_AGENT` | Yes | Identify the app and a contact URL/email, per NWS guidance. |
| `PAYPAL_ME_LINK` | No | An optional, clearly labeled voluntary support link. |
| `SPONSOR_URL` | No | Optional sponsor URL, displayed with disclosure. |
| `SPONSOR_LABEL` | No | Sponsor label; never an implied NWS endorsement. |

In **Settings → Pages**, select **GitHub Actions**. The workflow runs every six hours and may be launched manually.

## Monetization boundary

The product is usable without any monetization configuration. If the optional support or sponsor links are used, they remain visibly separated from the weather data. Do not present them as an NWS/NOAA endorsement, do not modify data and call it official, and do not use the dashboard for safety-critical decisions. The product includes no advertising script, click incentives, paywall, or revenue guarantee.

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
