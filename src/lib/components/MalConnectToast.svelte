<script lang="ts">
	import { page } from '$app/state';
	import { showToast } from '$lib/stores/toast.svelte';
	import { claimPromo, isQuietPath } from '$lib/promo';

	const AUTO_DISMISS_MS = 6000;

	let malConnected = $derived(Boolean(page.data?.malConnected));
	let quiet = $derived(isQuietPath(page.url.pathname));

	$effect(() => {
		if (malConnected || quiet) return;
		if (!claimPromo('mal')) return;

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
