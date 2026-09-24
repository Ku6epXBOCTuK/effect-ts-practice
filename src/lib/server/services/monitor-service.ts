import { Monitor } from "$lib/domain/monitor";
import { Context, Effect, Layer, Option } from "effect";
import { MonitorRepository } from "../repositories/monitor-repository";
import {
	DuplicateMonitorError,
	MonitorNotFoundError,
} from "./monitor-service.errors";

type MonitorValue = typeof Monitor.Type;

export class MonitorService extends Context.Service<
	MonitorService,
	{
		readonly create: (
			monitor: MonitorValue,
		) => Effect.Effect<MonitorValue, DuplicateMonitorError>;
		readonly update: (
			monitor: MonitorValue,
		) => Effect.Effect<MonitorValue, MonitorNotFoundError>;
		readonly list: () => Effect.Effect<ReadonlyArray<MonitorValue>>;
		readonly get: (id: string) => Effect.Effect<Option.Option<MonitorValue>>;
		readonly save: (monitor: MonitorValue) => Effect.Effect<void>;
		readonly remove: (id: string) => Effect.Effect<void, MonitorNotFoundError>;
		readonly pause: (
			id: string,
		) => Effect.Effect<MonitorValue, MonitorNotFoundError>;
		readonly resume: (
			id: string,
		) => Effect.Effect<MonitorValue, MonitorNotFoundError>;
	}
>()("MonitorService") {}

export const MonitorServiceLive = Layer.effect(
	MonitorService,
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;

		const setEnabled = (id: string, enabled: boolean) =>
			Effect.gen(function* () {
				const existing = yield* repository.get(id);

				if (Option.isNone(existing)) {
					return yield* new MonitorNotFoundError({ id });
				}

				const updated = { ...existing.value, enabled };

				yield* repository.save(updated);
				return updated;
			});

		return {
			create: (monitor: MonitorValue) =>
				Effect.gen(function* () {
					const existing = yield* repository.get(monitor.id);

					if (Option.isSome(existing)) {
						return yield* new DuplicateMonitorError({ id: monitor.id });
					}
					yield* repository.save(monitor);

					return monitor;
				}),
			update: (monitor: MonitorValue) =>
				Effect.gen(function* () {
					const existing = yield* repository.get(monitor.id);

					if (Option.isNone(existing)) {
						return yield* new MonitorNotFoundError({ id: monitor.id });
					}
					yield* repository.save(monitor);

					return monitor;
				}),
			list: repository.list,
			get: repository.get,
			save: repository.save,
			remove: (id: string) =>
				Effect.gen(function* () {
					const existing = yield* repository.get(id);

					if (Option.isNone(existing)) {
						return yield* new MonitorNotFoundError({ id });
					}

					yield* repository.remove(id);
				}),
			pause: (id: string) => setEnabled(id, false),
			resume: (id: string) => setEnabled(id, true),
		};
	}),
);
