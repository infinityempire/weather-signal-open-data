# Weather Signal Open Data — Product Specification

## Product

Weather Signal Open Data is a public-facing, non-emergency city forecast comparison that turns National Weather Service forecast periods into simple **weather signals**: heat, cold, rain, storm, wind, or calm. It is built from the NWS API, a U.S. government service that states its information is open data, free to use for any purpose, subject to reasonable rate limits.[1]

## Original value

The product compares a fixed, documented set of U.S. cities in one view, exposes the data collection time and source links, and translates raw forecast period descriptions into transparent, non-predictive labels. It does not claim to be an official government product, and it includes a prominent link to weather.gov for official information.

## Data collection

The collector requests each city's `points` resource, follows its official forecast URL, and stores a compact snapshot. Requests run sequentially every six hours, consistent with NWS guidance to request only the data needed and align refresh frequency with source update cycles.[1]

## Monetization boundary

The core product has no advertising or affiliate link enabled by default. It reserves a clearly labeled **sponsor slot** and an optional voluntary-support link configured only through environment values. Any activation must preserve the NWS attribution, avoid implication of NOAA/NWS endorsement, and remain clearly separated from forecasts. The product never makes payment or financial-outcome claims.

## Safety and compliance

The site is an informational comparison, not an emergency warning service. It must direct visitors to weather.gov, local authorities, and official NWS alerts for safety-critical decisions. NWS data may not be modified and then presented as official government material; NWS name and identifiers must not imply endorsement or affiliation.[2]

## References

[1]: https://www.weather.gov/documentation/services-web-API "NWS API Web Service"
[2]: https://www.weather.gov/disclaimer "NWS Disclaimer"
