# ScrapeUnblocker Node.js client

Official Node.js / TypeScript client for the [ScrapeUnblocker](https://scrapeunblocker.com) web scraping API.

Every request is fully JavaScript-rendered in a real browser and routed through premium proxies, so it bypasses Cloudflare, DataDome, PerimeterX, Akamai, Kasada and similar anti-bot systems - from one simple call. You are only billed for successful requests.

- **Highest success rate on the market** (95%+ on live production traffic)
- **Rendered HTML or parsed JSON** - no per-site parsers to maintain
- Zero runtime dependencies, fully typed, ESM + CommonJS

## Install

```bash
npm install scrapeunblocker
```

Requires Node.js 18+.

## Quickstart

```ts
import { ScrapeUnblockerClient } from "scrapeunblocker";

const su = new ScrapeUnblockerClient(); // reads SCRAPEUNBLOCKER_KEY, or { apiKey: "YOUR_API_KEY" }

// Rendered HTML for any URL
const html = await su.getPageSource("https://example.com");

// Structured JSON instead of HTML (products, listings, search results, ...)
const product = await su.getParsed("https://www.amazon.com/dp/B08N5WRWNW");
console.log(product.pageType); // "product"
console.log(product.data);
```

CommonJS works too:

```js
const { ScrapeUnblockerClient } = require("scrapeunblocker");
```

Get your API key at [app.scrapeunblocker.com](https://app.scrapeunblocker.com). The free trial does not require a credit card.

## Authentication

Set an environment variable and the client picks it up:

```bash
export SCRAPEUNBLOCKER_KEY="YOUR_API_KEY"
```

```ts
const su = new ScrapeUnblockerClient(); // reads SCRAPEUNBLOCKER_KEY
```

## Fetch rendered HTML

```ts
const html = await su.getPageSource("https://www.nordstrom.com/browse/women/clothing/dresses", {
  proxyCountry: "US", // route through a specific country
  timeSleep: 3,       // wait extra seconds after load
});
```

## Get parsed JSON

```ts
const result = await su.getParsed("https://www.walmart.com/ip/12345");
console.log(result.pageType); // e.g. "product"
console.log(result.source);   // how it was extracted
console.log(result.data);     // the fields

// If a parse ever comes back wrong, force a fresh set of rules:
const fresh = await su.getParsed(url, { refreshRules: true, rulesHint: "price is missing" });
```

## Google search (SERP)

```ts
const serp = await su.serp("web scraping api", { pagesToCheck: 2, proxyCountry: "US" });
```

## Google Local (Maps)

```ts
const local = await su.googleLocal("coffee shops in chicago", { proxyCountry: "US", gl: "us" });
for (const biz of (local as any).results) {
  console.log(biz.name, biz.rating, biz.reviews, biz.address);
}
```

## Oopbuy product search

Search 1688, Taobao or Oopbuy official listings as JSON:

```ts
const goods = await su.oopbuySearch("wireless earbuds", {
  channel: "1688",     // "1688" (default), "taobao" or "official"
  page: 1,
  pageSize: 20,        // max 60
  sort: "best_selling", // "default", "price_asc", "price_desc" or "best_selling"
});
for (const item of (goods as any).results) {
  console.log(item.title, item.price, item.monthSold, item.url);
}
```

Oopbuy trademark-blocks brand keywords (e.g. "nike") at its own backend. Those come back as a successful `200` with `keywordRejected: true` and an empty `results` array - Oopbuy's own genuine response, not an error.

## Cookies and the serving proxy

```ts
const page = await su.getPageWithCookies("https://example.com");
console.log(page.html, page.cookies, page.proxy);
```

## Images

```ts
import { writeFile } from "node:fs/promises";
const bytes = await su.getImage("https://example.com/photo.jpg");
await writeFile("photo.jpg", bytes);
```

## Skyscanner plugins

Flights, hotels and car hire as JSON:

```ts
const locations = await su.skyscanner.flightLocations("London");

const flights = await su.skyscanner.flights({
  origin: "London", dest: "New York",
  depart_date: "2026-09-01", adults: 1, currency: "USD",
});

const hotels = await su.skyscanner.hotels({ destination: "Madrid", checkin: "2026-09-01", checkout: "2026-09-03" });
const cars = await su.skyscanner.carhire({ pickup: "Madrid", pickup_datetime: "2026-09-01T10:00", dropoff_datetime: "2026-09-03T10:00" });
```

## Error handling

Non-2xx responses reject with typed errors, all subclasses of `ScrapeUnblockerError`.

```ts
import {
  ScrapeUnblockerClient,
  BlockedError,
  PaymentRequiredError,
  RateLimitError,
  UpstreamOutageError,
} from "scrapeunblocker";

const su = new ScrapeUnblockerClient();
try {
  await su.getPageSource("https://example.com");
} catch (err) {
  if (err instanceof BlockedError) {
    // 403: the target blocked every bypass path (not billed)
  } else if (err instanceof PaymentRequiredError) {
    // 402: quota, credit limit, or a failed payment - fix billing
  } else if (err instanceof RateLimitError) {
    // 429: slow down
  } else if (err instanceof UpstreamOutageError) {
    // 503: the target site itself is down - retry later
  }
}
```

| Error | Status | Meaning |
|---|---|---|
| `InvalidRequestError` | 400 | Bad URL, unsupported scheme, or the API key header was not sent |
| `AuthenticationError` | 401 | Key not recognised - typo, stray whitespace, or a rotated key |
| `NoSubscriptionError` | 401 | Key is fine, but the account has no active plan |
| `PaymentRequiredError` | 402 | Billing block - base class for the three below |
| `QuotaExceededError` | 402 | The plan's requests for this period are used up |
| `CreditLimitExceededError` | 402 | Unpaid balance is past the account's credit limit |
| `PaymentFailedError` | 402 | A card payment was declined three times |
| `BlockedError` | 403 | Blocked by bot protection on every path |
| `NotFoundError` | 404 | Page loaded but held no image (`getImage` only) |
| `BrowserTimeoutError` | 408 | Our browser run timed out before the page was ready |
| `UnsupportedContentError` | 415 | The URL serves something other than HTML |
| `ValidationError` | 422 | Missing or wrong-typed parameter; `body` holds the `detail` array |
| `RateLimitError` | 429 | Too many requests |
| `UpstreamOutageError` | 503 | The target origin is down |
| `ServerError` | 5xx | Unexpected server error, including a 504 upstream timeout |
| `ScrapeTimeoutError` | - | This client gave up locally before the API answered |
| `ConnectionError` | - | Could not reach the API |

Transient failures (429, 502, 503, 504 and network errors) are retried automatically with exponential backoff. A 401 or 402 is never retried - it clears when the key or the billing state changes, not on another attempt. Neither is billed or counted against your quota, because the request is refused before anything is scraped.

### Billing errors (402)

The three billing blocks share a status code and differ only in their message, so the client throws a dedicated error for each:

```ts
import {
  CreditLimitExceededError,
  PaymentFailedError,
  QuotaExceededError,
} from "scrapeunblocker";

try {
  await su.getPageSource("https://example.com");
} catch (err) {
  if (err instanceof QuotaExceededError) {
    // plan quota (plus any overage allowance) is used up for this period
  } else if (err instanceof CreditLimitExceededError) {
    // unpaid balance passed the account credit limit
  } else if (err instanceof PaymentFailedError) {
    // card declined three times - update the payment method
  }
}
```

When more than one applies, the most serious wins: failed payment outranks credit limit, which outranks quota. All three lift by themselves once the billing state changes - access returns within about a minute, and the API key stays the same. One catch worth knowing: subscribing to a new plan does **not** clear `PaymentFailedError`, because the old unpaid invoice stays open until it is paid.

Full details for every status code: [developers.scrapeunblocker.com/errors](https://developers.scrapeunblocker.com/errors).

## Configuration

```ts
new ScrapeUnblockerClient({
  apiKey: undefined,   // or SCRAPEUNBLOCKER_KEY env var
  baseUrl: "https://api.scrapeunblocker.com",
  timeout: 180000,     // ms; protected pages can be slow
  maxRetries: 2,
});
```

## Links

- Documentation: https://developers.scrapeunblocker.com
- Website: https://scrapeunblocker.com
- Dashboard: https://app.scrapeunblocker.com

## License

MIT
