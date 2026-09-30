import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ScrapeUnblockerClient,
  APIError,
  AuthenticationError,
  BlockedError,
  BrowserTimeoutError,
  CreditLimitExceededError,
  InvalidRequestError,
  NoDataExtractedError,
  NoSubscriptionError,
  NotFoundError,
  PaymentFailedError,
  PaymentRequiredError,
  QuotaExceededError,
  RateLimitError,
  TargetNotFoundError,
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

  it("JSON-encodes browser steps into the steps query param", async () => {
    const fetchFn = mockFetch(new Response("<html>done</html>", { status: 200 }));
    const steps = [
      { action: "wait_for", selector: "#results", timeout_ms: 5000 },
      { action: "type", selector: "input[name=q]", value: "shoes", clear: true },
      { action: "click", selector: "button[type=submit]" },
      { action: "scroll", value: "bottom" },
      { action: "press_key", value: "Enter" },
    ] as const;
    const html = await client().getPageSource("https://example.com", { steps: [...steps] });
    expect(html).toBe("<html>done</html>");

    const [url] = fetchFn.mock.calls[0];
    const parsed = new URL(url as string);
    const raw = parsed.searchParams.get("steps");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual(steps);
  });

  it("list_elements returns parsed JSON instead of HTML", async () => {
    const payload = { url: "https://example.com", count: 2, elements: [{ text: "a" }, { text: "b" }] };
    const fetchFn = mockFetch(new Response(JSON.stringify(payload), { status: 200 }));
    const result = await client().getPageSource("https://example.com", { listElements: true });
    expect(result).toEqual(payload);
    expect(result.count).toBe(2);
    expect(result.elements).toHaveLength(2);

    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("list_elements=true");
  });

  it("surfaces a 422 step_failed as a ValidationError with the JSON body", async () => {
    const body = JSON.stringify({
      error: "step_failed",
      step_index: 1,
      action: "click",
      reason: "selector not found",
      selector: "#missing",
      html: "<html></html>",
    });
    mockFetch(new Response(body, { status: 422 }));
    const promise = client({ maxRetries: 0 }).getPageSource("https://example.com", {
      steps: [{ action: "click", selector: "#missing" }],
    });
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    await expect(promise).rejects.toMatchObject({ statusCode: 422 });
    await promise.catch((err: ValidationError) => {
      expect(JSON.parse(err.body as string).error).toBe("step_failed");
    });
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

  it("googleImages targets /images/google-search", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ results: [] }), { status: 200 }));
    const out = await client().googleImages("golden retriever puppy", { proxyCountry: "US", gl: "us" });
    expect(out).toEqual({ results: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/images/google-search`);
    expect(url).toContain("q=golden");
    expect(url).toContain("proxy_country=US");
    expect(url).toContain("gl=us");
    expect(url).not.toContain("max_results=");
  });

  it("googleImages sends pages", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ results: [], pagesFetched: 3 }), { status: 200 }));
    await client().googleImages("golden retriever puppy", { proxyCountry: "DE", pages: 3 });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("pages=3");
    expect(url).toContain("proxy_country=DE");
    expect(url).not.toContain("gl=");
  });

  it("metaAdLibrary targets /ads/meta-ad-library", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ ads: [] }), { status: 200 }));
    const out = await client().metaAdLibrary("Nike", {
      country: "US",
      activeStatus: "active",
      mediaType: "image",
      maxAds: 50,
    });
    expect(out).toEqual({ ads: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/ads/meta-ad-library`);
    expect(url).toContain("advertiser=Nike");
    expect(url).toContain("country=US");
    expect(url).toContain("active_status=active");
    expect(url).toContain("media_type=image");
    expect(url).toContain("max_ads=50");
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

  it("ebaySearch targets /marketplace/ebay-search", async () => {
    const fetchFn = mockFetch(
      new Response(JSON.stringify({ results: [], exactMatches: true }), { status: 200 }),
    );
    const out = await client().ebaySearch("iphone 13", {
      marketplace: "ebay.de",
      condition: "used",
      sort: "newly_listed",
      minPrice: 100,
      maxPrice: 300,
      pageSize: 120,
    });
    expect(out).toEqual({ results: [], exactMatches: true });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/marketplace/ebay-search`);
    expect(url).toContain("keyword=iphone");
    expect(url).toContain("marketplace=ebay.de");
    expect(url).toContain("condition=used");
    expect(url).toContain("sort=newly_listed");
    expect(url).toContain("min_price=100");
    expect(url).toContain("max_price=300");
    expect(url).toContain("page_size=120");
    // Unset optional filters must not be sent at all.
    expect(url).not.toContain("seller=");
    expect(url).not.toContain("free_shipping=");
  });

  it("amazonProduct targets /marketplace/amazon-product", async () => {
    const fetchFn = mockFetch(
      new Response(JSON.stringify({ asin: "B0BSHF7WHW", price: 49.99 }), { status: 200 }),
    );
    const out = await client().amazonProduct({ asin: "B0BSHF7WHW", marketplace: "amazon.com" });
    expect(out).toEqual({ asin: "B0BSHF7WHW", price: 49.99 });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/marketplace/amazon-product`);
    expect(url).toContain("asin=B0BSHF7WHW");
    expect(url).toContain("marketplace=amazon.com");
    // Unset optional params must not be sent at all.
    expect(url).not.toContain("url=");
    expect(url).not.toContain("proxy_country=");
  });

  it("amazonSearch targets /marketplace/amazon-search", async () => {
    const fetchFn = mockFetch(
      new Response(JSON.stringify({ results: [], resultsCollected: 0 }), { status: 200 }),
    );
    const out = await client().amazonSearch("wireless headphones", {
      marketplace: "amazon.de",
      sort: "price_asc",
      minPrice: 50,
      maxPrice: 200,
    });
    expect(out).toEqual({ results: [], resultsCollected: 0 });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain(`${BASE}/marketplace/amazon-search`);
    expect(url).toContain("keyword=wireless");
    expect(url).toContain("marketplace=amazon.de");
    expect(url).toContain("sort=price_asc");
    expect(url).toContain("min_price=50");
    expect(url).toContain("max_price=200");
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

  it("southwest.flights posts to the plugin endpoint", async () => {
    const fetchFn = mockFetch(new Response(JSON.stringify({ trips: [] }), { status: 200 }));
    const out = await client().southwest.flights({
      origin: "DAL",
      dest: "HOU",
      depart_date: "2026-10-20",
      return_date: "2026-10-27",
    });
    expect(out).toEqual({ trips: [] });
    const [url] = fetchFn.mock.calls[0];
    expect(url).toContain("/flights/southwest-quotes");
    expect(url).toContain("origin=DAL");
    expect(url).toContain("dest=HOU");
    expect(url).toContain("depart_date=2026-10-20");
    expect(url).toContain("return_date=2026-10-27");
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

  it.each([404, 410])("throws TargetNotFoundError when the target answers %i", async (status) => {
    const fetchFn = mockFetch(
      new Response("<html><h1>Not Found</h1></html>", {
        status,
        headers: {
          "X-Origin-Status": String(status),
          "X-Destination-URL": "https://example.com/gone",
        },
      }),
    );
    const err = await client()
      .getPageSource("https://example.com/gone")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TargetNotFoundError);
    expect(err).toBeInstanceOf(NotFoundError);
    const target = err as TargetNotFoundError;
    expect(target.statusCode).toBe(status);
    expect(target.originStatus).toBe(status);
    expect(target.html).toBe("<html><h1>Not Found</h1></html>");
    expect(target.destinationUrl).toBe("https://example.com/gone");
    expect(target.message).toContain("billed");
    // Never retried: the target's answer will not change.
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("exposes the html of a target 404 fetched with cookies", async () => {
    const body = JSON.stringify({ html: "<html>gone</html>", cookies: [], proxy_address: "direct" });
    mockFetch(new Response(body, { status: 404, headers: { "X-Origin-Status": "404" } }));
    const err = (await client()
      .getPageWithCookies("https://example.com/gone")
      .catch((e: unknown) => e)) as TargetNotFoundError;
    expect(err).toBeInstanceOf(TargetNotFoundError);
    expect(err.html).toBe("<html>gone</html>");
    expect(err.body).toBe(body);
  });

  it("leaves html undefined on a target 404 fetched with parsedData", async () => {
    const body = JSON.stringify({ data: { page_type: "not_found", data: {} } });
    mockFetch(new Response(body, { status: 404, headers: { "X-Origin-Status": "404" } }));
    const err = (await client()
      .getParsed("https://example.com/gone")
      .catch((e: unknown) => e)) as TargetNotFoundError;
    expect(err).toBeInstanceOf(TargetNotFoundError);
    // The body is parsed-data JSON, not the target's page.
    expect(err.html).toBeUndefined();
    expect(err.body).toBe(body);
    expect(err.originStatus).toBe(404);
  });

  it("throws NoDataExtractedError when parsedData finds nothing", async () => {
    const body = JSON.stringify({
      error: "no_data_extracted",
      detail:
        "The page was rendered, but no structured data could be extracted from it. " +
        "Not billed. Call without parsed_data to get the HTML.",
    });
    const fetchFn = mockFetch(new Response(body, { status: 422 }));
    const err = (await client()
      .getParsed("https://example.com")
      .catch((e: unknown) => e)) as NoDataExtractedError;
    expect(err).toBeInstanceOf(NoDataExtractedError);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(422);
    expect(err.message).toContain("Not billed");
    expect(err.detail).toMatch(/^The page was rendered/);
    // Never retried: the same page yields the same result.
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("says not billed even when no_data_extracted has no detail", async () => {
    mockFetch(new Response(JSON.stringify({ error: "no_data_extracted" }), { status: 422 }));
    const err = (await client()
      .getParsed("https://example.com")
      .catch((e: unknown) => e)) as NoDataExtractedError;
    expect(err).toBeInstanceOf(NoDataExtractedError);
    expect(err.message).toContain("Not billed");
    expect(err.detail).toBeUndefined();
  });

  it("keeps a plain 422 a ValidationError", async () => {
    mockFetch(new Response(JSON.stringify({ detail: [{ loc: ["query", "url"] }] }), { status: 422 }));
    const err = await client()
      .getPageSource("https://example.com")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).not.toBeInstanceOf(NoDataExtractedError);
  });

  it("keeps an API 404 without X-Origin-Status a plain NotFoundError", async () => {
    mockFetch(new Response("nope", { status: 404 }));
    const err = await client()
      .getPageSource("https://example.com")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).not.toBeInstanceOf(TargetNotFoundError);
  });

  it("still returns the page for a legacy 200 carrying X-Origin-Status", async () => {
    mockFetch(new Response("<html>gone</html>", { status: 200, headers: { "X-Origin-Status": "404" } }));
    await expect(client().getPageSource("https://example.com/gone")).resolves.toBe("<html>gone</html>");
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
  it("tiktokProfile / tiktokVideo / tiktokHashtag target the TikTok plugin", async () => {
    const fetchFn = mockFetch(
      new Response(JSON.stringify({ username: "nasa", videos: [] }), { status: 200 }),
      new Response(JSON.stringify({ id: "7665075736742530317" }), { status: 200 }),
      new Response(JSON.stringify({ hashtag: "nasa", videos: [] }), { status: 200 }),
    );
    const c = client();
    const profile = await c.tiktokProfile("nasa", { maxVideos: 5, videoDetails: false });
    const video = await c.tiktokVideo("7665075736742530317", { includeTranscript: true, transcriptLanguage: "eng" });
    const tag = await c.tiktokHashtag("#nasa", { maxVideos: 0 });
    expect(profile).toEqual({ username: "nasa", videos: [] });
    expect(video).toEqual({ id: "7665075736742530317" });
    expect(tag).toEqual({ hashtag: "nasa", videos: [] });
    const [u1] = fetchFn.mock.calls[0];
    expect(u1).toContain(`${BASE}/social/tiktok-profile`);
    expect(u1).toContain("username=nasa");
    expect(u1).toContain("max_videos=5");
    expect(u1).toContain("video_details=false");
    const [u2] = fetchFn.mock.calls[1];
    expect(u2).toContain(`${BASE}/social/tiktok-video`);
    expect(u2).toContain("include_transcript=true");
    expect(u2).toContain("transcript_language=eng");
    const [u3] = fetchFn.mock.calls[2];
    expect(u3).toContain(`${BASE}/social/tiktok-hashtag`);
    expect(u3).toContain("hashtag=%23nasa");
    expect(u3).toContain("max_videos=0");
    expect(u3).not.toContain("video_details=");
  });

  it("tiktokSearch / tiktokComments target the TikTok plugin", async () => {
    const fetchFn = mockFetch(
      new Response(JSON.stringify({ query: "space", results: [] }), { status: 200 }),
      new Response(JSON.stringify({ videoId: "1", comments: [] }), { status: 200 }),
    );
    const c = client();
    expect(await c.tiktokSearch("space", { maxResults: 30, proxyCountry: "US" })).toEqual({ query: "space", results: [] });
    expect(await c.tiktokComments("7665075736742530317", { maxComments: 100 })).toEqual({ videoId: "1", comments: [] });
    const [u1] = fetchFn.mock.calls[0];
    expect(u1).toContain(`${BASE}/social/tiktok-search`);
    expect(u1).toContain("query=space");
    expect(u1).toContain("max_results=30");
    const [u2] = fetchFn.mock.calls[1];
    expect(u2).toContain(`${BASE}/social/tiktok-comments`);
    expect(u2).toContain("max_comments=100");
  });

});
