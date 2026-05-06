<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { fmtDate } from '$lib/data';

	let { ch, isLast = false, onclick }: { ch: Chapter; isLast?: boolean; onclick: () => void } =
		$props();
</script>

<button class="row" class:last={isLast} {onclick}>
	<div class="num">#{ch.number.toString().padStart(3, '0')}</div>
	<div class="info">
		<div class="title">{ch.title}</div>
		<div class="meta">
			<span>{ch.pages} pages</span>
			<span class="dot"></span>
			<span>{fmtDate(ch.date)}</span>
			{#if ch.isNew}
				<span class="new-badge">NEW</span>
			{/if}
		</div>
	</div>
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="var(--text-quiet)"
		stroke-width="2"
	>
		<polyline points="9 18 15 12 9 6" />
	</svg>
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 16px 20px;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(160, 130, 100, 0.08);
		cursor: pointer;
		text-align: left;
		transition: background 150ms;
		width: 100%;
	}

	.row.last {
		border-bottom: none;
	}

	.row:hover {
		background: rgba(201, 163, 122, 0.06);
	}

	.num {
		width: 48px;
		flex-shrink: 0;
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 500;
		color: var(--accent);
	}

	.info {
		flex: 1;
		min-width: 0;
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 16px;
		font-weight: 500;
		color: var(--text);
		line-height: 1.3;
	}

	.meta {
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
		margin-top: 4px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dot {
		width: 2px;
		height: 2px;
		border-radius: 50%;
		background: var(--text-quiet);
		flex-shrink: 0;
	}

	.new-badge {
		padding: 2px 6px;
		background: rgba(201, 163, 122, 0.18);
		border-radius: 3px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--accent);
		letter-spacing: 0.06em;
	}
</style>
