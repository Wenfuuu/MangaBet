<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	import NavBar from '$lib/components/NavBar.svelte';
	import LoginToast from '$lib/components/LoginToast.svelte';

	injectAnalytics({ mode: dev ? 'development' : 'production' });

	let { children } = $props();

	let isReader = $derived(page.url.pathname.includes('/chapter/'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !isReader}
	<NavBar />
{/if}

{@render children()}

<LoginToast />
