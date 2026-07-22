/** Options accepted by {@link ScrapeUnblockerClient}. */
export interface ClientOptions {
  /** Your API key. Falls back to the `SCRAPEUNBLOCKER_KEY` env var. */
  apiKey?: string;
  /** Override the API host (rarely needed). */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default 180000. */
  timeout?: number;
  /** Retries for transient failures (429/5xx and network errors). Default 2. */
  maxRetries?: number;
}

/** Common options for a page fetch. */
export interface PageOptions {
  /** ISO country code to route through (e.g. "US"). */
  proxyCountry?: string;
  /** Extra seconds to wait after load before capture. */
  timeSleep?: number;
  /** Advanced render-wait method ("css", "js", ...). */
  method?: string;
  /** The selector/expression paired with `method`. */
  value?: string;
  /** Cap in seconds for the render-wait method. */
  methodTimeout?: number;
}

/** Options for {@link ScrapeUnblockerClient.getParsed}. */
export interface ParsedOptions {
  proxyCountry?: string;
  timeSleep?: number;
  /** Force-regenerate the cached extraction rules for this domain. */
  refreshRules?: boolean;
  /** Free-text steer for regeneration, e.g. "price is missing". */
  rulesHint?: string;
}

/** Structured data extracted from a page (`getParsed`). */
export interface ParsedPage {
  /** What the API classified the page as, e.g. "product". */
  pageType?: string;
  /** How the data was extracted (Schema.org, __NEXT_DATA__, AI rules). */
  source?: string;
  /** The extracted fields. */
  data: unknown;
  /** The full JSON payload as returned by the API. */
  raw: Record<string, unknown>;
}

/** HTML plus the cookies and proxy that served it (`getPageWithCookies`). */
export interface PageResult {
  html?: string;
  cookies?: unknown;
  proxy?: string;
  raw: Record<string, unknown>;
}

/** Options for {@link ScrapeUnblockerClient.serp}. */
export interface SerpOptions {
  proxyCountry?: string;
  pagesToCheck?: number;
  waitAfterLoad?: number;
  captchaPause?: number;
}

/** Options for {@link ScrapeUnblockerClient.googleLocal}. */
export interface GoogleLocalOptions {
  /** Exit-IP country (ISO-2, e.g. "US"). Local results are location-sensitive. */
  proxyCountry?: string;
  /** Google UI language (e.g. "en", "de"). */
  hl?: string;
  /** Google country of search (ISO-2 lowercase, e.g. "us"). */
  gl?: string;
}

/** Options for {@link ScrapeUnblockerClient.oopbuySearch}. */
export interface OopbuySearchOptions {
  /** Marketplace channel: "1688" (default), "taobao" or "official". */
  channel?: string;
  /** Result page number. Default 1. */
  page?: number;
  /** Results per page. Default 20, max 60. */
  pageSize?: number;
  /** Sort order: "default", "price_asc", "price_desc" or "best_selling". */
  sort?: string;
  /** Exit-IP country (ISO-2, e.g. "US"). */
  proxyCountry?: string;
}
