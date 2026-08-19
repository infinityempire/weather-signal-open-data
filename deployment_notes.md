# Deployment notes

- Upstash account has one free Redis database named `scrape-cache` in AWS EU-CENTRAL-1.
- The database is active and will use the distinct cache key `weather-signal:latest` for this product, avoiding overlap with the GitHub research site cache.
- Repository deployment still requires GitHub Pages configuration and the same Upstash REST credentials to be saved as repository secrets.

The Upstash REST URL secret has been set in the Weather Signal repository. The browser is now on the GitHub form for adding `UPSTASH_REDIS_REST_TOKEN`; the token was copied from the active Upstash database without displaying its value.
