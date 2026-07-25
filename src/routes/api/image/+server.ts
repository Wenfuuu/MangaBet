import http from 'node:http';
import https from 'node:https';
import { API_BASE_URL } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ALLOWED_HOSTS = [
	'imgs-2.2xstorage.com',
	'imgs.2xstorage.com',
	'www.mangabats.com',
	'img-r1.2xstorage.com',
	'storage.waitst.com'
];

const IMAGE_HEADERS = {
	Referer: `${API_BASE_URL}/`,
	'User-Agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
	Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
};

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;
const MAX_ATTEMPTS = 3;
// The CDN throttles bursts (a chapter fires 20-40 requests at once), so back off
// between attempts instead of hammering it.
const RETRY_DELAYS_MS = [300, 900];
const RETRIABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

type ImageResponse = { status: number; contentType: string; buffer: Buffer };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function fetchImage(rawUrl: string, redirectsLeft = MAX_REDIRECTS): Promise<ImageResponse> {
	return new Promise((resolve, reject) => {
		const target = new URL(rawUrl);
		const client = target.protocol === 'http:' ? http : https;

		const req = client.get(target, { headers: IMAGE_HEADERS }, (res) => {
			const status = res.statusCode ?? 500;
			const location = res.headers.location;

			// https.get does not follow redirects on its own — without this a 302 from
			// the CDN surfaced to the browser as a broken image.
			if (status >= 300 && status < 400 && location) {
				res.resume();
				if (redirectsLeft <= 0) {
					reject(new Error('Too many redirects'));
					return;
				}
				resolve(fetchImage(new URL(location, target).toString(), redirectsLeft - 1));
				return;
			}

			const chunks: Buffer[] = [];
			res.on('data', (chunk: Buffer) => chunks.push(chunk));
			res.on('error', reject);
			res.on('end', () => {
				const buffer = Buffer.concat(chunks);
				// A dropped connection can end the stream early; a short body would
				// otherwise be served as a valid but undecodable image.
				const expected = Number(res.headers['content-length']);
				if (Number.isFinite(expected) && expected > 0 && buffer.length !== expected) {
					reject(new Error(`Truncated body (${buffer.length}/${expected} bytes)`));
					return;
				}
				resolve({
					status,
					contentType: (res.headers['content-type'] as string) ?? 'image/webp',
					buffer,
				});
			});
		});

		req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error('Upstream timed out')));
		req.on('error', reject);
	});
}

async function fetchImageWithRetry(url: string): Promise<ImageResponse> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		if (attempt > 1) await sleep(RETRY_DELAYS_MS[attempt - 2] ?? 900);
		try {
			const res = await fetchImage(url);
			if (res.status >= 200 && res.status < 300) return res;
			// 403/404 will not fix themselves — fail fast rather than burning retries.
			if (!RETRIABLE_STATUSES.has(res.status)) return res;
			lastError = new Error(`Upstream responded ${res.status}`);
		} catch (err) {
			lastError = err;
		}
	}

	throw lastError ?? new Error('Upstream fetch failed');
}

export const GET: RequestHandler = async ({ url }) => {
	const imageUrl = url.searchParams.get('url');
	if (!imageUrl) error(400, 'Missing url param');

	let parsed: URL;
	try {
		parsed = new URL(imageUrl);
	} catch {
		error(400, 'Invalid url');
	}

	// if (!ALLOWED_HOSTS.includes(parsed.hostname)) error(403, 'Host not allowed');

	let result: ImageResponse;
	try {
		result = await fetchImageWithRetry(imageUrl);
	} catch (err) {
		console.warn(`[image-proxy] ${imageUrl} failed after ${MAX_ATTEMPTS} attempts`, err);
		error(502, 'Upstream fetch failed');
	}

	if (result.status < 200 || result.status >= 300) error(result.status, 'Upstream fetch failed');

	return new Response(new Uint8Array(result.buffer), {
		headers: {
			'content-type': result.contentType,
			'cache-control': 'public, max-age=86400',
		},
	});
};
