<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { getToasts, dismissToast } from '$lib/stores/toast.svelte';

	let toasts = $derived(getToasts());
</script>

<div class="stack">
	{#each toasts as toast (toast.id)}
		<div
			class="toast"
			role="status"
			transition:fly={{ y: 20, duration: 220 }}
			animate:flip={{ duration: 180 }}
		>
			<span class="msg">{toast.message}</span>
			{#if toast.action}
				{@const action = toast.action}
				<button
					type="button"
					class="cta"
					onclick={() => {
						dismissToast(toast.id);
						action.onClick();
					}}
				>{action.label}</button>
			{/if}
			<button type="button" class="close" onclick={() => dismissToast(toast.id)} aria-label="Dismiss">
				<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
					<path d="M18 6 6 18M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	.stack {
		position: fixed;
		bottom: 18px;
		right: 18px;
		z-index: 60;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
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
		pointer-events: auto;
	}

	.msg {
		font-size: 12.5px;
		color: var(--text-soft, #d9c9b4);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.cta {
		background: transparent;
		border: none;
		padding: 4px 8px;
		font: inherit;
		font-size: 12.5px;
		font-weight: 600;
		color: var(--accent, #c9a37a);
		cursor: pointer;
		border-radius: 6px;
		transition: background 120ms;
	}

	.cta:hover {
		background: rgba(201, 163, 122, 0.12);
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
		.stack {
			bottom: 12px;
			left: 12px;
			right: 12px;
			align-items: center;
		}

		.toast {
			width: max-content;
			max-width: calc(100vw - 24px);
		}

		.msg {
			white-space: normal;
			font-size: 12px;
		}
	}
</style>
