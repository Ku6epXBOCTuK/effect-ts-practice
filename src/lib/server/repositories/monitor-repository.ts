import { type MonitorValue } from "$lib/domain/monitor";
import { Context, Effect, Layer, Option } from "effect";

export class MonitorRepository extends Context.Service<
	MonitorRepository,
	{
		readonly list: () => Effect.Effect<ReadonlyArray<MonitorValue>>;
		readonly get: (id: string) => Effect.Effect<Option.Option<MonitorValue>>;
		readonly save: (monitor: MonitorValue) => Effect.Effect<void>;
		readonly remove: (id: string) => Effect.Effect<void>;
	}
>()("MonitorRepository") {}

export const InMemoryMonitorRepositoryLayer = Layer.sync(
	MonitorRepository,
	() => {
		const store = new Map<string, MonitorValue>();

		return {
			list: () => Effect.succeed(Array.from(store.values())),
			get: (id: string) =>
				Effect.succeed(Option.fromUndefinedOr(store.get(id))),
			save: (monitor: MonitorValue) =>
				Effect.sync(() => {
					store.set(monitor.id, monitor);
				}),
			remove: (id: string) =>
				Effect.sync(() => {
					store.delete(id);
				}),
		};
	},
);
