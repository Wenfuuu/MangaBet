<script lang="ts">
	let {
		pageNumber,
		status,
		attempt = 0,
		maxAttempts = 0,
		variant = 'long',
		onretry,
	}: {
		pageNumber: number;
		status: 'retrying' | 'failed';
		attempt?: number;
		maxAttempts?: number;
		/** `long` sizes itself in the vertical strip; `fill` fills a fixed-size slot. */
		variant?: 'long' | 'fill';
		onretry: () => void;
	} = $props();
</script>

<div class="fallback" class:long={variant === 'long'} class:fill={variant === 'fill'}>
	<span class="page-label">Page {pageNumber}</span>

	{#if status === 'retrying'}
		<div class="spinner" aria-hidden="true"></div>
		<p class="msg">Retrying…</p>
		{#if maxAttempts > 0}
			<span class="attempt">attempt {attempt} of {maxAttempts}</span>
		{/if}
	{:else}
		<svg
			class="icon"
			width="26"
			height="26"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<path d="m21 15-5-5L5 21" />
		</svg>
		<p class="msg">This page didn't load.</p>
		<button class="retry-btn" onclick={onretry}>
			<svg
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M21 12a9 9 0 1 1-2.64-6.36" />
				<polyline points="21 3 21 9 15 9" />
			</svg>
			Retry
		</button>
	{/if}
</div>

<style>
	.fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background: rgba(232, 220, 203, 0.03);
		border: 1px dashed rgba(160, 130, 100, 0.22);
		border-radius: 8px;
		color: var(--text-faint);
		text-align: center;
		padding: 24px 16px;
		user-select: none;
	}

	.fallback.long {
		width: 100%;
		aspect-ratio: 2 / 3;
	}

	.fallback.fill {
		width: 100%;
		height: 100%;
	}

	.page-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-quiet);
	}

	.icon {
		color: rgba(160, 130, 100, 0.45);
	}

	.msg {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-soft);
		margin: 0;
	}

	.attempt {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-quiet);
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		margin-top: 2px;
		padding: 8px 16px;
		background: rgba(201, 163, 122, 0.12);
		border: 1px solid rgba(201, 163, 122, 0.32);
		border-radius: 6px;
		color: var(--text);
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 120ms;
	}

	.retry-btn:hover {
		background: rgba(201, 163, 122, 0.2);
		border-color: rgba(201, 163, 122, 0.5);
	}

	.spinner {
		width: 22px;
		height: 22px;
		border: 2px solid rgba(160, 130, 100, 0.2);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 720ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 2.4s;
		}
	}
</style>
