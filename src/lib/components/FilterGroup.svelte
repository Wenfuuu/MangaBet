<script lang="ts">
	let {
		label,
		value,
		options,
		onchange,
	}: { label: string; value: string; options: string[]; onchange: (v: string) => void } = $props();
</script>

<div class="flex items-center gap-3 flex-wrap">
	<span class="font-mono text-[10px] text-[var(--text-faint)] tracking-[0.14em] uppercase whitespace-nowrap">{label}</span>
	<div class="flex gap-1 flex-wrap">
		{#each options as opt}
			<button
				class="px-3 py-1.5 border rounded-full font-sans text-xs cursor-pointer transition-all duration-[120ms] {value === opt
					? 'bg-[rgba(201,163,122,0.15)] border-[rgba(201,163,122,0.4)] text-[var(--text)]'
					: 'bg-transparent border-[var(--border)] text-[var(--text-soft)]'}"
				onclick={() => onchange(opt)}
			>
				{opt}
			</button>
		{/each}
	</div>
</div>
