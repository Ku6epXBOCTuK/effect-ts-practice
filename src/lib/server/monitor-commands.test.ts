import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Layer, Option } from "effect";
import { createNpmMonitor } from "./monitor-commands.ts";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "./repositories/monitor-repository";
import { MonitorServiceLive } from "./services/monitor-service.ts";

const appLayer = MonitorServiceLive.pipe(
	Layer.provideMerge(InMemoryMonitorRepositoryLayer),
);

it.effect("creates an npm monitor from a package name", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		const monitor = yield* createNpmMonitor("effect");
		const stored = yield* repository.get("npm:effect");

		expect(monitor).toMatchObject({
			id: "npm:effect",
			source: "npm_package",
			identifier: "effect",
			displayName: "effect",
			enabled: true,
			includePrerelease: false,
		});
		expect(monitor.checkInterval).toEqual(Duration.hours(6));
		expect(monitor.releaseAgeWindow).toEqual(Duration.days(3));
		expect(Option.isNone(monitor.lastCheckedAt)).toBe(true);
		expect(DateTime.isDateTime(monitor.createdAt)).toBe(true);
		expect(Option.getOrThrow(stored)).toEqual(monitor);
	}).pipe(Effect.provide(appLayer)),
);
