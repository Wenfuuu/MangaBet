interface RetryOptions {
	retries?: number;
	baseDelayMs?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_RETRY_AFTER_MS = 5000;

export async function fetchWithRetry(
	url: string,
	init?: RequestInit,
	{ retries = 3, baseDelayMs = 300 }: RetryOptions = {},
): Promise<Response> {
	let lastErr: unknown;

	for (let attempt = 0; attempt <= retries; attempt++) {
		try {
			const res = await fetch(url, init);
			if (res.status === 429 && attempt < retries) {
				const retryAfterMs = parseInt(res.headers.get('retry-after') ?? '', 10) * 1000;
				if (retryAfterMs > 0 && retryAfterMs <= MAX_RETRY_AFTER_MS) {
					await delay(retryAfterMs);
					continue;
				}
				return res;
			}
			if (res.status >= 500 && attempt < retries) {
				await delay(backoff(baseDelayMs, attempt));
				continue;
			}
			return res;
		} catch (err) {
			lastErr = err;
			if (attempt >= retries) throw err;
			await delay(backoff(baseDelayMs, attempt));
		}
	}

	throw lastErr;
}

function backoff(base: number, attempt: number): number {
	const ceiling = base * 2 ** attempt;
	return Math.random() * ceiling;
}
