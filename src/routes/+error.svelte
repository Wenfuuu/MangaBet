<script lang="ts">
	import { page } from '$app/state';

	let status = $derived(page.status);
	let heading = $derived(
		status === 404 ? 'This page isn’t on the shelf.' : 'Something went wrong on our side.'
	);
	let detail = $derived(
		status === 404
			? 'The link may be old, or the series was moved upstream.'
			: 'The source site may be down or slow right now. Try again in a moment.'
	);
</script>

<svelte:head><title>{status} · MangaBet</title></svelte:head>

<div class="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 sm:py-24">
	<div class="max-w-[560px]">
		<h1
			class="m-0 font-serif text-3xl leading-tight font-semibold tracking-[-0.02em] text-fg sm:text-[44px]"
		>
			{heading}
		</h1>
		<p class="mt-4 mb-0 font-sans text-[15px] text-fg-soft">
			{detail} <span class="font-mono text-xs text-fg-faint">({status})</span>
		</p>

		<div class="mt-8 flex flex-wrap gap-3">
			{#if status !== 404}
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-accent px-5 py-3 font-sans text-sm font-semibold text-accent-on"
					onclick={() => location.reload()}>Try again</button
				>
			{/if}
			<a
				class="rounded-lg px-5 py-3 font-sans text-sm {status === 404
					? 'bg-accent font-semibold text-accent-on'
					: 'border border-fg/15 bg-fg/5 font-medium text-fg'}"
				href="/">Back to your shelf</a
			>
			<a
				class="rounded-lg border border-fg/15 bg-fg/5 px-5 py-3 font-sans text-sm font-medium text-fg"
				href="/downloads">Read offline</a
			>
		</div>
	</div>
</div>
