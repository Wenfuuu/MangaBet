<script lang="ts">
	import type { Chapter, Manga } from '$lib/types';
	import { goto } from '$app/navigation';

	let {
		manga,
		nextChapter,
	}: {
		manga: Manga;
		nextChapter?: Chapter;
	} = $props();
</script>

<div class="panel">
	<div class="eyebrow">End of chapter</div>
	<h3 class="heading">Take a breath.</h3>
	<div class="actions">
		{#if nextChapter}
			<button
				class="btn-primary"
				onclick={() => goto(`/manga/${manga.id}/chapter/${nextChapter!.number}`)}
			>
				Next chapter →
			</button>
		{/if}
		<button class="btn-secondary" onclick={() => goto(`/manga/${manga.id}`)}>
			Back to chapters
		</button>
	</div>
</div>

<style>
	.panel {
		padding: 32px 24px;
		margin-top: 12px;
		background: var(--surface);
		border: 1px solid rgba(160, 130, 100, 0.12);
		border-radius: 10px;
		text-align: center;
	}

	.eyebrow {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.18em;
		text-transform: uppercase;
		margin-bottom: 8px;
	}

	.heading {
		font-family: 'Source Serif 4', serif;
		font-size: 24px;
		font-weight: 500;
		color: var(--text);
		margin: 0 0 20px;
	}

	.actions {
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	.btn-primary {
		padding: 12px 22px;
		background: var(--accent);
		color: var(--accent-on);
		border: none;
		border-radius: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-secondary {
		padding: 12px 22px;
		background: rgba(232, 220, 203, 0.08);
		color: var(--text);
		border: 1px solid rgba(232, 220, 203, 0.15);
		border-radius: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
	}
</style>
