<script lang="ts">
	import { enhance } from '$app/forms';
	import { ENDPOINTS } from '$lib/api';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in · MangaBet</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="header">
			<h1 class="title">Sign in</h1>
			<p class="sub">Connect your mangabats account to MangaBet.</p>
		</div>

		{#if form?.error}
			<div class="error" role="alert">{form.error}</div>
		{/if}

		<ol class="steps">
			<li>
				<a class="alt-link" href={ENDPOINTS.login()} target="_blank" rel="noopener noreferrer"
					>Sign in on mangabats</a
				>
			</li>
			<li>Press F12, then open Application (Storage in Firefox), then Cookies.</li>
			<li>Copy the value of the cookie named <code>token</code>.</li>
		</ol>

		<form
			method="POST"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label class="field">
				<span class="label">Token</span>
				<input
					name="token"
					type="text"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					required
					class="input"
				/>
			</label>

			<p class="hint">This token opens your account. Paste it only here.</p>

			<button type="submit" class="submit" disabled={submitting}>
				{submitting ? 'Checking token…' : 'Sign in'}
			</button>
		</form>

		<p class="alt">
			Don't have an account? <a href="/register" class="alt-link">Register</a>
		</p>
	</div>
</div>

<style>
	.page {
		min-height: calc(100vh - 64px);
		display: grid;
		place-items: center;
		padding: 40px 16px;
		background: var(--ink-deep);
	}

	.card {
		width: 100%;
		max-width: 380px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 28px 28px 24px;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
	}

	.header {
		margin-bottom: 20px;
	}

	.title {
		font-family: 'Source Serif 4', serif;
		font-size: 26px;
		font-weight: 500;
		color: var(--text);
		margin: 0 0 6px;
		letter-spacing: -0.01em;
	}

	.sub {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-faint);
		margin: 0;
	}

	.error {
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: #e8a09b;
		background: rgba(180, 70, 60, 0.1);
		border: 1px solid rgba(180, 70, 60, 0.25);
		border-radius: 6px;
		padding: 10px 12px;
		margin-bottom: 16px;
	}

	.steps {
		margin: 0 0 18px;
		padding-left: 20px;
		list-style: decimal;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		line-height: 1.5;
		color: var(--text-soft);
	}

	.steps code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: var(--text);
	}

	.hint {
		margin: -8px 0 0;
		font-family: 'Inter', sans-serif;
		font-size: 12px;
		color: var(--text-faint);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		color: var(--text-faint);
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	.input {
		width: 100%;
		padding: 10px 12px;
		background: var(--surface-2, rgba(11, 9, 8, 0.5));
		border: 1px solid rgba(160, 130, 100, 0.2);
		border-radius: 6px;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		color: var(--text);
		outline: none;
		transition: border-color 120ms;
	}

	.input:focus {
		border-color: rgba(201, 163, 122, 0.5);
	}

	.submit {
		margin-top: 4px;
		padding: 11px 16px;
		background: var(--accent);
		border: none;
		border-radius: 6px;
		color: #1a0f08;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 120ms;
	}

	.submit:hover:not(:disabled) {
		opacity: 0.92;
	}

	.submit:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.alt {
		margin: 18px 0 0;
		font-family: 'Inter', sans-serif;
		font-size: 13px;
		color: var(--text-faint);
		text-align: center;
	}

	.alt-link {
		color: var(--accent);
		text-decoration: none;
		font-weight: 500;
	}

	.alt-link:hover {
		text-decoration: underline;
	}
</style>
