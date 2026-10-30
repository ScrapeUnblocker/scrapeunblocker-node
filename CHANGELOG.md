# Changelog

## 0.17.1 (2026-10-30)

- 2 new plugin methods on `ScrapeUnblockerClient`: `bodegaaurreraSearch(query)` and `bodegaaurreraProduct(options)` (Bodega Aurrera, Walmart de Mexico's discount chain; prices in MXN). The search's first argument is optional for calls that pass the `url` option instead; the product method takes `productId` or `url`.

No breaking changes.

## 0.17.0 (2026-10-30)

- 29 new plugin methods on `ScrapeUnblockerClient`:
  - E-commerce, new sites: `mediamarktSearch(query)` and `mediamarktProduct(productId)` (MediaMarkt in ten countries and Saturn), `cdiscountSearch(query)` and `cdiscountProduct(sku)`, `idealoSearch(query)` and `idealoOffers(productId)` (price comparison in six countries), `rakutenSearch(query)` and `rakutenProduct(options)` (Rakuten Ichiba, Japan), `indiamartSearch(query)` and `indiamartProduct(options)`, `bedbathandbeyondSearch(query)` and `bedbathandbeyondProduct(product)`, `petcoSearch(query)` and `petcoProduct(product)`, `neobitsProduct(product)`, `lowesSearch(query)` and `lowesProduct(productId)`, `menardsSearch(query)` and `menardsProduct(options)`, `graingerSearch(query)` and `graingerProduct(sku)`.
  - Product pages next to existing searches: `walmartProduct(options)`, `ebayProduct(options)`, `etsyProduct(options)`, `bestbuyProduct(sku)`, `targetCategory(category)` and `targetProduct(tcin)`, `aliexpressProduct(productId)`.
  - AI: `chatgpt(prompt)` (ChatGPT's answer with the sites it cites).
- The first argument of the product methods that also take a link, and of the searches that also take a search link, is optional, for calls that pass the `url` option instead. `rakutenProduct`, `indiamartProduct`, `menardsProduct`, `walmartProduct`, `ebayProduct` and `etsyProduct` take options only (`productId` / `sku` / `itemId` / `listingId` or `url`).
- Plugin doc comments no longer describe exit or proxy details (`exitProvider`); API responses no longer carry them.

No breaking changes.

## 0.16.0 (2026-10-29)

- Add `mapsReviews` (on `ScrapeUnblockerClient`): Google Maps reviews of a place in Google's sort orders (relevant, newest, highest, lowest) with exact ISO dates, original and translated text, authors, photos, owner replies and page tokens. `POST /maps/reviews`.

## 0.15.1 (2026-10-29)

- `shopeeProduct` and `shopeeSearch` docs: describe `availability` and `inStock`, sold-out variations (`models[].available`, `tierIndex`), `categories` as the breadcrumb path plus `browseCategories`, `isPixPrice` (Brazilian Pix prices) and the JSON `{"status": "not_found", ...}` answer for a product that does not exist. Signatures are unchanged.

## 0.15.0 (2026-10-29)

- 23 new plugin methods on `ScrapeUnblockerClient`:
  - Groceries: `krogerSearch(query)` and `krogerProduct(product)` (Kroger and its 18 banner stores such as Ralphs and Fred Meyer, priced for one store), `instacartSearch(query, { retailer })` and `instacartProduct(product)` (any retailer on Instacart, priced for a ZIP code), `publixSearch(query)` and `publixProduct(product)`.
  - E-commerce: `amazonOffers(options)` (every seller's offer for a product, by `asin` or `url`), `amazonSeller(options)` (a seller's public profile and feedback, by `sellerId` or `url`), `costcoSearch(query)` and `costcoProduct(product)`, `flipkartSearch(query)` and `flipkartProduct(productId)`, `lazadaSearch(query)` and `lazadaProduct(itemId)` (six markets, `country` option), `allegroSearch(query)` and `allegroProduct(offerId)`, `falabellaSearch(query)` and `falabellaProduct(options)` (Chile, Colombia and Peru), `magazineluizaSearch(query)` and `magazineluizaProduct(options)`.
  - Google: `googleAiMode(q)` (the AI Mode answer with the pages it cites) and `googleLens(url)` (Google Lens visual matches for an image URL).
  - AI: `gemini(prompt)` (Google Gemini's answer with its citations and sources).
- The first argument of `flipkartProduct`, `lazadaProduct`, `allegroProduct`, `falabellaSearch` and `magazineluizaSearch` is optional, for calls that pass the `url` option instead. `falabellaProduct` and `magazineluizaProduct` take `productId` or `url`.
- `instacartSearch` needs the `retailer` option (the retailer's Instacart slug, e.g. `"costco"`); the API answers 400 without it. `instacartProduct` takes it too, unless `product` is a link that names the retailer.
- `sheinSearch` docs: results also carry `reviewCountText`, and the price filters apply to `price`.

No breaking changes.

## 0.14.1 (2026-10-25)

- `serp({ captchaPause })` docs: the API ignores `captcha_pause`; `captchaPause` is kept and marked `@deprecated` for compatibility. CAPTCHAs are handled server-side by retrying from other exits.

## 0.14.0 (2026-10-23)

- 16 new plugin methods on `ScrapeUnblockerClient`:
  - Google: `googleHotels(q)` (Google Hotels search with stay prices, ratings and amenities), `googleHotelsProperty(propertyToken)` (one property's prices from every booking site), `googleNews(q)` (a search, or a section with the `topic` option), `googleAdsTransparency(options)` (an advertiser's ads from the Ads Transparency Center, picked with `advertiser` or `domain`) and `googleAdsTransparencyAdvertisers(q)` (advertiser lookup by name).
  - E-commerce: `shopeeSearch(q)` and `shopeeProduct(url)` (Shopee in eight markets, `country` option), `taobaoSearch(q)` and `taobaoProduct(itemId)` (Taobao and Tmall), `smythsInventory(code)`, `smythsDetails(code)`, `smythsSearch(query)` and `smythsCategory(category)` (Smyths Toys UK), `wishSearch(query)` and `wishProduct(product)`.
  - Jobs: `upworkJobs(q)`.
  - Each method has its own exported options type (`GoogleHotelsOptions`, `ShopeeSearchOptions`, ...).
- The first argument of `googleNews`, `shopeeSearch`, `shopeeProduct`, `taobaoSearch`, `taobaoProduct` and `upworkJobs` is optional, for calls that pass another input instead: `googleNews(undefined, { topic: "technology" })`, `shopeeProduct(undefined, { shopId, itemId })`, `taobaoProduct(undefined, { url })`, `upworkJobs(undefined, { sort: "recency" })` for the newest jobs.
- `temuSearch` and `temuProduct` (and the `TemuSearchOptions` type) are deprecated: Temu's plugin is unlisted. They are kept for compatibility with the same signatures, now on `ScrapeUnblockerClient` itself instead of `PluginMethods`, and are no longer listed in the README.
- `googleShopping` docs: result cards also carry `currencyCode` and Google's own product ids (`productId`, `catalogId`, `offerId`).

No breaking changes.

## 0.13.0 (2026-10-23)

- New `getMarkdown(url, options)` returns the rendered page as clean Markdown for LLMs, agents and RAG pipelines: headings, lists, tables, absolute links, images with their alt text and code blocks, without scripts, styles, navigation, footers, forms or hidden elements. It sends `markdown=true` to `/getPageSource` and is billed like an HTML call.
- The `mainContentOnly` option (default `true`, sent as `main_content_only=false` only when `false`) keeps only the page's main content, without navigation, site header, footer and sidebars; pass `false` to convert the whole page. The method also takes `proxyCountry`, `timeSleep`, `method`, `value`, `methodTimeout` and `steps`, like `getPageSource()`. New exported type `MarkdownOptions`.
- A target page that answers 404 or 410 throws `TargetNotFoundError`, as with `getPageSource()`; the not-found page, as Markdown, is on `.html`.

No breaking changes.

## 0.12.0 (2026-10-15)

- `googleImages` takes `timeRange` (`"hour"`, `"day"`, `"week"`, `"month"` or `"year"`, sent as `time_range`) to return only the images Google found in that recent period, so a query scanned on a schedule returns only what is new. For a fixed window pass `dateFrom` and/or `dateTo` (`"YYYY-MM-DD"`, sent as `date_from` / `date_to`) instead; the API answers 400 when `timeRange` is combined with either.

No breaking changes.

## 0.11.1 (2026-10-15)

- `getImage` docs: the API now returns the image's original bytes and format (JPEG, PNG, WebP, AVIF, GIF, SVG, ...) instead of a PNG re-encode. The method still returns a `Uint8Array`.
- A missing image (the host's own 404/410) raises `TargetNotFoundError`; a URL that is not an image raises `UnsupportedContentError`. The 415 message no longer says "does not serve HTML", which was wrong for `getImage`.

## 0.11.0 (2026-10-13)

- Removed four plugin methods added in 0.10.0: `youtubeComments`, `telegramChannel`, `quoraQuestion` and `quoraProfile`. Those plugins are no longer offered through the SDKs; `plugin(path, params)` still reaches any endpoint your account can use.

## 0.10.1 (2026-10-13)

- `tiktokShopSearch` takes its keyword as optional, so a category-only search works (`category` option).
- `aldiAuSpecials` takes `category`: a Special Buys drop date such as `2026-10-14`.
- `capterraSearch` no longer offers `page` and `appStoreReviews` no longer offers `lang`; the API ignored both for those calls.
- Method docs say "proxy country" where they said "exit-IP country", and drop internal routing notes.

## 0.10.0 (2026-10-13)

- 104 new plugin methods on `ScrapeUnblockerClient`, one for every public plugin endpoint: e-commerce (Walmart, Target, Best Buy, Home Depot, Etsy, Temu, SHEIN, Zalando, AliExpress, Alibaba, 1688, TikTok Shop, Amazon Best Sellers and reviews), groceries (Woolworths, Coles, ALDI Australia), travel (Booking.com reviews, Airbnb listings and reviews, Tripadvisor), Google (Trends, Shopping, Jobs, Maps place details), Bing / DuckDuckGo / Yahoo / Brave search and images, real estate (Zillow, Redfin, Rightmove, Idealista, ImmobilienScout24), vehicles (mobile.de, AutoScout24), jobs (Indeed, Glassdoor, Naukri, Wellfound, company career sites), reviews and companies (Trustpilot, G2, Capterra, Product Hunt, Crunchbase), Yelp, Naver Place, Google Play, the App Store, YouTube, Spotify, Similarweb, Ahrefs and Semrush. Each has a typed options interface (`TargetSearchOptions`, ...). The README lists them by category; every parameter is on the docs plugin pages.
- Each method takes the plugin's main input positionally and the rest in one options object; unset options are not sent, so the API's defaults apply. Methods for one mode of a multi-mode endpoint set the mode themselves (`woolworthsProduct("888137")`, `spotifyArtist(...)`).
- New `plugin(path, params)` calls any plugin endpoint by path. Array values are sent as a repeated query parameter.

No breaking changes.

## 0.9.0 (2026-10-07)

- New `BudgetExceededError` (extends `PaymentRequiredError`): thrown on the new 402 billing block `User set budget exceeded`, sent when the account reaches the monthly budget limit set in its profile (https://app.scrapeunblocker.com/dashboard/profile, EUR excluding VAT). It lifts when the next billing period starts, or once the limit is raised or removed. Like every 402 it is not billed and never retried. When several billing blocks apply, failed payment outranks credit limit, which outranks quota, which outranks the budget limit.
- The generic 402 message now lists the budget limit among the billing blocks.

No breaking changes: `instanceof PaymentRequiredError` still matches. Before, this body surfaced as a plain `PaymentRequiredError`.

## 0.8.0 (2026-10-06)

- `getParsed()` on a page that rendered but held no structured data now resolves instead of throwing. The API answers this with a 200 again (billed like `getPageSource()`), and the result carries the new fields `dataExtracted: false`, `detail` (the API's explanation) and `html` (the rendered page). A normal parse has `dataExtracted: true` and no `html`. The same answer now covers a parser failure on the API side.
- `NoDataExtractedError` is deprecated: the API no longer sends the 422 `no_data_extracted`. The class stays exported so existing `instanceof` checks compile.

Behaviour change: code that caught `NoDataExtractedError` from `getParsed()` should check `result.dataExtracted` instead.

## 0.7.1 (2026-09-30)

- New `NoDataExtractedError` (extends `ValidationError`): thrown by `getParsed()` when the page rendered but no structured data could be extracted from it. The API answers 422 with `{"error": "no_data_extracted", "detail": ...}`; the error carries `detail`. The call is not billed and is never retried - use `getPageSource()` for the HTML. Before, this came back as a billed 200 with empty `data`.
- A dead URL fetched with `getParsed()` throws `TargetNotFoundError` with `html` undefined (the body is the parsed-data JSON, on `.body`).

## 0.7.0 (2026-09-30)

- New `TargetNotFoundError` (extends `NotFoundError`): thrown by `getPageSource()`, `getParsed()` and `getPageWithCookies()` when the target page itself answers 404 or 410. The API now passes the target's own status through instead of a 200, marked with the `X-Origin-Status` header. The error carries `originStatus`, the not-found page on `html` and `destinationUrl`. It is never retried, and the call is billed like any delivered page.
- `errorForStatus()` takes the response headers as an optional third argument.

Behaviour change: a dead target URL used to resolve with its not-found page as a normal string; it now throws `TargetNotFoundError`. `instanceof NotFoundError` still matches it. A 404 without `X-Origin-Status` is the API's own and stays a plain `NotFoundError`.

## 0.6.0 (2026-09-24)

- `googleImages()` takes `pages` (1-5): fetch up to five Google Images result pages of ~100 results each in one call. Each page fetched is billed as one request; the response's `pagesFetched` says how many. The Google market now follows `proxyCountry` automatically, so `gl` is only an optional override, and `maxResults` is an optional cap up to 500.

No breaking changes.

## 0.5.0 (2026-09-17)

- Added `googleImages()` for the new Google Images plugin (`POST /images/google-search`): returns Google Images results as JSON - each with the full-size `imageUrl` and its `sourceDomain`, plus the source page URL, title, source name, thumbnail URL, pixel dimensions and file size. Parameters: the keyword, plus optional `gl` (ISO-2 lowercase market), `maxResults` (1-100) and `proxyCountry` (ISO-2).

No breaking changes.

## 0.4.0 (2026-09-16)

- Added `southwest.flights()` for the new Southwest Airlines plugin (`POST /flights/southwest-quotes`): returns the raw booking/shopping JSON for a route. Parameters: `origin`/`dest` (IATA codes), `depart_date`, optional `return_date` (omit for one-way), `adults` (1-8), `fare_type` (`"dollars"` or `"points"`), `proxy_country` and `max_attempts` (1-5).

No breaking changes.

## 0.3.0 (2026-09-08)

- Added `tiktokProfile()`, `tiktokVideo()`, `tiktokHashtag()`, `tiktokSearch()` and `tiktokComments()` for the new TikTok plugin: a creator's exact follower / like / video counts with their newest videos (up to 200), any video or photo post with exact plays, likes, comments, shares, saves and reposts, hashtags, music, play / download URLs, subtitle tracks and an optional transcript, a hashtag's total views and videos with its videos, keyword search in TikTok's own ranking, and the comments of any post. No login.

## 0.2.1 (2026-09-02)

- Added `metaAdLibrary(advertiser, options)` for the new Meta Ad Library plugin (`POST /ads/meta-ad-library`). Pass the `advertiser` name and scope the lookup with `country`, `activeStatus`, `mediaType` and `maxAds`; omitted options fall back to the API's own defaults. Returns the advertiser's Meta/Facebook Ad Library ads as JSON.
- New exported type: `MetaAdLibraryOptions`.

No breaking changes.

## 0.2.0 (2026-08-29)

- `getPageSource()` now accepts `steps`: an ordered array of browser actions run in a real browser after the page loads - `wait_for`, `wait_for_text`, `wait`, `click`, `type` (human-like), `select`, `press_key` and `scroll`. Pass a native array of step objects; the client JSON-encodes it into the `steps` query param. A request with steps runs once and is non-idempotent, and a failed step surfaces as a `ValidationError` (HTTP 422) whose `body` holds the `step_failed` JSON (`step_index`, `action`, `reason`, `selector`, `html`).
- `getPageSource()` now accepts `listElements: true`, which returns `{ url, count, elements }` JSON instead of HTML. An overload types the call: `getPageSource(url, { listElements: true })` resolves to a `ListElementsResult`, every other call still resolves to `string`.
- New exported types: `BrowserStep` (a discriminated union over the action objects) and its members, `SelectorType`, `PressKey`, and `ListElementsResult`.

No breaking changes: `steps` and `listElements` are optional, and `getPageSource` without `listElements` keeps returning `string`.

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
