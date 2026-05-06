<script lang="ts">
	let {
		pageNum = 1,
		totalPages = 1,
		mangaTitle = '',
		chapter = 1,
		style = '',
	}: { pageNum?: number; totalPages?: number; mangaTitle?: string; chapter?: number; style?: string } =
		$props();

	let layout = $derived.by(() => {
		const seed = (pageNum * 7919 + chapter * 31) % 100;
		const layouts = ['panels-3', 'panels-2', 'splash', 'panels-4', 'splash', 'panels-3'];
		return layouts[seed % layouts.length];
	});

	let patternId = $derived(`stripe-${pageNum}-${chapter}`);
</script>

<div class="placeholder" {style}>
	<svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" class="art">
		<defs>
			<pattern
				id={patternId}
				x="0"
				y="0"
				width="6"
				height="6"
				patternUnits="userSpaceOnUse"
				patternTransform="rotate(45)"
			>
				<rect width="6" height="6" fill="#1a140f" />
				<line x1="0" y1="0" x2="0" y2="6" stroke="#231a13" stroke-width="3" />
			</pattern>
		</defs>
		<rect width="400" height="600" fill="url(#{patternId})" />

		{#if layout === 'splash'}
			<rect x="20" y="20" width="360" height="560" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<circle cx="200" cy="260" r="80" fill="none" stroke="#3a2a1f" stroke-width="1" opacity="0.5" />
			<line x1="60" y1="380" x2="340" y2="380" stroke="#3a2a1f" stroke-width="1" opacity="0.4" />
		{:else if layout === 'panels-3'}
			<rect x="20" y="20" width="360" height="200" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="20" y="230" width="170" height="170" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="200" y="230" width="180" height="170" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="20" y="410" width="360" height="170" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
		{:else if layout === 'panels-2'}
			<rect x="20" y="20" width="360" height="280" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="20" y="310" width="360" height="270" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
		{:else}
			<rect x="20" y="20" width="170" height="140" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="200" y="20" width="180" height="140" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="20" y="170" width="360" height="240" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="20" y="420" width="170" height="160" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
			<rect x="200" y="420" width="180" height="160" fill="none" stroke="#3a2a1f" stroke-width="1.5" />
		{/if}
	</svg>
	<div class="top-label">{mangaTitle} · Ch. {chapter}</div>
	<div class="center-label">[ page artwork ]</div>
	<div class="bottom-label">{pageNum} / {totalPages}</div>
</div>

<style>
	.placeholder {
		aspect-ratio: 2 / 3;
		background: #1a140f;
		border: 1px solid var(--border-faint);
		border-radius: 4px;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
	}

	.art {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}

	.top-label {
		position: absolute;
		top: 16px;
		left: 20px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-quiet);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}

	.center-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: #3a2a1f;
		letter-spacing: 0.2em;
		text-align: center;
	}

	.bottom-label {
		position: absolute;
		bottom: 16px;
		right: 20px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 11px;
		color: var(--text-faint);
		letter-spacing: 0.06em;
	}
</style>
