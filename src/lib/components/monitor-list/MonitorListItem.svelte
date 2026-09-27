<script lang="ts">
	import { enhance } from "$app/forms";
	import { m } from "$lib/paraglide/messages";
	import type { MonitorSummary } from "$lib/domain/monitor-summary";

	let { monitor }: { monitor: MonitorSummary } = $props();
	let pending = $state(false);
</script>

<li class:paused={!monitor.enabled} class="monitor-item">
	<div class="monitor-details">
		<div class="monitor-title-row">
			<h3>{monitor.displayName}</h3>
			<span
				class:status-active={monitor.enabled}
				class:status-paused={!monitor.enabled}
				class="status"
			>
				{monitor.enabled ? m.status_active() : m.status_paused()}
			</span>
		</div>
		<p class="monitor-identifier">{monitor.identifier}</p>
	</div>
	<form
		class="check-form"
		method="POST"
		action="?/check"
		use:enhance={() => {
			pending = true;

			return async ({ update }) => {
				try {
					await update();
				} finally {
					pending = false;
				}
			};
		}}
	>
		<input type="hidden" name="id" value={monitor.id} />
		<button class="secondary-button" type="submit" disabled={pending}>
			{m.check_now()}
		</button>
	</form>
</li>

<style>
	.monitor-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e0e6eb;
		border-radius: 0.55rem;
		background: #ffffff;
	}

	.monitor-item.paused {
		background: #fafbfc;
	}

	.monitor-details {
		min-width: 0;
	}

	.check-form {
		margin: 0;
	}

	.monitor-title-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}

	.monitor-title-row h3 {
		margin: 0;
		overflow: hidden;
		font-size: 1rem;
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.monitor-identifier {
		margin: 0.35rem 0 0;
		overflow: hidden;
		color: #52606d;
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		flex: 0 0 auto;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.status-active {
		background: #e8f7ef;
		color: #176b3a;
	}

	.status-paused {
		background: #eef1f4;
		color: #52606d;
	}

	.secondary-button {
		flex: 0 0 auto;
		padding: 0.55rem 0.75rem;
		border: 1px solid #b9c4ce;
		border-radius: 0.45rem;
		background: #ffffff;
		color: #52606d;
		font: inherit;
		font-size: 0.875rem;
		cursor: not-allowed;
	}

	.secondary-button:focus-visible {
		outline: 3px solid rgb(47 111 237 / 35%);
		outline-offset: 2px;
	}

	.secondary-button:disabled {
		border-color: #d9e0e7;
		background: #eef1f4;
		color: #8a96a3;
	}

	@media (max-width: 38rem) {
		.monitor-item {
			align-items: stretch;
			flex-direction: column;
		}

		.secondary-button {
			width: 100%;
		}

		.monitor-title-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.4rem;
		}
	}
</style>
