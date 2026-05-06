<script lang="ts">
	let {
		label,
		value,
		options,
		onchange,
	}: { label: string; value: string; options: string[]; onchange: (v: string) => void } = $props();
</script>

<div class="group">
	<span class="label">{label}</span>
	<div class="pills">
		{#each options as opt}
			<button class="pill" class:active={value === opt} onclick={() => onchange(opt)}>
				{opt}
			</button>
		{/each}
	</div>
</div>

<style>
	.group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.pills {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.pill {
		padding: 6px 12px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 16px;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-soft);
		cursor: pointer;
		transition: all 120ms;
	}

	.pill:hover {
		border-color: rgba(201, 163, 122, 0.25);
		color: var(--text-muted);
	}

	.pill.active {
		background: rgba(201, 163, 122, 0.15);
		border-color: rgba(201, 163, 122, 0.4);
		color: var(--text);
	}
</style>
