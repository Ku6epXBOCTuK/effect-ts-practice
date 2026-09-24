import { expect, it } from "@effect/vitest";
import {
	DateTime,
	Duration,
	Effect,
	Exit,
	Layer,
	Option,
	Schema,
} from "effect";
import { Monitor } from "../../domain/monitor";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "../repositories/monitor-repository";
import { MonitorService, MonitorServiceLive } from "./monitor-service.ts";

const appLayer = MonitorServiceLive.pipe(
	Layer.provideMerge(InMemoryMonitorRepositoryLayer),
);

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
		const duplicate = yield* Effect.exit(service.create(monitor));
		const monitors = yield* service.list();

		expect(created.id).toBe("new-monitor");
		expect(Exit.isFailure(duplicate)).toBe(true);
		expect(monitors).toHaveLength(1);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("returns None when the service cannot find a monitor", () =>
	Effect.gen(function* () {
		const service = yield* MonitorService;
		const result = yield* service.get("missing");

		expect(Option.isNone(result)).toBe(true);
	}).pipe(Effect.provide(appLayer)),
);
