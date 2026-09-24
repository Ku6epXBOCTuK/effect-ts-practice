import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Option, Schema } from "effect";
import { Monitor } from "../../domain/monitor";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "./monitor-repository.ts";

const makeMonitor = (id: string, displayName = "Effect") =>
	Schema.decodeUnknownSync(Monitor)({
		id,
		source: "npm_package",
		identifier: "effect",
		displayName,
		enabled: true,
		checkInterval: Duration.hours(6),
		releaseAgeWindow: Duration.days(3),
		includePrerelease: false,
		createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	});

it.effect("starts with an empty monitor list", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		const monitors = yield* repository.list();

		expect(monitors).toHaveLength(0);
	}).pipe(Effect.provide(InMemoryMonitorRepositoryLayer)),
);

it.effect("saves and retrieves a monitor", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		const monitor = makeMonitor("monitor-1");

		yield* repository.save(monitor);
		const stored = Option.getOrThrow(yield* repository.get("monitor-1"));

		expect(stored.identifier).toBe("effect");
		expect(stored.displayName).toBe("Effect");
	}).pipe(Effect.provide(InMemoryMonitorRepositoryLayer)),
);

it.effect("returns None for an unknown monitor", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		const result = yield* repository.get("missing");

		expect(Option.isNone(result)).toBe(true);
	}).pipe(Effect.provide(InMemoryMonitorRepositoryLayer)),
);

it.effect("updates an existing monitor without creating a duplicate", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;

		yield* repository.save(makeMonitor("monitor-1", "Before"));
		yield* repository.save(makeMonitor("monitor-1", "After"));
		const monitors = yield* repository.list();

		expect(monitors).toHaveLength(1);
		expect(monitors[0]?.displayName).toBe("After");
	}).pipe(Effect.provide(InMemoryMonitorRepositoryLayer)),
);
