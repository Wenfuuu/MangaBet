<script lang="ts">
	import type { Chapter } from '$lib/types';

	let {
		mangaSlug,
		mangaId,
		nextChapter,
	}: {
		mangaSlug: string;
		mangaId: string;
		nextChapter?: Chapter;
	} = $props();
</script>

<div class="px-6 py-8 mt-3 bg-surface border border-edge/12 rounded-[10px] text-center">
	<div class="font-mono text-[11px] text-fg-faint tracking-[0.18em] uppercase mb-2">End of chapter</div>
	<h3 class="font-serif text-2xl font-medium text-fg m-0 mb-5">Take a breath.</h3>
	<div class="flex gap-3 justify-center flex-wrap">
		{#if nextChapter}
			<a
				class="px-5 py-3 bg-accent text-accent-on rounded-md font-sans text-[13px] font-semibold"
				href="/manga/{mangaSlug}/{mangaId}/chapter/{nextChapter.slug}"
			>
				Next chapter →
			</a>
		{/if}
		<a
			class="px-5 py-3 bg-fg/8 text-fg border border-fg/15 rounded-md font-sans text-[13px] font-medium"
			href="/manga/{mangaSlug}/{mangaId}"
		>
			Back to chapters
		</a>
	</div>
</div>
