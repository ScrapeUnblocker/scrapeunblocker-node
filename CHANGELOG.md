# Changelog

## 0.1.3 (2026-07-22)

- Added `oopbuySearch(keyword, options)` for the Oopbuy product search plugin (`POST /goods/oopbuy-search`) - searches 1688 / Taobao / Oopbuy official listings and returns products (spu, title, price, monthly sales, image, url) as JSON. Options: `channel`, `page`, `pageSize`, `sort`, `proxyCountry`.

## 0.1.2

- Added `googleLocal(keyword, options)` for the new Google Local (Maps) plugin (`POST /maps/google-local`) - returns local business listings (name, rating, reviews, price, category, address, hours) as JSON.

## 0.1.1

- Publishing: switched to npm Trusted Publishing (OIDC) - no token, nothing to expire. No functional changes.

## 0.1.0

Initial release.

- `ScrapeUnblockerClient` (alias `Client`) with `getPageSource`, `getParsed`, `getPageWithCookies`, `serp`, `getImage`.
- Skyscanner plugins: flights, hotels, car hire (quotes + locations).
- Typed errors, automatic retry, ESM + CommonJS, zero runtime dependencies.
