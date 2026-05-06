<script lang="ts">
	import { goto } from '$app/navigation';
	import { MANGA_LIBRARY } from '$lib/data';
	import ContinueCard from '$lib/components/ContinueCard.svelte';
	import type { ContinueItem } from '$lib/types';

	let continueItems = $state<ContinueItem[]>([]);

	$effect(() => {
		const items: ContinueItem[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			const match = key?.match(/^mangabet:reader:(.+):(\d+)$/);
			if (match) {
				const [, mid, ch] = match;
				const manga = MANGA_LIBRARY.find((x) => x.id === mid);
				if (!manga) continue;
				const p = parseInt(localStorage.getItem(key!) ?? '1', 10) || 1;
				items.push({ manga, chapter: parseInt(ch, 10), page: p });
			}
		}
		items.sort((a, b) => b.chapter - a.chapter);
		continueItems = items.slice(0, 3);
	});
</script>

<div class="page">
	<div class="intro">
		<div class="eyebrow">Welcome back</div>
		<h1 class="headline">Find your next chapter.</h1>
		<p class="subtext">
			Search any title above to begin reading. Your place is kept on this device for the session.
		</p>
	</div>

	<section>
		<div class="section-header">
			<div>
				<h2 class="section-title">Continue reading</h2>
				<p class="section-subtitle">Where you left off this session</p>
			</div>
		</div>

		{#if continueItems.length > 0}
			<div class="continue-grid">
				{#each continueItems as item}
					<ContinueCard
						manga={item.manga}
						chapter={item.chapter}
						page={item.page}
						onclick={() => goto(`/manga/${item.manga.id}/chapter/${item.chapter}`)}
					/>
				{/each}
			</div>
		{:else}
			<div class="empty-state">
				<div>
					<h3 class="empty-title">Nothing on the shelf yet.</h3>
					<p class="empty-body">
						Search for a title to begin reading. Your place will be saved on this device until the
						session ends.
					</p>
				</div>
				<button class="btn-primary" onclick={() => goto('/search')}>Browse manga →</button>
			</div>
		{/if}
	</section>
</div>

<style>
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 48px 32px 96px;
	}

	.intro {
		margin-bottom: 48px;
	}

	.eyebrow {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin-bottom: 10px;
	}

	.headline {
		font-family: 'Source Serif 4', serif;
		font-size: 48px;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		letter-spacing: -0.02em;
	}

	.subtext {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		color: var(--text-soft);
		margin-top: 12px;
		max-width: 560px;
	}

	.section-header {
		margin-bottom: 24px;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.section-title {
		font-family: 'Source Serif 4', serif;
		font-size: 28px;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		letter-spacing: -0.015em;
	}

	.section-subtitle {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-faint);
		margin: 4px 0 0;
	}

	.continue-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.empty-state {
		padding: 48px 32px;
		background: var(--surface);
		border: 1px dashed rgba(160, 130, 100, 0.18);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}

	.empty-title {
		font-family: 'Source Serif 4', serif;
		font-size: 22px;
		font-weight: 500;
		color: var(--text);
		margin: 0 0 6px;
	}

	.empty-body {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		color: var(--text-faint);
		max-width: 480px;
		margin: 0;
	}

	.btn-primary {
		padding: 12px 22px;
		background: var(--accent);
		color: var(--accent-on);
		border: none;
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
	}
</style>
