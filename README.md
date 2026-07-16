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

Non-2xx responses reject with typed errors, all subclasses of `ScrapeUnblockerError`. Transient failures (429, 502, 503, 504 and network errors) are retried automatically with exponential backoff.

```ts
import { ScrapeUnblockerClient, BlockedError, RateLimitError, UpstreamOutageError } from "scrapeunblocker";

const su = new ScrapeUnblockerClient();
try {
  await su.getPageSource("https://example.com");
} catch (err) {
  if (err instanceof BlockedError) {
    // 403: the target blocked every bypass path (not billed)
  } else if (err instanceof RateLimitError) {
    // 429: slow down
  } else if (err instanceof UpstreamOutageError) {
    // 503: the target site itself is down - retry later
  }
}
```

| Error | Status | Meaning |
|---|---|---|
| `InvalidRequestError` | 400 | Bad URL or unsupported scheme |
| `AuthenticationError` | 401 | Missing or invalid API key |
| `BlockedError` | 403 | Blocked by bot protection on every path |
| `RateLimitError` | 429 | Too many requests |
| `UpstreamOutageError` | 503 | The target origin is down |
| `ServerError` | 5xx | Unexpected server error |
| `ScrapeTimeoutError` | - | Request exceeded the timeout |
| `ConnectionError` | - | Could not reach the API |

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
