// Thrown when an upstream API call is rejected with HTTP 429 (rate limited).
export class RateLimitError extends Error {
	constructor(message = 'Upstream API rate limit reached') {
		super(message);
		this.name = 'RateLimitError';
	}
}

export function isRateLimitError(err: unknown): err is RateLimitError {
	return err instanceof RateLimitError;
}

// Thrown when an upstream API is broken/unreachable (5xx, timeout, network) as
// opposed to merely busy. Kept distinct from RateLimitError so an outage is not
// misreported to clients as a 429 — a mistake that also used to poison the
// title-search fallback.
export class UpstreamError extends Error {
	constructor(message = 'Upstream API unavailable') {
		super(message);
		this.name = 'UpstreamError';
	}
}

export function isUpstreamError(err: unknown): err is UpstreamError {
	return err instanceof UpstreamError;
}

// Shared upstream response check: 429 → RateLimitError, other non-2xx → Error.
export function ensureOk(res: Response, context: string): Response {
	if (res.status === 429) throw new RateLimitError();
	if (!res.ok) throw new Error(`${context} failed: ${res.status}`);
	return res;
}
