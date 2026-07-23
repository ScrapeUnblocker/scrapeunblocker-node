/**
 * Error hierarchy for the ScrapeUnblocker client. Every error derives from
 * {@link ScrapeUnblockerError}, and API responses map to typed subclasses by
 * status code.
 */

export class ScrapeUnblockerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** An error response returned by the ScrapeUnblocker API. */
export class APIError extends ScrapeUnblockerError {
  readonly statusCode: number;
  readonly body?: string;

  constructor(message: string, statusCode: number, body?: string) {
    super(message);
    this.statusCode = statusCode;
    this.body = body;
  }
}

/**
 * The API key was rejected (HTTP 401).
 *
 * Two cases produce a 401: an unrecognised key (`Unauthorized` - a typo,
 * trailing whitespace, an empty value, or a key rotated in the dashboard), and
 * a valid key on an account with no plan, which raises the
 * {@link NoSubscriptionError} subclass.
 *
 * Omitting the API key header entirely is a 400, not a 401. Nothing is scraped
 * for a 401, so it is not billed and does not count against your quota.
 */
export class AuthenticationError extends APIError {}

/**
 * The key is valid but the account has no active plan (HTTP 401).
 *
 * Raised when the API answers a 401 with `No valid subscription`. Pick a plan
 * at https://app.scrapeunblocker.com - access resumes within about a minute,
 * and the key does not change.
 */
export class NoSubscriptionError extends AuthenticationError {}

/**
 * The account has a billing problem (HTTP 402).
 *
 * Credentials are fine - the request was stopped for a billing reason. There
 * are three, each raised as a dedicated subclass: {@link QuotaExceededError},
 * {@link CreditLimitExceededError} and {@link PaymentFailedError}. Catch this
 * base class to handle all three.
 *
 * When more than one applies, the most serious wins: failed payment outranks
 * credit limit, which outranks quota. All three lift by themselves once the
 * billing state changes - access returns within roughly a minute, with no key
 * change needed. Like a 401, a 402 is refused before anything is scraped, so
 * it is never billed. Retrying is pointless; fix the billing state first.
 */
export class PaymentRequiredError extends APIError {}

/**
 * Every request the plan allows this period has been used (HTTP 402).
 *
 * On plans that permit overages this only fires past the quota *plus* the
 * overage allowance; inside that band requests still succeed and the extra
 * usage is invoiced. Active coupon credit is spent before plan quota. The
 * counter resets on the subscription's anniversary day, not the first of the
 * month.
 */
export class QuotaExceededError extends PaymentRequiredError {}

/**
 * The unpaid balance has passed the account's credit limit (HTTP 402).
 *
 * The balance counted here is the amount remaining on open invoices plus
 * metered usage already consumed but not yet invoiced. Outstanding invoices
 * are charged automatically when this triggers, so with a working card it
 * usually clears itself within about a minute.
 */
export class CreditLimitExceededError extends PaymentRequiredError {}

/**
 * A card payment has been declined three times (HTTP 402).
 *
 * Those attempts are the payment provider's automatic retries spread over
 * several days, so a card has been failing for a while. Subscribing to a new
 * plan does **not** clear this: the old unpaid invoice stays open, and the
 * block stays until that specific invoice is paid.
 */
export class PaymentFailedError extends PaymentRequiredError {}

/**
 * The request was rejected as invalid (HTTP 400).
 *
 * Raised for a malformed URL or unsupported scheme, for a missing
 * `x-scrapeunblocker-key` header (`Missing x-scrapeunblocker-key`), and for a
 * URL that belongs to a dedicated plugin - the response names the endpoint to
 * use instead.
 */
export class InvalidRequestError extends APIError {}

/**
 * The page loaded but the requested element was absent (HTTP 404).
 * Only `getImage()` raises this: the page rendered and held no `<img>` tag.
 */
export class NotFoundError extends APIError {}

/**
 * The browser run did not finish in time on our side (HTTP 408).
 *
 * Distinct from {@link ScrapeTimeoutError}, which is this client giving up
 * locally. Here the API answered - it just could not render the page in time.
 */
export class BrowserTimeoutError extends APIError {}

/**
 * The URL serves something other than HTML (HTTP 415).
 * The message names the content type found. For images, use `getImage()`.
 */
export class UnsupportedContentError extends APIError {}

/**
 * A request parameter is missing or has the wrong type (HTTP 422).
 *
 * Unlike the other errors the body is JSON, with a `detail` array pinpointing
 * each problem field. Read it from {@link APIError.body}.
 */
export class ValidationError extends APIError {}

/**
 * The target site blocked every available bypass path (HTTP 403).
 * This is the target's anti-bot protection winning, not a bad request.
 * Blocked calls are not billed.
 */
export class BlockedError extends APIError {}

/** Too many requests against your account in a short window (HTTP 429). */
export class RateLimitError extends APIError {}

/**
 * The origin site returned a server-side outage page (HTTP 503).
 * The target is down, not ScrapeUnblocker. Retrying later usually works.
 */
export class UpstreamOutageError extends APIError {}

/**
 * ScrapeUnblocker returned an unexpected 5xx error.
 * Also covers the 504 returned when a SERP fetch times out upstream.
 */
export class ServerError extends APIError {}

/** The request did not complete within the configured timeout. */
export class ScrapeTimeoutError extends ScrapeUnblockerError {}

/** The client could not reach the ScrapeUnblocker API. */
export class ConnectionError extends ScrapeUnblockerError {}

const BASE_MESSAGES: Record<number, string> = {
  400: "Invalid request (bad URL, unsupported scheme, or missing API key header)",
  401: "Authentication failed - key not recognised, or account has no active plan",
  402: "Billing block - quota exceeded, credit limit exceeded, or a failed payment",
  403: "Target blocked by bot protection on every bypass path",
  404: "Requested element not found on the page",
  408: "Browser run timed out before the page was ready",
  415: "URL does not serve HTML",
  422: "Validation error - see the detail array in the response body",
  429: "Rate limited - too many requests",
  503: "Upstream origin returned a server-side outage page",
  504: "Fetch timed out upstream",
};

/**
 * A 401 is either an unknown key or a recognised key on an account without a
 * plan, and only the body tells them apart. Anything unrecognised stays on the
 * general AuthenticationError rather than guessing.
 */
function authErrorFor(message: string, status: number, body?: string): APIError {
  if ((body ?? "").toLowerCase().includes("no valid subscription")) {
    return new NoSubscriptionError(message, status, body);
  }
  return new AuthenticationError(message, status, body);
}

/**
 * The three billing blocks share a status code and differ only in their
 * plain-text body. An unrecognised body falls back to PaymentRequiredError.
 */
function billingErrorFor(message: string, status: number, body?: string): APIError {
  const text = (body ?? "").toLowerCase();
  if (text.includes("quota exceeded")) {
    return new QuotaExceededError(message, status, body);
  }
  if (text.includes("credit limit exceeded")) {
    return new CreditLimitExceededError(message, status, body);
  }
  if (text.includes("payment failed")) {
    return new PaymentFailedError(message, status, body);
  }
  return new PaymentRequiredError(message, status, body);
}

/** Build a typed error from an HTTP status code and response body. */
export function errorForStatus(status: number, body?: string): APIError {
  const snippet = (body ?? "").trim().replace(/\s+/g, " ").slice(0, 200);
  const base = BASE_MESSAGES[status] ?? `API returned HTTP ${status}`;
  const message = snippet ? `${base}: ${snippet}` : base;

  switch (status) {
    case 400:
      return new InvalidRequestError(message, status, body);
    case 401:
      return authErrorFor(message, status, body);
    case 402:
      return billingErrorFor(message, status, body);
    case 403:
      return new BlockedError(message, status, body);
    case 404:
      return new NotFoundError(message, status, body);
    case 408:
      return new BrowserTimeoutError(message, status, body);
    case 415:
      return new UnsupportedContentError(message, status, body);
    case 422:
      return new ValidationError(message, status, body);
    case 429:
      return new RateLimitError(message, status, body);
    case 503:
      return new UpstreamOutageError(message, status, body);
    default:
      return status >= 500
        ? new ServerError(message, status, body)
        : new APIError(message, status, body);
  }
}
