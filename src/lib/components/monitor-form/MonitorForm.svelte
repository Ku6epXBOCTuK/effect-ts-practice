<script lang="ts">
	import { enhance } from "$app/forms";
	import { m } from "$lib/paraglide/messages";

	interface FormState {
		readonly code?: string;
		readonly success?: boolean;
	}

	interface Props {
		readonly form?: FormState | null;
	}

	let { form }: Props = $props();

	let pending: boolean = $state(false);
</script>

<section class="panel" aria-labelledby="add-monitor-heading">
	<div class="section-heading">
		<h2 id="add-monitor-heading">{m.add_monitor()}</h2>
		<p>{m.add_monitor_description()}</p>
	</div>

	<form
		class="add-form"
		method="POST"
		action="?/create"
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
		<label for="package-name">{m.package_name()}</label>
		<div class="form-row">
			<input
				id="package-name"
				name="packageName"
				type="text"
				autocomplete="off"
				placeholder={m.package_name_placeholder()}
				required
			/>
			<button type="submit" disabled={pending}>{m.add()}</button>
		</div>
	</form>

	{#if form?.code === "invalid_package_name"}
		<p class="feedback feedback-error" role="alert">
			{m.error_invalid_package_name()}
		</p>
	{:else if form?.code === "duplicate_monitor"}
		<p class="feedback feedback-error" role="alert">
			{m.error_duplicate_monitor()}
		</p>
	{:else if form?.code === "internal_error"}
		<p class="feedback feedback-error" role="alert">
			{m.error_internal()}
		</p>
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

	h2,
	p {
		margin-top: 0;
	}

	h2 {
		margin-bottom: 0.35rem;
		font-size: 1.125rem;
		line-height: 1.3;
	}

	.section-heading p {
		margin-bottom: 0;
		color: #52606d;
		line-height: 1.6;
	}

	.add-form {
		display: grid;
		gap: 0.5rem;
	}

	.add-form label {
		font-size: 0.875rem;
		font-weight: 650;
	}

	.form-row {
		display: flex;
		gap: 0.75rem;
	}

	.form-row input {
		min-width: 0;
		flex: 1;
		padding: 0.7rem 0.8rem;
		border: 1px solid #aeb8c2;
		border-radius: 0.45rem;
		background: #ffffff;
		color: #17202a;
		font: inherit;
	}

	.form-row input::placeholder {
		color: #7b8794;
	}

	.form-row input:focus-visible,
	button:focus-visible {
		outline: 3px solid rgb(47 111 237 / 35%);
		outline-offset: 2px;
	}

	.form-row button {
		padding: 0.7rem 1rem;
		border: 1px solid #2f6fed;
		border-radius: 0.45rem;
		background: #2f6fed;
		color: #ffffff;
		font: inherit;
		font-weight: 650;
		cursor: pointer;
	}

	.form-row button:hover {
		background: #245bc7;
	}

	.feedback {
		margin: 1rem 0 0;
		padding: 0.75rem 0.85rem;
		border-radius: 0.4rem;
		line-height: 1.5;
	}

	.feedback-error {
		background: #fff0f0;
		color: #9b1c1c;
	}

	@media (max-width: 38rem) {
		.form-row {
			align-items: stretch;
			flex-direction: column;
		}

		.form-row button {
			width: 100%;
		}
	}
</style>
