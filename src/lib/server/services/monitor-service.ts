import { Monitor } from "$lib/domain/monitor";
import { Context, Effect, Layer, Option } from "effect";
import { MonitorRepository } from "../repositories/monitor-repository";

type MonitorValue = typeof Monitor.Type;

export class MonitorService extends Context.Service<
	MonitorService,
	{
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
			list: repository.list,
			get: repository.get,
			save: repository.save,
		};
	}),
);
