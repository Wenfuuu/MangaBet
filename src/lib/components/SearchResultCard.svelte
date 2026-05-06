<script lang="ts">
	import type { MangaSearchDTO } from '$lib/types';
	import { proxyImage } from '$lib/api';

	let { manga, onclick }: { manga: MangaSearchDTO; onclick: () => void } = $props();
</script>

<button class="card" {onclick}>
	<div class="cover-wrap">
		<img class="cover" src={proxyImage(manga.thumb)} alt={manga.name} loading="lazy" />
	</div>
	<div class="title">{manga.name}</div>
	<div class="author">{manga.author}</div>
	<div class="meta">
		<span>{manga.chapterLatest}</span>
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
		background: var(--surface);
		transition: transform 200ms;
	}

	.card:hover .cover-wrap {
		transform: translateY(-4px);
	}

	.cover {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 15px;
		font-weight: 500;
		color: var(--text);
		line-height: 1.25;
		letter-spacing: -0.005em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.author {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
		margin-top: -4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
	}
</style>
