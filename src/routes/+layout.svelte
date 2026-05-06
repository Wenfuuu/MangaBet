<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import NavBar from '$lib/components/NavBar.svelte';

	let { children } = $props();

	let isReader = $derived(page.url.pathname.includes('/chapter/'));
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if !isReader}
	<NavBar />
{/if}

{@render children()}
