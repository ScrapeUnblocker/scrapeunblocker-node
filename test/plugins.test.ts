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
    expect(pluginMethods.length).toBeGreaterThan(100);
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
