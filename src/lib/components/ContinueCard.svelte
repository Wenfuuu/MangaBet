<script lang="ts">
	import type { Manga } from '$lib/types';
	import { COVER_PALETTES } from '$lib/data';

	let {
		manga,
		chapter,
		page,
		onclick,
	}: { manga: Manga; chapter: number; page: number; onclick: () => void } = $props();

	let progress = $derived(chapter / manga.chapters);
	let palette = $derived(COVER_PALETTES[manga.cover % COVER_PALETTES.length]);
</script>

<button class="card" {onclick}>
	<div
		class="cover"
		style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
	></div>
	<div class="info">
		<div>
			<div class="eyebrow">Chapter {chapter} · Page {page}</div>
			<div class="title">{manga.title}</div>
			<div class="author">{manga.author}</div>
		</div>
		<div>
			<div class="progress-track">
				<div class="progress-fill" style="width: {progress * 100}%;"></div>
			</div>
			<div class="resume">Resume reading →</div>
		</div>
	</div>
</button>

<style>
	.card {
		display: flex;
		gap: 16px;
		padding: 16px;
		background: var(--surface);
		border: 1px solid var(--border-faint);
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
		transition:
			background 200ms,
			border-color 200ms;
		width: 100%;
	}

	.card:hover {
		background: var(--surface-2);
		border-color: var(--border-strong);
	}

	.cover {
		width: 76px;
		height: 114px;
		flex-shrink: 0;
		border-radius: 4px;
	}

	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-width: 0;
	}

	.eyebrow {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 17px;
		font-weight: 500;
		color: var(--text);
		line-height: 1.2;
		margin-bottom: 6px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.author {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
	}

	.progress-track {
		height: 3px;
		background: rgba(160, 130, 100, 0.15);
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: 6px;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
	}

	.resume {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
	}
</style>
