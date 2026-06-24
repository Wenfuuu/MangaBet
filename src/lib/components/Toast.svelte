<script lang="ts">
	import { fly } from 'svelte/transition';
	import { getToast, dismissToast } from '$lib/stores/toast.svelte';

	let toast = $derived(getToast());
</script>

{#if toast}
	<div class="toast" role="status" transition:fly={{ y: 20, duration: 220 }}>
		<span class="msg">{toast.message}</span>
		<button type="button" class="close" onclick={dismissToast} aria-label="Dismiss">
			<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
				<path d="M18 6 6 18M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		bottom: 18px;
		right: 18px;
		z-index: 60;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px 8px 14px;
		background: rgba(20, 16, 13, 0.92);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(160, 130, 100, 0.22);
		border-radius: 999px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
		font-family: 'Inter', sans-serif;
		max-width: calc(100vw - 36px);
	}

	.msg {
		font-size: 12.5px;
		color: var(--text-soft, #d9c9b4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.close {
		background: transparent;
		border: none;
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
		color: var(--text-faint, #8a7866);
		cursor: pointer;
		border-radius: 50%;
		transition: color 120ms, background 120ms;
	}

	.close:hover {
		color: var(--text, #e8dccb);
		background: rgba(232, 220, 203, 0.08);
	}

	@media (max-width: 480px) {
		.toast {
			bottom: 12px;
			right: 12px;
			left: 12px;
			max-width: none;
		}

		.msg {
			flex: 1;
			white-space: normal;
			font-size: 12px;
		}
	}
</style>
