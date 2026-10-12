<script lang="ts">
	import { m } from "$lib/paraglide/messages";
	import MonitorForm from "$lib/components/monitor-form/MonitorForm.svelte";
	import MonitorList from "$lib/components/monitor-list/MonitorList.svelte";

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{m.app_name()}</title>
	<meta name="description" content={m.page_description()} />
</svelte:head>

<main class="page-shell">
	<header class="page-header">
		<p class="brand">{m.app_name()}</p>
		<h1>{m.watchlist_title()}</h1>
		<p class="page-description">{m.page_description()}</p>
	</header>

	<div class="content-stack">
		<MonitorForm {form} />
		<MonitorList monitors={data.monitors} {form} />
	</div>
</main>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		background: #f4f6f8;
		color: #17202a;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			sans-serif;
	}

	.page-shell {
		width: min(100% - 2rem, 72rem);
		margin: 0 auto;
		padding: 3rem 0 4rem;
	}

	.page-header {
		max-width: 44rem;
		margin-bottom: 2rem;
	}

	.brand {
		margin: 0 0 0.75rem;
		color: #52606d;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0 0 0.75rem;
		font-size: clamp(2rem, 5vw, 3.25rem);
		line-height: 1.05;
		letter-spacing: -0.035em;
	}

	.page-description {
		margin: 0;
		color: #52606d;
		line-height: 1.6;
	}

	.content-stack {
		display: grid;
		gap: 1rem;
	}

	@media (max-width: 38rem) {
		.page-shell {
			padding-top: 2rem;
		}
	}
</style>
