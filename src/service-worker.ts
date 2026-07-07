/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

// `self` is typed as a Window by default; narrow it to the worker scope.
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `mangabet-cache-${version}`;
const OFFLINE_PAGE = '/offline.html';

// Immutable, safe-to-cache assets: hashed build output (JS/CSS) + everything
// in static/ (icons, manifest, offline page). We intentionally do NOT precache
// SSR pages or /api/* — those are session/auth sensitive and go to the network.
const PRECACHE = [...build, ...files];

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
			await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
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

	// Page navigations: try the network (SSR), fall back to the offline page
	// only when the network is unreachable. Everything else (e.g. /api/*) is
	// left untouched so it always hits the network.
	if (request.mode === 'navigate') {
		event.respondWith(networkWithOfflineFallback(request));
	}
});

async function cacheFirst(request: Request): Promise<Response> {
	const cache = await caches.open(CACHE);
	const cached = await cache.match(request);
	return cached ?? fetch(request);
}

async function networkWithOfflineFallback(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		const cache = await caches.open(CACHE);
		const offline = await cache.match(OFFLINE_PAGE);
		return offline ?? new Response('Offline', { status: 503, statusText: 'Offline' });
	}
}
