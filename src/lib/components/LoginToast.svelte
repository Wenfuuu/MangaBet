<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { showToast } from '$lib/stores/toast.svelte';
	import { claimPromo, isQuietPath } from '$lib/promo';

	const AUTO_DISMISS_MS = 6000;

	let isLoggedIn = $derived(Boolean(page.data?.isLoggedIn));
	let quiet = $derived(isQuietPath(page.url.pathname));

	$effect(() => {
		if (isLoggedIn || quiet) return;
		if (!claimPromo('login')) return;

		showToast('Sign in to unlock bookmarks & history.', {
			durationMs: AUTO_DISMISS_MS,
			action: { label: 'Sign in', onClick: () => goto('/login') },
		});
	});
</script>
