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

function fetchImage(url: string): Promise<{ status: number; contentType: string; buffer: Buffer }> {
	return new Promise((resolve, reject) => {
		https
			.get(url, { headers: IMAGE_HEADERS }, (res) => {
				const chunks: Buffer[] = [];
				res.on('data', (chunk: Buffer) => chunks.push(chunk));
				res.on('end', () =>
					resolve({
						status: res.statusCode ?? 500,
						contentType: (res.headers['content-type'] as string) ?? 'image/webp',
						buffer: Buffer.concat(chunks),
					})
				);
			})
			.on('error', reject);
	});
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

	const { status, contentType, buffer } = await fetchImage(imageUrl);
	if (status < 200 || status >= 300) error(status, 'Upstream fetch failed');

	return new Response(new Uint8Array(buffer), {
		headers: {
			'content-type': contentType,
			'cache-control': 'public, max-age=86400',
		},
	});
};
