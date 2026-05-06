<script lang="ts">
	import type { Manga } from '$lib/types';
	import { COVER_PALETTES } from '$lib/data';

	let { manga, onclick }: { manga: Manga; onclick: () => void } = $props();

	let palette = $derived(COVER_PALETTES[manga.cover % COVER_PALETTES.length]);
</script>

<button class="card" {onclick}>
	<div class="cover-wrap">
		<div
			class="cover"
			style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
		></div>
		<div class="status-badge" class:ongoing={manga.status === 'Ongoing'}>
			{manga.status.toUpperCase()}
		</div>
	</div>
	<div class="title">{manga.title}</div>
	<div class="author">{manga.author}</div>
	<div class="genres">
		{#each manga.genres.slice(0, 2) as genre}
			<span class="genre-tag">{genre}</span>
		{/each}
	</div>
	<div class="meta">
		<span class="rating">
			<svg width="10" height="10" viewBox="0 0 24 24" fill="#c9a37a">
				<path d="M12 2l3 7 7 .6-5.3 4.7L18 22l-6-3.7L6 22l1.3-7.7L2 9.6 9 9z" />
			</svg>
			{manga.rating}
		</span>
		<span>Ch. {manga.chapters}</span>
	</div>
</button>

<style>
	.card {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.cover-wrap {
		aspect-ratio: 2 / 3;
		overflow: hidden;
		border-radius: 6px;
		position: relative;
		transition: transform 200ms;
	}

	.card:hover .cover-wrap {
		transform: translateY(-4px);
	}

	.cover {
		width: 100%;
		height: 100%;
	}

	.status-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 3px 8px;
		background: rgba(11, 9, 8, 0.85);
		border-radius: 4px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.08em;
	}

	.status-badge.ongoing {
		color: var(--accent);
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
		line-height: 1.25;
		letter-spacing: -0.005em;
	}

	.author {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
		margin-top: -4px;
	}

	.genres {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.genre-tag {
		padding: 2px 8px;
		background: var(--brown-tint);
		border-radius: 3px;
		font-family: 'Inter', sans-serif;
		font-size: 10.5px;
		color: var(--accent);
		letter-spacing: 0.02em;
	}

	.meta {
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
</style>
