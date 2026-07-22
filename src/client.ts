import { errorForStatus, ConnectionError, ScrapeTimeoutError } from "./errors.js";
import type {
  ClientOptions,
  PageOptions,
  ParsedOptions,
  ParsedPage,
  PageResult,
  SerpOptions,
  GoogleLocalOptions,
  OopbuySearchOptions,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.scrapeunblocker.com";
const DEFAULT_TIMEOUT = 180_000;
const DEFAULT_MAX_RETRIES = 2;
const API_KEY_HEADER = "x-scrapeunblocker-key";
const RETRYABLE = new Set([429, 502, 503, 504]);
const VERSION = "0.1.3";

type Params = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params: Params): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      q.append(key, String(value));
    }
  }
  return q.toString();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Skyscanner plugin endpoints (flights, hotels, car hire). Each method takes
 * the plugin's parameters and returns the parsed JSON payload.
 */
class SkyscannerNamespace {
  constructor(private readonly client: ScrapeUnblockerClient) {}

  flightLocations(q: string, params: Params = {}): Promise<unknown> {
    return this.client.postJson("/flights/skyscanner-locations", { q, ...params });
  }
  flights(params: Params = {}): Promise<unknown> {
    return this.client.postJson("/flights/skyscanner-quotes", params);
  }
  hotelLocations(q: string, params: Params = {}): Promise<unknown> {
    return this.client.postJson("/hotels/skyscanner-locations", { q, ...params });
  }
  hotels(params: Params = {}): Promise<unknown> {
    return this.client.postJson("/hotels/skyscanner-quotes", params);
  }
  carhireLocations(q: string, params: Params = {}): Promise<unknown> {
    return this.client.postJson("/carhire/skyscanner-locations", { q, ...params });
  }
  carhire(params: Params = {}): Promise<unknown> {
    return this.client.postJson("/carhire/skyscanner-quotes", params);
  }
}

/**
 * Client for the ScrapeUnblocker API.
 *
 * @example
 * ```ts
 * import { ScrapeUnblockerClient } from "scrapeunblocker";
 * const su = new ScrapeUnblockerClient({ apiKey: "YOUR_API_KEY" });
 * const html = await su.getPageSource("https://example.com");
 * ```
 */
export class ScrapeUnblockerClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  /** Skyscanner plugin endpoints (flights, hotels, car hire). */
  readonly skyscanner: SkyscannerNamespace;

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey ?? process.env.SCRAPEUNBLOCKER_KEY;
    if (!apiKey) {
      throw new Error(
        "No API key provided. Pass { apiKey } or set the SCRAPEUNBLOCKER_KEY " +
          "environment variable. Get your key at https://app.scrapeunblocker.com",
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.skyscanner = new SkyscannerNamespace(this);
  }

  private async request(path: string, params: Params): Promise<Response> {
    const url = `${this.baseUrl}${path}?${buildQuery(params)}`;
    let attempt = 0;
    for (;;) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            [API_KEY_HEADER]: this.apiKey,
            "User-Agent": `scrapeunblocker-node/${VERSION}`,
            Accept: "*/*",
          },
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof Error && err.name === "AbortError") {
          throw new ScrapeTimeoutError(`Request to ${path} timed out after ${this.timeout}ms`);
        }
        if (attempt < this.maxRetries) {
          await sleep(Math.min(500 * 2 ** attempt, 8000));
          attempt += 1;
          continue;
        }
        throw new ConnectionError(err instanceof Error ? err.message : String(err));
      }
      clearTimeout(timer);

      if (RETRYABLE.has(response.status) && attempt < this.maxRetries) {
        await sleep(Math.min(500 * 2 ** attempt, 8000));
        attempt += 1;
        continue;
      }

      if (!response.ok) {
        const body = await response.text().catch(() => undefined);
        throw errorForStatus(response.status, body);
      }
      return response;
    }
  }

  /** @internal */
  async postJson(path: string, params: Params): Promise<unknown> {
    const response = await this.request(path, params);
    return response.json();
  }

  /** Fetch a URL and return the fully rendered HTML. */
  async getPageSource(url: string, options: PageOptions = {}): Promise<string> {
    const response = await this.request("/getPageSource", {
      url,
      proxy_country: options.proxyCountry,
      time_sleep: options.timeSleep,
      method: options.method,
      value: options.value,
      method_timeout: options.methodTimeout,
    });
    return response.text();
  }

  /** Fetch a URL and return structured JSON instead of HTML. */
  async getParsed(url: string, options: ParsedOptions = {}): Promise<ParsedPage> {
    const response = await this.request("/getPageSource", {
      url,
      parsed_data: true,
      proxy_country: options.proxyCountry,
      time_sleep: options.timeSleep,
      refresh_rules: options.refreshRules ? true : undefined,
      rules_hint: options.rulesHint,
    });
    const payload = (await response.json()) as Record<string, unknown>;
    const inner = (payload.data ?? payload) as Record<string, unknown>;
    return {
      pageType: inner.page_type as string | undefined,
      source: inner.source as string | undefined,
      data: inner.data,
      raw: payload,
    };
  }

  /** Fetch a URL and also return the cookies and proxy that served it. */
  async getPageWithCookies(url: string, options: PageOptions = {}): Promise<PageResult> {
    const response = await this.request("/getPageSource", {
      url,
      get_cookies: true,
      proxy_country: options.proxyCountry,
      time_sleep: options.timeSleep,
    });
    const payload = (await response.json()) as Record<string, unknown>;
    return {
      html: (payload.html ?? payload.page_source ?? payload.content) as string | undefined,
      cookies: payload.cookies,
      proxy: (payload.proxy ?? payload.proxy_address) as string | undefined,
      raw: payload,
    };
  }

  /** Run a Google search and return the parsed SERP as JSON. */
  async serp(keyword: string, options: SerpOptions = {}): Promise<unknown> {
    return this.postJson("/serpApi", {
      keyword,
      proxy_country: options.proxyCountry,
      pages_to_check: options.pagesToCheck ?? 1,
      wait_after_load: options.waitAfterLoad || undefined,
      captcha_pause: options.captchaPause || undefined,
    });
  }

  /**
   * Search Google Local (Maps) and return the businesses as JSON.
   *
   * Returns up to ~20 businesses, each with name, rating, reviews, price,
   * category, address, hours and a top review snippet. Local results are
   * location-sensitive - set `proxyCountry` (and optionally `gl`) to target a market.
   */
  async googleLocal(keyword: string, options: GoogleLocalOptions = {}): Promise<unknown> {
    return this.postJson("/maps/google-local", {
      keyword,
      proxy_country: options.proxyCountry,
      hl: options.hl,
      gl: options.gl,
    });
  }

  /**
   * Search Oopbuy (1688 / Taobao / official) and return the products as JSON.
   *
   * Returns product listings (spu, title, price, monthly sales, image, url)
   * for a generic keyword. Brand keywords are rejected with HTTP 422.
   */
  async oopbuySearch(keyword: string, options: OopbuySearchOptions = {}): Promise<unknown> {
    return this.postJson("/goods/oopbuy-search", {
      keyword,
      channel: options.channel,
      page: options.page,
      page_size: options.pageSize,
      sort: options.sort,
      proxy_country: options.proxyCountry,
    });
  }

  /** Fetch an image URL through the bypass chain and return its bytes. */
  async getImage(url: string, options: { proxyCountry?: string } = {}): Promise<Uint8Array> {
    const response = await this.request("/getImage", {
      url,
      proxy_country: options.proxyCountry,
    });
    return new Uint8Array(await response.arrayBuffer());
  }
}
