/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';
import { OFFLINE_CACHE, canonicalImageUrl } from '$lib/offlineCache';

// `self` is typed as a Window by default; narrow it to the worker scope.
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `mangabet-cache-${version}`;
const OFFLINE_PAGE = '/offline.html';

// Immutable, safe-to-cache assets: hashed build output (JS/CSS), everything in
// static/ (icons, manifest, offline page), and prerendered pages (/downloads).
// We intentionally do NOT precache SSR pages or /api/* — those are session/auth
// sensitive and go to the network.
const PRECACHE = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(PRECACHE))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			// OFFLINE_CACHE holds chapters the user explicitly saved — it is deliberately
			// unversioned and must survive a service worker update.
			await Promise.all(
				keys.filter((key) => key !== CACHE && key !== OFFLINE_CACHE).map((key) => caches.delete(key))
			);
			await sw.clients.claim();
		})
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;

	// Only intercept same-origin GETs. POSTs (bookmarks, MAL sync, login) and
	// cross-origin requests (fonts, upstream images) go straight to the network.
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== sw.location.origin) return;

	// Hashed build assets and static files never change under a given URL —
	// serve them from cache first, falling back to network on a cold cache.
	if (PRECACHE.includes(url.pathname)) {
		event.respondWith(cacheFirst(request));
		return;
	}

	// Pages of a saved chapter come straight from disk, online or not: they are
	// immutable once published and this is the whole point of saving them.
	if (url.pathname === '/api/image') {
		event.respondWith(savedImageOrNetwork(request, url));
		return;
	}

	// SvelteKit's data payload for a client-side navigation. Prefer the network so
	// the reader stays current, fall back to the saved copy when it is unreachable.
	if (url.pathname.endsWith('/__data.json')) {
		event.respondWith(networkWithSavedFallback(request));
		return;
	}

	// Page navigations: try the network (SSR), then a saved chapter document, and
	// only then the offline page. Everything else (e.g. /api/*) is left untouched
	// so it always hits the network.
	if (request.mode === 'navigate') {
		event.respondWith(networkWithOfflineFallback(request));
	}
});

async function cacheFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);
	return cached ?? fetch(request);
}

async function matchSaved(request: Request | string): Promise<Response | undefined> {
	const cache = await caches.open(OFFLINE_CACHE);
	// SvelteKit appends `x-sveltekit-invalidated` to data requests; a saved payload
	// carries every node, which is always a valid answer to a partial request.
	return cache.match(request, { ignoreSearch: true, ignoreVary: true });
}

async function savedImageOrNetwork(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(OFFLINE_CACHE);
	const saved = await cache.match(canonicalImageUrl(url.href));
	if (saved) return saved;
	return fetch(request);
}

async function networkWithSavedFallback(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch (err) {
		const saved = await matchSaved(request);
		if (saved) return saved;
		throw err;
	}
}

async function networkWithOfflineFallback(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		const saved = await matchSaved(request);
		if (saved) return saved;

		const cache = await caches.open(CACHE);
		const offline = await cache.match(OFFLINE_PAGE);
		return offline ?? new Response('Offline', { status: 503, statusText: 'Offline' });
	}
}
