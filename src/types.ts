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
export interface EbaySearchOptions {
  /** Regional eBay site, e.g. "ebay.com" (default), "ebay.de", "ebay.co.uk". */
  marketplace?: string;
  /** Result page number. Default 1. */
  page?: number;
  /** Listings per page: 60 (default), 120 or 240. */
  pageSize?: number;
  /** "new", "open_box", "refurbished", "used" or "for_parts". */
  condition?: string;
  /** "best_match" (default), "newly_listed", "ending_soon", "price_asc" or "price_desc". */
  sort?: string;
  /** "all" (default), "buy_it_now" or "auction". */
  listingType?: string;
  /** Lowest price to include, in the marketplace's currency. */
  minPrice?: number;
  /** Highest price to include, in the marketplace's currency. */
  maxPrice?: number;
  /** Keep only listings eBay marks as free delivery. */
  freeShipping?: boolean;
  /** Restrict the search to one seller's username. */
  seller?: string;
  /** eBay category id to search inside, e.g. "131090" for vehicle parts. */
  category?: string;
  /** Exit-IP country (ISO-2, e.g. "US"). */
  proxyCountry?: string;
}

export interface AmazonProductOptions {
  /** 10-char ASIN, e.g. "B0BSHF7WHW" (books use their ISBN-10). */
  asin?: string;
  /** Full product URL instead of `asin`; the ASIN and marketplace are read from it. */
  url?: string;
  /** Regional Amazon site the ASIN belongs to. Default "amazon.com". */
  marketplace?: string;
  /** Exit-IP country (ISO-2). Defaults to the marketplace's home country. */
  proxyCountry?: string;
}

export interface AmazonSearchOptions {
  /** Regional Amazon site, e.g. "amazon.com" (default), "amazon.de". */
  marketplace?: string;
  /** Result page number. Default 1. */
  page?: number;
  /** "featured" (default), "price_asc", "price_desc", "avg_review" or "newest". */
  sort?: string;
  /** Lowest price to include, in the marketplace's currency. */
  minPrice?: number;
  /** Highest price to include, in the marketplace's currency. */
  maxPrice?: number;
  /** Exit-IP country (ISO-2). Defaults to the marketplace's home country. */
  proxyCountry?: string;
}

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
