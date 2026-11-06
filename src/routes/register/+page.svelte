<script lang="ts">
	import { ENDPOINTS } from '$lib/api';
</script>

<svelte:head>
	<title>Create account · MangaBet</title>
</svelte:head>

<div class="page">
	<div class="card">
		<div class="header">
			<h1 class="title">Create account</h1>
			<p class="sub">MangaBet uses your mangabats account to save what you read.</p>
		</div>

		<a class="submit" href={ENDPOINTS.register()} target="_blank" rel="noopener noreferrer">
			Sign up on mangabats
		</a>

		<p class="alt">
			Already signed up? <a href="/login" class="alt-link">Connect your account</a>
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

	.submit {
		display: block;
		padding: 11px 16px;
		background: var(--accent);
		border-radius: 6px;
		color: #1a0f08;
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		text-decoration: none;
		transition: opacity 120ms;
	}

	.submit:hover {
		opacity: 0.92;
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
