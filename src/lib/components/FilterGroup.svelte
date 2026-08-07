<script lang="ts">
	let {
		label,
		value,
		options,
		onchange,
	}: { label: string; value: string; options: string[]; onchange: (v: string) => void } = $props();
</script>

<div class="flex items-center gap-3 flex-wrap">
	<span class="font-mono text-[10px] text-fg-faint tracking-[0.14em] uppercase whitespace-nowrap">{label}</span>
	<div class="flex gap-1 flex-wrap">
		{#each options as opt}
			<button
				class="px-3 py-1.5 border rounded-full font-sans text-xs cursor-pointer transition-all duration-[120ms] {value === opt
					? 'bg-accent/15 border-accent/40 text-fg'
					: 'bg-transparent border-edge/15 text-fg-soft'}"
				onclick={() => onchange(opt)}
			>
				{opt}
			</button>
		{/each}
	</div>
</div>
