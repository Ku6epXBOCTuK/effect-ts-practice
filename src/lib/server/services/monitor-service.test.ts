import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Layer, Option, Schema } from "effect";
import { Monitor } from "../../domain/monitor";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "../repositories/monitor-repository";
import {
	DuplicateMonitorError,
	MonitorNotFoundError,
} from "./monitor-service.errors.ts";
import { MonitorService, MonitorServiceLive } from "./monitor-service.ts";

const appLayer = MonitorServiceLive.pipe(
	Layer.provideMerge(InMemoryMonitorRepositoryLayer),
);

const makeMonitor = (id: string, displayName = "Effect", enabled = true) =>
	Schema.decodeUnknownSync(Monitor)({
		id,
		source: "npm_package",
		identifier: "effect",
		displayName,
		enabled,
		checkInterval: Duration.hours(6),
		releaseAgeWindow: Duration.days(3),
		includePrerelease: false,
		createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	});

it.effect("provides an empty monitor list", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const monitors = yield* service.list();

		expect(monitors).toHaveLength(0);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("reads monitors supplied by the in-memory repository", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		const service = yield* MonitorService;

		yield* repository.save(makeMonitor("seeded-monitor", "Seeded"));
		const stored = Option.getOrThrow(yield* service.get("seeded-monitor"));

		expect(stored.displayName).toBe("Seeded");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("delegates save and get to the repository", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const monitor = makeMonitor("monitor-1");

		yield* service.save(monitor);
		const stored = Option.getOrThrow(yield* service.get("monitor-1"));

		expect(stored.identifier).toBe("effect");
		expect(stored.displayName).toBe("Effect");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("creates a monitor only once", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const monitor = makeMonitor("new-monitor", "New monitor");

		const created = yield* service.create(monitor);
		const error = yield* Effect.flip(service.create(monitor));
		const monitors = yield* service.list();

		expect(created.id).toBe("new-monitor");
		expect(error).toBeInstanceOf(DuplicateMonitorError);
		expect(error._tag).toBe("DuplicateMonitorError");
		expect(error.id).toBe("new-monitor");
		expect(monitors).toHaveLength(1);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("updates an existing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const original = makeMonitor("update-monitor", "Before update");
		const updated = makeMonitor("update-monitor", "After update");

		yield* service.create(original);
		const result = yield* service.update(updated);
		const stored = Option.getOrThrow(yield* service.get("update-monitor"));

		expect(result).toEqual(updated);
		expect(stored.displayName).toBe("After update");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("fails when updating a missing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const error = yield* Effect.flip(
			service.update(makeMonitor("missing-monitor")),
		);

		expect(error).toBeInstanceOf(MonitorNotFoundError);
		expect(error._tag).toBe("MonitorNotFoundError");
		expect(error.id).toBe("missing-monitor");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("removes an existing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;

		yield* service.create(makeMonitor("remove-monitor"));
		yield* service.remove("remove-monitor");
		const result = yield* service.get("remove-monitor");

		expect(Option.isNone(result)).toBe(true);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("fails when removing a missing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const error = yield* Effect.flip(service.remove("missing-monitor"));

		expect(error).toBeInstanceOf(MonitorNotFoundError);
		expect(error._tag).toBe("MonitorNotFoundError");
		expect(error.id).toBe("missing-monitor");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("pauses an existing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;

		yield* service.create(makeMonitor("pause-monitor", "Pause", true));
		const paused = yield* service.pause("pause-monitor");
		const stored = Option.getOrThrow(yield* service.get("pause-monitor"));

		expect(paused.enabled).toBe(false);
		expect(stored.enabled).toBe(false);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("resumes a paused monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;

		yield* service.create(makeMonitor("resume-monitor", "Resume", false));
		const resumed = yield* service.resume("resume-monitor");
		const stored = Option.getOrThrow(yield* service.get("resume-monitor"));

		expect(resumed.enabled).toBe(true);
		expect(stored.enabled).toBe(true);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("fails when pausing a missing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const error = yield* Effect.flip(service.pause("missing-monitor"));

		expect(error).toBeInstanceOf(MonitorNotFoundError);
		expect(error._tag).toBe("MonitorNotFoundError");
		expect(error.id).toBe("missing-monitor");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("fails when resuming a missing monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const error = yield* Effect.flip(service.resume("missing-monitor"));

		expect(error).toBeInstanceOf(MonitorNotFoundError);
		expect(error._tag).toBe("MonitorNotFoundError");
		expect(error.id).toBe("missing-monitor");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("returns None when the service cannot find a monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const result = yield* service.get("missing");

		expect(Option.isNone(result)).toBe(true);
	}).pipe(Effect.provide(appLayer)),
);
