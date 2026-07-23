import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ScrapeUnblockerClient,
  APIError,
  AuthenticationError,
  BlockedError,
  BrowserTimeoutError,
  CreditLimitExceededError,
  InvalidRequestError,
  NoSubscriptionError,
  NotFoundError,
  PaymentFailedError,
  PaymentRequiredError,
  QuotaExceededError,
  RateLimitError,
  UnsupportedContentError,
  UpstreamOutageError,
  ValidationError,
} from "../src/index.js";

const BASE = "https://api.scrapeunblocker.com";

function mockFetch(...responses: Response[]) {
  const fn = vi.fn();
  for (const r of responses) fn.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fn);
  return fn;
}

function client(opts = {}) {
  return new ScrapeUnblockerClient({ apiKey: "test-key", ...opts });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ScrapeUnblockerClient", () => {
  it("throws without an API key", () => {
    const prev = process.env.SCRAPEUNBLOCKER_KEY;
    delete process.env.SCRAPEUNBLOCKER_KEY;
    expect(() => new ScrapeUnblockerClient()).toThrow(/No API key/);
    if (prev) process.env.SCRAPEUNBLOCKER_KEY = prev;
  });

  it("reads the API key from the environment", () => {
    process.env.SCRAPEUNBLOCKER_KEY = "from-env";
    expect(() => new ScrapeUnblockerClient()).not.toThrow();
    delete process.env.SCRAPEUNBLOCKER_KEY;
  });

  it("getPageSource returns HTML and sends the key + params", async () => {
    const fetchFn = mockFetch(new Response("<html>hi</html>", { status: 200 }));
    const html = await client().getPageSource("https://example.com", { proxyCountry: "US" });
    expect(html).toBe("<html>hi</html>");

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/getPageSource`);
    expect(url).toContain("url=https%3A%2F%2Fexample.com");
    expect(url).toContain("proxy_country=US");
    expect(init.method).toBe("POST");
    expect(init.headers["x-scrapeunblocker-key"]).toBe("test-key");
  });

  it("omits undefined params", async () => {
    const fetchFn = mockFetch(new Response("ok", { status: 200 }));
    await client().getPageSource("https://example.com");
    const [url] = fetchFn.mock.calls[0];
    expect(url).not.toContain("proxy_country");
    expect(url).not.toContain("time_sleep");
  });

  it("getParsed returns a ParsedPage", async () => {
    const payload = { data: { page_type: "product", source: "schema.org", data: { price: 10 } } };
    const fetchFn = mockFetch(new Response(JSON.stringify(payload), { status: 200 }));
    const result = await client().getParsed("https://example.com/p/1", {
      refreshRules: true,
      rulesHint: "price missing",
    });
    expect(result.pageType).toBe("product");
    expect(result.data).toEqual({ price: 10 });

    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("parsed_data=true");
    expect(url).toContain("refresh_rules=true");
    expect(url).toContain("rules_hint=price+missing");
  });

  it("serp targets /serpApi", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ organic: [] }), { status: 200 }));
    const out = await client().serp("hello world", { pagesToCheck: 2 });
    expect(out).toEqual({ organic: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/serpApi`);
    expect(url).toContain("keyword=hello");
    expect(url).toContain("pages_to_check=2");
  });

  it("googleLocal targets /maps/google-local", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const out = await client().googleLocal("coffee shops in chicago", { proxyCountry: "US", gl: "us" });
    expect(out).toEqual({ results: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/maps/google-local`);
    expect(url).toContain("keyword=coffee");
    expect(url).toContain("proxy_country=US");
    expect(url).toContain("gl=us");
  });

  it("oopbuySearch targets /goods/oopbuy-search", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const out = await client().oopbuySearch("wireless earbuds", {
      channel: "taobao",
      page: 2,
      pageSize: 40,
      sort: "price_asc",
      proxyCountry: "US",
    });
    expect(out).toEqual({ results: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/goods/oopbuy-search`);
    expect(url).toContain("keyword=wireless");
    expect(url).toContain("channel=taobao");
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=40");
    expect(url).toContain("sort=price_asc");
    expect(url).toContain("proxy_country=US");
  });

  it("getImage returns bytes", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    mockFetch(new Response(bytes, { status: 200 }));
    const data = await client().getImage("https://example.com/x.png");
    expect(Array.from(data)).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it("skyscanner.flights posts to the plugin endpoint", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ itineraries: [] }), { status: 200 }));
    const out = await client().skyscanner.flights({ origin: "London", dest: "Paris" });
    expect(out).toEqual({ itineraries: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("/flights/skyscanner-quotes");
    expect(url).toContain("origin=London");
  });

  it.each([
    [400, InvalidRequestError],
    [401, AuthenticationError],
    [402, PaymentRequiredError],
    [403, BlockedError],
    [404, NotFoundError],
    [408, BrowserTimeoutError],
    [415, UnsupportedContentError],
    [422, ValidationError],
    [429, RateLimitError],
    [503, UpstreamOutageError],
    [418, APIError],
  ])("maps HTTP %i to the right error", async (status, ErrorClass) => {
    mockFetch(new Response("nope", { status }));
    await expect(client({ maxRetries: 0 }).getPageSource("https://example.com")).rejects.toBeInstanceOf(
      ErrorClass,
    );
  });

  it.each([
    ["Quota exceeded\n", QuotaExceededError],
    ["Credit limit exceeded\n", CreditLimitExceededError],
    ["Payment failed - update payment method\n", PaymentFailedError],
    ["something new we do not know yet", PaymentRequiredError],
  ])("maps the 402 body %j to the right error", async (body, ErrorClass) => {
    mockFetch(new Response(body, { status: 402 }));
    const promise = client({ maxRetries: 0 }).getPageSource("https://example.com");
    await expect(promise).rejects.toBeInstanceOf(ErrorClass);
    await expect(promise).rejects.toBeInstanceOf(PaymentRequiredError);
  });

  it.each([
    ["No valid subscription\n", NoSubscriptionError],
    ["Unauthorized\n", AuthenticationError],
  ])("maps the 401 body %j to the right error", async (body, ErrorClass) => {
    mockFetch(new Response(body, { status: 401 }));
    const promise = client({ maxRetries: 0 }).getPageSource("https://example.com");
    await expect(promise).rejects.toBeInstanceOf(ErrorClass);
    await expect(promise).rejects.toBeInstanceOf(AuthenticationError);
  });

  it.each([[401], [402]])(
    "does not retry HTTP %i - it clears on a key or billing change, not a retry",
    async (status) => {
      const fetchFn = mockFetch(new Response("Quota exceeded", { status }));
      await expect(
        client({ maxRetries: 3 }).getPageSource("https://example.com"),
      ).rejects.toBeInstanceOf(APIError);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    },
  );

  it("retries a 503 then succeeds", async () => {
    const fetchFn = mockFetch(
      new Response("outage", { status: 503 }),
      new Response("recovered", { status: 200 }),
    );
    const html = await client({ maxRetries: 2 }).getPageSource("https://example.com");
    expect(html).toBe("recovered");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
