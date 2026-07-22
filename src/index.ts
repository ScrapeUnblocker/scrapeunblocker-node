/**
 * Official Node.js client for the ScrapeUnblocker web scraping API.
 *
 * @example
 * ```ts
 * import { ScrapeUnblockerClient } from "scrapeunblocker";
 *
 * const su = new ScrapeUnblockerClient(); // reads SCRAPEUNBLOCKER_KEY
 * const html = await su.getPageSource("https://example.com");
 * const product = await su.getParsed("https://www.amazon.com/dp/B08N5WRWNW");
 * ```
 */

export { ScrapeUnblockerClient } from "./client.js";
export { ScrapeUnblockerClient as Client } from "./client.js";
export * from "./errors.js";
export type {
  ClientOptions,
  PageOptions,
  ParsedOptions,
  ParsedPage,
  PageResult,
  SerpOptions,
  GoogleLocalOptions,
  OopbuySearchOptions,
} from "./types.js";
