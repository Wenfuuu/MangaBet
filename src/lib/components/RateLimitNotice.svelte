<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let retrying = $state(false);

	async function retry() {
		if (retrying) return;
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<div class="flex flex-col items-center justify-center text-center px-6 py-20 min-h-[50vh]">
	<div
		class="w-14 h-14 rounded-full bg-[rgba(201,163,122,0.12)] border border-[rgba(201,163,122,0.3)] flex items-center justify-center mb-6"
	>
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2">
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</svg>
	</div>

	<div class="font-mono text-[11px] text-[var(--text-faint)] tracking-[0.18em] uppercase mb-2.5">
		Slow down
	</div>
	<h2 class="font-serif text-2xl sm:text-[32px] font-semibold text-[var(--text)] m-0 tracking-[-0.015em]">
		Too many requests
	</h2>
	<p class="font-sans text-[15px] text-[var(--text-soft)] mt-3 max-w-[440px]">
		You've made too many requests in a short time. Please wait a little while, then try again.
	</p>

	<button
		onclick={retry}
		disabled={retrying}
		class="mt-7 inline-flex items-center gap-2 px-5 py-3 bg-[var(--accent)] text-[var(--accent-on)] border-none rounded-lg font-sans text-sm font-semibold cursor-pointer disabled:opacity-60 disabled:cursor-wait"
	>
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			class={retrying ? 'animate-spin' : ''}
		>
			<path d="M21 12a9 9 0 1 1-2.64-6.36" />
			<polyline points="21 3 21 9 15 9" />
		</svg>
		{retrying ? 'Retrying…' : 'Try again'}
	</button>
</div>
