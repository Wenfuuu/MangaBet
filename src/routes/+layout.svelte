<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import NavBar from '$lib/components/NavBar.svelte';
	import LoginToast from '$lib/components/LoginToast.svelte';
	import MalConnectToast from '$lib/components/MalConnectToast.svelte';
	import Toast from '$lib/components/Toast.svelte';

	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();

	let { children } = $props();

	let isReader = $derived(page.url.pathname.includes('/chapter/'));
</script>

{#if !isReader}
	<NavBar />
{/if}

{@render children()}

<LoginToast />
<MalConnectToast />
<Toast />
