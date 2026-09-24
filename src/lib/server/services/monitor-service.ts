import { Monitor } from "$lib/domain/monitor";
import { Context, Effect, Layer, Option, Schema } from "effect";
import { MonitorRepository } from "../repositories/monitor-repository";

export class DuplicateMonitorError extends Schema.TaggedError<DuplicateMonitorError>()(
	"DuplicateMonitorError",
	{ id: Schema.String },
) {}

type MonitorValue = typeof Monitor.Type;

export class MonitorService extends Context.Service<
	MonitorService,
	{
		readonly create: (
			monitor: MonitorValue,
		) => Effect.Effect<MonitorValue, DuplicateMonitorError>;
		readonly list: () => Effect.Effect<ReadonlyArray<MonitorValue>>;
		readonly get: (id: string) => Effect.Effect<Option.Option<MonitorValue>>;
		readonly save: (monitor: MonitorValue) => Effect.Effect<void>;
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
			list: repository.list,
			get: repository.get,
			save: repository.save,
		};
	}),
);
