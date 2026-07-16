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

/** The API key is missing, malformed, or not recognised (HTTP 401). */
export class AuthenticationError extends APIError {}

/** The request was rejected as invalid, e.g. a malformed URL (HTTP 400). */
export class InvalidRequestError extends APIError {}

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

/** ScrapeUnblocker returned an unexpected 5xx error. */
export class ServerError extends APIError {}

/** The request did not complete within the configured timeout. */
export class ScrapeTimeoutError extends ScrapeUnblockerError {}

/** The client could not reach the ScrapeUnblocker API. */
export class ConnectionError extends ScrapeUnblockerError {}

const BASE_MESSAGES: Record<number, string> = {
  400: "Invalid request (bad URL or unsupported scheme)",
  401: "Authentication failed - check your API key",
  403: "Target blocked by bot protection on every bypass path",
  429: "Rate limited - too many requests",
  503: "Upstream origin returned a server-side outage page",
};

/** Build a typed error from an HTTP status code and response body. */
export function errorForStatus(status: number, body?: string): APIError {
  const snippet = (body ?? "").trim().replace(/\s+/g, " ").slice(0, 200);
  const base = BASE_MESSAGES[status] ?? `API returned HTTP ${status}`;
  const message = snippet ? `${base}: ${snippet}` : base;

  switch (status) {
    case 400:
      return new InvalidRequestError(message, status, body);
    case 401:
      return new AuthenticationError(message, status, body);
    case 403:
      return new BlockedError(message, status, body);
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
