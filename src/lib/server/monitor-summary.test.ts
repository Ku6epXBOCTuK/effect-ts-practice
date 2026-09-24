import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Layer, Schema } from "effect";
import { Monitor } from "../domain/monitor";
import { listMonitorSummaries } from "./monitor-summary.ts";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "./repositories/monitor-repository";
import { MonitorServiceLive } from "./services/monitor-service.ts";

const appLayer = MonitorServiceLive.pipe(
	Layer.provideMerge(InMemoryMonitorRepositoryLayer),
);

const makeMonitor = () =>
	Schema.decodeUnknownSync(Monitor)({
		id: "summary-monitor",
		source: "npm_package",
		identifier: "effect",
		displayName: "Effect",
		enabled: true,
		checkInterval: Duration.hours(6),
		releaseAgeWindow: Duration.days(3),
		includePrerelease: false,
		createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	});

it.effect("maps domain monitors to serializable summaries", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		yield* repository.save(makeMonitor());

		const summaries = yield* listMonitorSummaries;

		expect(summaries).toEqual([
			{
				id: "summary-monitor",
				source: "npm_package",
				identifier: "effect",
				displayName: "Effect",
				enabled: true,
			},
		]);
	}).pipe(Effect.provide(appLayer)),
);
