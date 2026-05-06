<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { MANGA_LIBRARY, COVER_PALETTES, generateChapters } from '$lib/data';
	import ChapterRow from '$lib/components/ChapterRow.svelte';

	let manga = $derived(
		MANGA_LIBRARY.find((m) => m.id === page.params.id) ?? MANGA_LIBRARY[0]
	);
	let chapters = $derived(generateChapters(manga.chapters));
	let order = $state<'desc' | 'asc'>('desc');
	let visible = $derived(
		chapters
			.slice()
			.sort((a, b) => (order === 'desc' ? b.number - a.number : a.number - b.number))
	);
	let palette = $derived(COVER_PALETTES[manga.cover % COVER_PALETTES.length]);
</script>

<div>
	<!-- Hero band -->
	<div class="hero">
		<!-- Blurred background cover -->
		<div
			class="hero-bg"
			style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
		></div>
		<div class="hero-overlay"></div>

		<div class="hero-inner">
			<!-- Cover -->
			<div
				class="cover"
				style="background: linear-gradient(160deg, {palette[0]}, {palette[1]}, {palette[2]});"
			></div>

			<!-- Info -->
			<div class="info">
				<div class="status-row">
					<span class="status" class:ongoing={manga.status === 'Ongoing'}>{manga.status}</span>
					<span class="status-dot"></span>
					<span class="year">{manga.year}</span>
				</div>

				<h1 class="title">{manga.title}</h1>
				<div class="author">by <span class="author-name">{manga.author}</span></div>

				<div class="stats">
					<div class="stat">
						<div class="stat-label">Rating</div>
						<div class="stat-value">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="#c9a37a" style="display:inline;vertical-align:middle;margin-right:4px;">
								<path d="M12 2l3 7 7 .6-5.3 4.7L18 22l-6-3.7L6 22l1.3-7.7L2 9.6 9 9z" />
							</svg>{manga.rating}
						</div>
					</div>
					<div class="stat">
						<div class="stat-label">Chapters</div>
						<div class="stat-value">{manga.chapters}</div>
					</div>
					<div class="stat">
						<div class="stat-label">Readers</div>
						<div class="stat-value">124K</div>
					</div>
					<div class="stat">
						<div class="stat-label">Updated</div>
						<div class="stat-value">2d ago</div>
					</div>
				</div>

				<div class="genres">
					{#each manga.genres as g}
						<span class="genre-pill">{g}</span>
					{/each}
				</div>

				{#if manga.summary}
					<p class="summary">{manga.summary}</p>
				{/if}

				<div class="cta-row">
					<button
						class="btn-primary"
						onclick={() => goto(`/manga/${manga.id}/chapter/1`)}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5,3 19,12 5,21" />
						</svg>
						Start from Ch. 1
					</button>
					<button
						class="btn-secondary"
						onclick={() => goto(`/manga/${manga.id}/chapter/${manga.chapters}`)}
					>
						Latest chapter
					</button>
					<button class="btn-icon" aria-label="Share">
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="18" cy="5" r="3" />
							<circle cx="6" cy="12" r="3" />
							<circle cx="18" cy="19" r="3" />
							<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
							<line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Chapter list -->
	<div class="chapters-section">
		<div class="chapters-header">
			<h2 class="chapters-title">
				Chapters
				<span class="chapters-count">{chapters.length} total</span>
			</h2>
			<button class="sort-btn" onclick={() => (order = order === 'desc' ? 'asc' : 'desc')}>
				<svg
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					style="transform: {order === 'asc' ? 'rotate(180deg)' : 'none'}; transition: transform 200ms;"
				>
					<line x1="12" y1="5" x2="12" y2="19" />
					<polyline points="19 12 12 19 5 12" />
				</svg>
				{order === 'desc' ? 'Newest first' : 'Oldest first'}
			</button>
		</div>

		<div class="chapter-list">
			{#each visible as ch, i}
				<ChapterRow
					{ch}
					isLast={i === visible.length - 1}
					onclick={() => goto(`/manga/${manga.id}/chapter/${ch.number}`)}
				/>
			{/each}
		</div>
	</div>
</div>

<style>
	.hero {
		position: relative;
		border-bottom: 1px solid var(--border-faint);
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		opacity: 0.35;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(11, 9, 8, 0.7), rgba(11, 9, 8, 1));
	}

	.hero-inner {
		position: relative;
		max-width: 1400px;
		margin: 0 auto;
		padding: 56px 32px 48px;
		display: flex;
		gap: 48px;
	}

	.cover {
		width: 280px;
		height: 420px;
		flex-shrink: 0;
		border-radius: 6px;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
	}

	.info {
		flex: 1;
		padding-top: 12px;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 14px;
	}

	.status {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.status.ongoing {
		color: var(--accent);
	}

	.status-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--text-quiet);
	}

	.year {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.12em;
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 56px;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		letter-spacing: -0.025em;
		line-height: 1;
		text-wrap: balance;
	}

	.author {
		font-family: 'Inter', sans-serif;
		font-size: 16px;
		color: var(--text-soft);
		margin-top: 14px;
	}

	.author-name {
		color: var(--text);
	}

	.stats {
		display: flex;
		gap: 32px;
		margin-top: 28px;
	}

	.stat-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.stat-value {
		font-family: 'Source Serif 4', serif;
		font-size: 22px;
		font-weight: 500;
		color: var(--text);
	}

	.genres {
		display: flex;
		gap: 8px;
		margin-top: 24px;
		flex-wrap: wrap;
	}

	.genre-pill {
		padding: 5px 12px;
		background: rgba(107, 67, 36, 0.2);
		border: 1px solid rgba(201, 163, 122, 0.2);
		border-radius: 16px;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--accent);
	}

	.summary {
		font-family: 'Inter', sans-serif;
		font-size: 15px;
		color: var(--text-muted);
		line-height: 1.7;
		margin: 24px 0 32px;
		max-width: 640px;
	}

	.cta-row {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 28px;
		background: var(--accent);
		color: var(--accent-on);
		border: none;
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 14px 22px;
		background: rgba(232, 220, 203, 0.05);
		color: var(--text);
		border: 1px solid rgba(232, 220, 203, 0.15);
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 14px 18px;
		background: rgba(232, 220, 203, 0.05);
		color: var(--text);
		border: 1px solid rgba(232, 220, 203, 0.15);
		border-radius: 8px;
		cursor: pointer;
	}

	/* Chapter section */
	.chapters-section {
		max-width: 1400px;
		margin: 0 auto;
		padding: 48px 32px 96px;
	}

	.chapters-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.chapters-title {
		font-family: 'Source Serif 4', serif;
		font-size: 32px;
		font-weight: 600;
		color: var(--text);
		margin: 0;
		letter-spacing: -0.015em;
	}

	.chapters-count {
		font-family: 'Inter', sans-serif;
		font-size: 16px;
		font-weight: 400;
		color: var(--text-faint);
		margin-left: 12px;
	}

	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: transparent;
		border: 1px solid rgba(160, 130, 100, 0.2);
		border-radius: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-soft);
		cursor: pointer;
	}

	.chapter-list {
		border: 1px solid var(--border-faint);
		border-radius: 10px;
		overflow: hidden;
	}
</style>
