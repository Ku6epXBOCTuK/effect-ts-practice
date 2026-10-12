<script lang="ts">
	import { m } from "$lib/paraglide/messages";
	import type { MonitorSummary } from "$lib/domain/monitor-summary";
	import MonitorListItem from "./MonitorListItem.svelte";

	interface CheckFormState {
		readonly code?: string;
		readonly id?: string;
	}

	let {
		monitors,
		form,
	}: {
		monitors: ReadonlyArray<MonitorSummary>;
		form?: CheckFormState | null;
	} = $props();
</script>

<section class="panel" aria-labelledby="watchlist-heading">
	<div class="section-heading section-heading-row">
		<div>
			<h2 id="watchlist-heading">{m.watchlist_title()}</h2>
			<p>{m.watchlist_description()}</p>
		</div>
		<span class="monitor-count">{monitors.length}</span>
	</div>

	{#if monitors.length === 0}
		<div class="empty-state">
			<h3>{m.empty_watchlist_title()}</h3>
			<p>{m.empty_watchlist_description()}</p>
		</div>
	{:else}
		<ul class="monitor-list">
			{#each monitors as monitor (monitor.id)}
				<MonitorListItem {monitor} {form} />
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel {
		padding: 1.5rem;
		border: 1px solid #d9e0e7;
		border-radius: 0.75rem;
		background: #ffffff;
		box-shadow: 0 0.5rem 1.5rem rgb(23 32 42 / 6%);
	}

	.section-heading {
		margin-bottom: 1.25rem;
	}

	.section-heading-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	h2,
	h3,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.35rem;
		font-size: 1.125rem;
		line-height: 1.3;
	}

	h3 {
		margin-bottom: 0.25rem;
		font-size: 1rem;
		line-height: 1.35;
	}

	.section-heading p,
	.empty-state p {
		margin-bottom: 0;
		color: #52606d;
		line-height: 1.6;
	}

	.monitor-count {
		min-width: 2rem;
		padding: 0.25rem 0.55rem;
		border-radius: 999px;
		background: #edf2ff;
		color: #245bc7;
		font-size: 0.8125rem;
		font-weight: 700;
		text-align: center;
	}

	.empty-state {
		padding: 2rem 1rem;
		border: 1px dashed #c7d0d9;
		border-radius: 0.5rem;
		background: #fafbfc;
		text-align: center;
	}

	.monitor-list {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
