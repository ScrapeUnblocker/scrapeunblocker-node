# Changelog

## 0.1.2

- Added `googleLocal(keyword, options)` for the new Google Local (Maps) plugin (`POST /maps/google-local`) - returns local business listings (name, rating, reviews, price, category, address, hours) as JSON.

## 0.1.1

- Publishing: switched to npm Trusted Publishing (OIDC) - no token, nothing to expire. No functional changes.

## 0.1.0

Initial release.

- `ScrapeUnblockerClient` (alias `Client`) with `getPageSource`, `getParsed`, `getPageWithCookies`, `serp`, `getImage`.
- Skyscanner plugins: flights, hotels, car hire (quotes + locations).
- Typed errors, automatic retry, ESM + CommonJS, zero runtime dependencies.
