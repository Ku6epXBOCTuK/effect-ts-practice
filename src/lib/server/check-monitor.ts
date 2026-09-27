import type { MonitorValue } from "$lib/domain/monitor";
import { DateTime, Effect, Option } from "effect";
import { NpmRegistry } from "./adapters/npm-registry";
import type { NpmRegistryError } from "./adapters/npm-registry.errors";
import { MonitorService } from "./services/monitor-service";
import { MonitorNotFoundError } from "./services/monitor-service.errors";

export const checkMonitorNow = (
	id: string,
): Effect.Effect<
	MonitorValue,
	MonitorNotFoundError | NpmRegistryError,
	MonitorService | NpmRegistry
> =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const registry = yield* NpmRegistry;

		const result = yield* service.get(id);

		if (Option.isNone(result)) {
			return yield* Effect.fail(new MonitorNotFoundError({ id }));
		}

		const monitor = result.value;

		yield* registry.getPackageMetadata(monitor.identifier);

		const now = yield* DateTime.now;
		const updated: MonitorValue = {
			...monitor,
			lastCheckedAt: Option.some(now),
		};

		yield* service.save(updated);

		return updated;
	});
