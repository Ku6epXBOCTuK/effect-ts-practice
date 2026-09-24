import { listMonitorSummaries } from "$lib/server/monitor-summary";
import { appRuntime } from "$lib/server/runtime";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const monitors = await appRuntime.runPromise(listMonitorSummaries);

	return {
		monitors,
	};
};
