import { type MonitorValue } from "$lib/domain/monitor";
import type { MonitorSummary } from "$lib/domain/monitor-summary";
import { Effect } from "effect";
import { MonitorService } from "./services/monitor-service";

export type { MonitorSummary } from "$lib/domain/monitor-summary";

const toMonitorSummary = (monitor: MonitorValue): MonitorSummary => ({
	id: monitor.id,
	source: monitor.source,
	identifier: monitor.identifier,
	displayName: monitor.displayName,
	enabled: monitor.enabled,
});

export const listMonitorSummaries = Effect.gen(function* () {
	const service = yield* Effect.service(MonitorService);
	const monitors = yield* service.list();

	return monitors.map((monitor: MonitorValue) => toMonitorSummary(monitor));
});
