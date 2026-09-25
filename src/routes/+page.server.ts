import { createNpmMonitor } from "$lib/server/monitor-commands";
import { InvalidPackageNameError } from "$lib/server/monitor-commands.errors";
import { listMonitorSummaries } from "$lib/server/monitor-summary";
import { appRuntime } from "$lib/server/runtime";
import { DuplicateMonitorError } from "$lib/server/services/monitor-service.errors";
import { fail } from "@sveltejs/kit";
import { Effect, Schema } from "effect";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const monitors = await appRuntime.runPromise(listMonitorSummaries);

	return {
		monitors,
	};
};

const ERROR_CODE = {
	SUCCESS: "success",
	DUPLICATE_MONITOR: "duplicate_monitor",
	INVALID_PACKAGE_NAME: "invalid_package_name",
	INTERNAL_ERROR: "internal_error",
} as const;

const toCreateActionFailure = (
	error: Schema.SchemaError | DuplicateMonitorError | InvalidPackageNameError,
) => {
	if (error instanceof DuplicateMonitorError)
		return fail(409, {
			code: ERROR_CODE.DUPLICATE_MONITOR,
			id: error.id,
		});

	if (error instanceof InvalidPackageNameError)
		return fail(400, { code: ERROR_CODE.INVALID_PACKAGE_NAME });

	return fail(500, { code: ERROR_CODE.INTERNAL_ERROR });
};

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const packageName = data.get("packageName");
		return await appRuntime.runPromise(
			createNpmMonitor(packageName).pipe(
				Effect.match({
					onSuccess: () => ({
						success: true,
					}),
					onFailure: toCreateActionFailure,
				}),
			),
		);
	},
} satisfies Actions;
