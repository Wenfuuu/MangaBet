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

// Shared upstream response check: 429 → RateLimitError, other non-2xx → Error.
export function ensureOk(res: Response, context: string): Response {
	if (res.status === 429) throw new RateLimitError();
	if (!res.ok) throw new Error(`${context} failed: ${res.status}`);
	return res;
}
