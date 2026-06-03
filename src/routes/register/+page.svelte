<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let refreshing = $state(false);

	async function refreshCaptcha() {
		refreshing = true;
		try {
			await fetch('/api/captcha');
			await invalidateAll();
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head>
	<title>Create account · MangaBet</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="header">
			<h1 class="title">Create account</h1>
			<p class="sub">Join MangaBet to track and save what you read.</p>
		</div>

		{#if form?.error}
			<div class="error" role="alert">{form.error}</div>
		{/if}

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
				<span class="label">Username</span>
				<input
					name="username"
					type="text"
					autocomplete="username"
					value={form?.username ?? ''}
					required
					class="input"
				/>
			</label>

			<label class="field">
				<span class="label">Display name</span>
				<input
					name="displayname"
					type="text"
					autocomplete="nickname"
					value={form?.displayname ?? ''}
					required
					class="input"
				/>
			</label>

			<label class="field">
				<span class="label">Email</span>
				<input
					name="email"
					type="email"
					autocomplete="email"
					value={form?.email ?? ''}
					required
					class="input"
				/>
			</label>

			<label class="field">
				<span class="label">Password</span>
				<input
					name="password"
					type="password"
					autocomplete="new-password"
					required
					class="input"
				/>
			</label>

			<label class="field">
				<span class="label">Confirm password</span>
				<input
					name="confirmPassword"
					type="password"
					autocomplete="new-password"
					required
					class="input"
				/>
			</label>

			<div class="field">
				<span class="label">Captcha</span>
				<div class="captcha-row">
					<div class="captcha-img-wrap">
						<img src={data.captchaImage} alt="Captcha" class="captcha-img" />
					</div>
					<button
						type="button"
						class="refresh-btn"
						onclick={refreshCaptcha}
						disabled={refreshing}
						aria-label="Refresh captcha"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
							<path d="M3 3v5h5" />
						</svg>
					</button>
				</div>
				<input
					name="captcha"
					type="text"
					inputmode="numeric"
					autocomplete="off"
					placeholder="Enter the digits above"
					required
					maxlength="6"
					class="input"
				/>
			</div>

			<button type="submit" class="submit" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'}
			</button>
		</form>

		<p class="alt">
			Already have an account? <a href="/login" class="alt-link">Sign in</a>
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
		max-width: 420px;
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

	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
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

	.captcha-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.captcha-img-wrap {
		background: #fff;
		border-radius: 4px;
		padding: 2px;
		display: grid;
		place-items: center;
	}

	.captcha-img {
		display: block;
		width: 100px;
		height: 45px;
		border-radius: 2px;
	}

	.refresh-btn {
		background: rgba(232, 220, 203, 0.05);
		border: 1px solid rgba(232, 220, 203, 0.12);
		border-radius: 6px;
		color: var(--text-soft);
		width: 36px;
		height: 36px;
		display: grid;
		place-items: center;
		cursor: pointer;
		transition: all 120ms;
	}

	.refresh-btn:hover:not(:disabled) {
		color: var(--text);
		background: rgba(201, 163, 122, 0.1);
	}

	.refresh-btn:disabled {
		opacity: 0.4;
		cursor: wait;
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
