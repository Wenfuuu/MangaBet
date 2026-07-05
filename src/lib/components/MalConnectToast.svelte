<script lang="ts" module>
	// resets on hard refresh, persists across SPA navigations.
	let shownThisSession = false;
</script>

<script lang="ts">
	import { page } from '$app/state';
	import { showToast } from '$lib/stores/toast.svelte';

	const AUTO_DISMISS_MS = 6000;
	const AUTH_PATHS = ['/login', '/register'];

	let malConnected = $derived(Boolean(page.data?.malConnected));
	let isAuthPage = $derived(AUTH_PATHS.some((p) => page.url.pathname.startsWith(p)));

	$effect(() => {
		if (shownThisSession) return;
		if (malConnected) return;
		if (isAuthPage) return;

		shownThisSession = true;
		showToast('Connect MyAnimeList to auto-sync your reading progress.', {
			durationMs: AUTO_DISMISS_MS,
			action: {
				label: 'Connect',
				// Full navigation — the endpoint 302s to MyAnimeList's consent page.
				onClick: () =>
					(location.href = `/api/mal/login?return=${encodeURIComponent(page.url.pathname + page.url.search)}`),
			},
		});
	});
</script>
