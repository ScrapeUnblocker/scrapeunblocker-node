import { afterEach, describe, expect, it, vi } from "vitest";
import { PluginMethods, ScrapeUnblockerClient } from "../src/index.js";

const BASE = "https://api.scrapeunblocker.com";

function mockJson(body: unknown = { ok: true }) {
  const fn = vi.fn().mockImplementation(
    async () => new Response(JSON.stringify(body), { status: 200 }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function query(fn: ReturnType<typeof vi.fn>, call = 0): URLSearchParams {
  return new URL(fn.mock.calls[call][0] as string).searchParams;
}

function entries(params: URLSearchParams): [string, string][] {
  return [...params.entries()];
}

const su = () => new ScrapeUnblockerClient({ apiKey: "test-key" });

const pluginMethods = Object.getOwnPropertyNames(PluginMethods.prototype).filter(
  (name) => name !== "constructor" && name !== "plugin" && name !== "postJson",
);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("plugin methods", () => {
  it("covers every public plugin endpoint", () => {
    expect(pluginMethods.length).toBeGreaterThan(90);
  });

  it.each(pluginMethods)("%s posts its positional arguments", async (name) => {
    const fetchFn = mockJson();
    const method = (su() as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[name];
    // .length counts the parameters before the defaulted options object.
    const args = Array.from({ length: method.length }, (_, i) => `v${i}`);
    expect(await method.apply(su(), args)).toEqual({ ok: true });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(url.startsWith(`${BASE}/`)).toBe(true);
    const values = [...new URL(url).searchParams.values()];
    for (const arg of args) expect(values).toContain(arg);
    expect(values.filter((v) => v.startsWith("v")).length).toBe(args.length);
  });

  it("sends options under their API names and leaves unset ones out", async () => {
    const fetchFn = mockJson({ products: [] });
    await su().targetSearch("tv", { sort: "price_low", maxResults: 48, minPrice: undefined });
    expect(fetchFn.mock.calls[0][0]).toContain(`${BASE}/marketplace/target-search?`);
    expect(entries(query(fetchFn))).toEqual([
      ["query", "tv"],
      ["sort", "price_low"],
      ["max_results", "48"],
    ]);
  });

  it("a mode method pins its mode", async () => {
    const fetchFn = mockJson();
    await su().woolworthsProduct("888137");
    expect(entries(query(fetchFn))).toEqual([
      ["mode", "product"],
      ["product", "888137"],
    ]);
  });

  it("two positional arguments and a false flag", async () => {
    const fetchFn = mockJson();
    await su().yelpSearch("coffee", "San Francisco, CA", { openNow: false });
    expect(entries(query(fetchFn))).toEqual([
      ["mode", "search"],
      ["find_desc", "coffee"],
      ["find_loc", "San Francisco, CA"],
      ["open_now", "false"],
    ]);
  });

  it("joins a list where the API takes one string", async () => {
    const fetchFn = mockJson();
    await su().googleTrends(["coffee", "tea"], { geo: "US" });
    expect(entries(query(fetchFn))).toEqual([
      ["keywords", "coffee,tea"],
      ["geo", "US"],
    ]);
  });

  it("repeats the key for a list parameter", async () => {
    const fetchFn = mockJson();
    await su().trustpilotReviews("www.nike.com", { stars: [4, 5] });
    expect(entries(query(fetchFn))).toEqual([
      ["company", "www.nike.com"],
      ["stars", "4"],
      ["stars", "5"],
    ]);
  });

  it("an optional positional argument can be left out", async () => {
    const fetchFn = mockJson();
    await su().careerSiteJobs(undefined, { provider: "greenhouse", company: "stripe" });
    expect(entries(query(fetchFn))).toEqual([
      ["provider", "greenhouse"],
      ["company", "stripe"],
    ]);
  });

  it("plugin() calls any endpoint by path", async () => {
    const fetchFn = mockJson();
    await su().plugin("/marketplace/target-search", { query: "tv", sort: null });
    expect(fetchFn.mock.calls[0][0]).toBe(`${BASE}/marketplace/target-search?query=tv`);
  });
});

describe("new plugin families", () => {
  it("googleHotels / googleHotelsProperty", async () => {
    const fetchFn = mockJson();
    await su().googleHotels("hotels in Paris", { checkIn: "2026-11-02", checkOut: "2026-11-05", currency: "EUR" });
    await su().googleHotelsProperty("ChkIqp", { adults: 1, children: "7,10" });
    expect(fetchFn.mock.calls[0][0]).toContain(`${BASE}/travel/google-hotels?`);
    expect(entries(query(fetchFn, 0))).toEqual([
      ["q", "hotels in Paris"],
      ["check_in", "2026-11-02"],
      ["check_out", "2026-11-05"],
      ["currency", "EUR"],
    ]);
    expect(fetchFn.mock.calls[1][0]).toContain(`${BASE}/travel/google-hotels-property?`);
    expect(entries(query(fetchFn, 1))).toEqual([
      ["property_token", "ChkIqp"],
      ["adults", "1"],
      ["children", "7,10"],
    ]);
  });

  it("googleNews takes a query or a section", async () => {
    const fetchFn = mockJson();
    await su().googleNews("tesla", { when: "1d", maxResults: 50 });
    await su().googleNews(undefined, { topic: "technology", gl: "gb" });
    expect(entries(query(fetchFn, 0))).toEqual([
      ["q", "tesla"],
      ["when", "1d"],
      ["max_results", "50"],
    ]);
    expect(entries(query(fetchFn, 1))).toEqual([
      ["topic", "technology"],
      ["gl", "gb"],
    ]);
  });

  it("googleAdsTransparency / googleAdsTransparencyAdvertisers", async () => {
    const fetchFn = mockJson();
    await su().googleAdsTransparency({ domain: "nike.com", format: "video", includePreview: false });
    await su().googleAdsTransparencyAdvertisers("nike", { maxResults: 5 });
    expect(fetchFn.mock.calls[0][0]).toContain(`${BASE}/ads/google-ads-transparency?`);
    expect(entries(query(fetchFn, 0))).toEqual([
      ["domain", "nike.com"],
      ["format", "video"],
      ["include_preview", "false"],
    ]);
    expect(fetchFn.mock.calls[1][0]).toContain(`${BASE}/ads/google-ads-transparency-advertisers?`);
    expect(entries(query(fetchFn, 1))).toEqual([
      ["q", "nike"],
      ["max_results", "5"],
    ]);
  });

  it("shopeeSearch / shopeeProduct", async () => {
    const fetchFn = mockJson();
    await su().shopeeSearch("lego", { country: "my", sort: "sales", minPrice: 10 });
    await su().shopeeProduct(undefined, { shopId: "442800909", itemId: "40270108836", country: "sg" });
    expect(entries(query(fetchFn, 0))).toEqual([
      ["q", "lego"],
      ["country", "my"],
      ["sort", "sales"],
      ["min_price", "10"],
    ]);
    expect(fetchFn.mock.calls[1][0]).toContain(`${BASE}/marketplace/shopee-product?`);
    expect(entries(query(fetchFn, 1))).toEqual([
      ["shop_id", "442800909"],
      ["item_id", "40270108836"],
      ["country", "sg"],
    ]);
  });

  it("taobaoSearch / taobaoProduct", async () => {
    const fetchFn = mockJson();
    await su().taobaoSearch("phone case", { sort: "sales", priceMax: 99.5, filter: "20000-88634403" });
    await su().taobaoProduct(undefined, { url: "https://item.taobao.com/item.htm?id=765833709683" });
    expect(entries(query(fetchFn, 0))).toEqual([
      ["q", "phone case"],
      ["sort", "sales"],
      ["price_max", "99.5"],
      ["filter", "20000-88634403"],
    ]);
    expect(entries(query(fetchFn, 1))).toEqual([["url", "https://item.taobao.com/item.htm?id=765833709683"]]);
  });

  it("upworkJobs without a query", async () => {
    const fetchFn = mockJson();
    await su().upworkJobs(undefined, { sort: "recency", jobType: "hourly", details: true });
    expect(fetchFn.mock.calls[0][0]).toContain(`${BASE}/jobs/upwork?`);
    expect(entries(query(fetchFn))).toEqual([
      ["job_type", "hourly"],
      ["sort", "recency"],
      ["details", "true"],
    ]);
  });

  it("smythsSearch / wishSearch", async () => {
    const fetchFn = mockJson();
    await su().smythsSearch("lego", { maxResults: 24 });
    await su().wishSearch("phone case", { page: 2 });
    expect(entries(query(fetchFn, 0))).toEqual([
      ["mode", "search"],
      ["query", "lego"],
      ["max_results", "24"],
    ]);
    expect(entries(query(fetchFn, 1))).toEqual([
      ["query", "phone case"],
      ["page", "2"],
    ]);
  });
});
