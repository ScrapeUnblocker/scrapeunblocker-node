# Changelog

## 0.1.9 (2026-08-28)

- Added `amazonProduct()` and `amazonSearch()` for the new Amazon plugin. `amazonProduct({ asin | url })` returns one product - title, brand, numeric price and currency, list price and savings, availability, rating, review count, seller, feature bullets, categories and images. `amazonSearch(keyword, options)` returns a keyword search's cards - asin, title, price, list price, rating, review count, a clean product URL, image and the sponsored/prime flags - on any of 20 regional marketplaces.
- Prices come back in the right currency automatically: `proxyCountry` defaults to the marketplace's home country (amazon.com -> US, amazon.de -> DE), pinning the exit over our ISP pool.

## 0.1.8 (2026-07-31)

- Added `ebaySearch()` for the new eBay Search plugin: listings from any of the 19 regional eBay marketplaces as structured JSON - title, numeric price and currency, condition with a normalised `conditionCode`, seller username and feedback, shipping cost, sold/watcher/bid counts, image and a clean item URL.
- Filters map straight onto the plugin: `marketplace`, `condition`, `sort`, `listingType`, `minPrice`/`maxPrice`, `freeShipping`, `seller`, `category`, plus `page`/`pageSize` (60, 120 or 240).
- The response carries `exactMatches`; it is `false` when eBay found no match for the keyword and answered with its own loosely-related suggestions.

No breaking changes.

## 0.1.7 (2026-07-27)

- Registry and README links to scrapeunblocker.com now carry UTM parameters so traffic from package registries is attributable. No functional changes.

## 0.1.6 (2026-07-23)

Version jumps from 0.1.3 to 0.1.6 so all four official SDKs (Python, Node.js, Ruby, PHP) share one version number from here on. Nothing was skipped - 0.1.4 and 0.1.5 were never released for Node.

- Added `PaymentRequiredError` for HTTP 402, which previously surfaced as a bare `APIError` with no explanation. The three billing blocks now each get their own subclass, picked from the response body: `QuotaExceededError` (`Quota exceeded`), `CreditLimitExceededError` (`Credit limit exceeded`) and `PaymentFailedError` (`Payment failed - update payment method`). Catch `PaymentRequiredError` to handle all three.
- Added `NoSubscriptionError`, a subclass of `AuthenticationError`, for the 401 that means "the key is fine, the account has no active plan" (`No valid subscription`) as opposed to an unrecognised key.
- Added typed errors for the remaining documented status codes: `NotFoundError` (404), `BrowserTimeoutError` (408), `UnsupportedContentError` (415) and `ValidationError` (422). All previously threw a bare `APIError`.
- Error messages now describe every documented status code accurately - notably 400, which also covers a missing `x-scrapeunblocker-key` header, not just a bad URL.
- Documented the full error hierarchy in the README, including which errors are retried, which are billed, and how each 402 clears.
- Fixed the README claim that Oopbuy brand keywords return HTTP 422. They return a successful `200` with `keywordRejected: true` and an empty `results` array.

No breaking changes: every new class extends `APIError`, so existing `instanceof APIError` / `instanceof ScrapeUnblockerError` checks keep working unchanged.

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
