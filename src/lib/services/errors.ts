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
