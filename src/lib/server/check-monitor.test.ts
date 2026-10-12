import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Layer, Option, Schema } from "effect";
import { Monitor } from "../domain/monitor.ts";
import { NpmMetadata } from "../domain/npm-metadata.ts";
import {
	NPM_REGISTRY_ERROR_CODES,
	NpmRegistryError,
} from "./adapters/npm-registry.errors.ts";
import { NpmRegistry } from "./adapters/npm-registry.ts";
import { checkMonitorNow } from "./check-monitor.ts";
import {
	InMemoryMonitorRepositoryLayer,
	MonitorRepository,
} from "./repositories/monitor-repository.ts";
import { MonitorNotFoundError } from "./services/monitor-service.errors.ts";
import { MonitorServiceLive } from "./services/monitor-service.ts";

const metadata = Schema.decodeUnknownSync(NpmMetadata)({
	name: "effect",
	distTags: { latest: "4.0.0" },
	versions: [{ version: "4.0.0" }],
	repositoryUrl: "https://github.com/Effect-TS/effect",
	npmUrl: "https://www.npmjs.com/package/effect",
});

let requestedPackageName: string | undefined;

const TestNpmRegistryLayer = Layer.succeed(NpmRegistry)({
	getPackageMetadata: (packageName) => {
		requestedPackageName = packageName;
		return Effect.succeed(metadata);
	},
});

const FailingNpmRegistryLayer = Layer.succeed(NpmRegistry)({
	getPackageMetadata: (packageName) =>
		Effect.fail(
			new NpmRegistryError({
				packageName,
				code: NPM_REGISTRY_ERROR_CODES.NOT_FOUND,
			}),
		),
});

const appLayer = Layer.mergeAll(
	MonitorServiceLive.pipe(Layer.provideMerge(InMemoryMonitorRepositoryLayer)),
	TestNpmRegistryLayer,
);

const failingAppLayer = Layer.mergeAll(
	MonitorServiceLive.pipe(Layer.provideMerge(InMemoryMonitorRepositoryLayer)),
	FailingNpmRegistryLayer,
);

const makeMonitor = (id: string) =>
	Schema.decodeUnknownSync(Monitor)({
		id,
		source: "npm_package",
		identifier: "effect",
		displayName: "Effect",
		enabled: true,
		checkInterval: Duration.hours(6),
		releaseAgeWindow: Duration.days(3),
		includePrerelease: false,
		createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	});

it.effect("checks an existing monitor and stores the check time", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		requestedPackageName = undefined;
		yield* repository.save(makeMonitor("check-monitor"));

		const monitor = yield* checkMonitorNow("check-monitor");

		expect(requestedPackageName).toBe("effect");
		expect(Option.isSome(monitor.lastCheckedAt)).toBe(true);
	}).pipe(Effect.provide(appLayer)),
);

it.effect("stores the latest release after a successful check", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		requestedPackageName = undefined;
		yield* repository.save(makeMonitor("check-monitor"));

		const monitor = yield* checkMonitorNow("check-monitor");

		const stored = yield* repository.get("check-monitor");
		const saved = Option.getOrThrow(stored);
		const release = Option.getOrUndefined(saved.lastRelease);

		expect(release?.version).toBe("4.0.0");
		expect(monitor.lastCheckedAt).toBeDefined();
	}).pipe(Effect.provide(appLayer)),
);

it.effect("does not call the registry for a missing monitor", () =>
	Effect.gen(function* () {
		requestedPackageName = undefined;
		const error = yield* Effect.flip(checkMonitorNow("missing-monitor"));

		expect(error).toBeInstanceOf(MonitorNotFoundError);
		expect(requestedPackageName).toBeUndefined();
	}).pipe(Effect.provide(appLayer)),
);

it.effect("preserves registry errors when a check fails", () =>
	Effect.gen(function* () {
		const repository = yield* MonitorRepository;
		yield* repository.save(makeMonitor("check-monitor"));

		const error = yield* Effect.flip(checkMonitorNow("check-monitor"));

		expect(error).toBeInstanceOf(NpmRegistryError);
		if (error instanceof NpmRegistryError) {
			expect(error.code).toBe(NPM_REGISTRY_ERROR_CODES.NOT_FOUND);
		}
	}).pipe(Effect.provide(failingAppLayer)),
);
