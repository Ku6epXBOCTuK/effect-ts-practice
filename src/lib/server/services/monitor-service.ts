import { Monitor } from "$lib/domain/monitor";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { MonitorRepository } from "../repositories/monitor-repository";

export class DuplicateMonitorError extends Schema.TaggedError<DuplicateMonitorError>()(
	"DuplicateMonitorError",
	{ id: Schema.String },
) {}

export class MonitorNotFoundError extends Schema.TaggedError<MonitorNotFoundError>()(
	"MonitorNotFoundError",
	{ id: Schema.String },
) {}

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
	}
>()("MonitorService") {}

export const MonitorServiceLive = Layer.effect(
	MonitorService,
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;

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
		};
	}),
);
