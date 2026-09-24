import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Schema } from "effect";
import { Monitor } from "../domain/monitor";
import { makeAppRuntime } from "./runtime.ts";
import { MonitorService } from "./services/monitor-service.ts";

const makeMonitor = () =>
	Schema.decodeUnknownSync(Monitor)({
		id: "runtime-monitor",
		source: "npm_package",
		identifier: "effect",
		displayName: "Effect",
		enabled: true,
		checkInterval: Duration.hours(6),
		releaseAgeWindow: Duration.days(3),
		includePrerelease: false,
		createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	});

it("keeps repository state between runtime runs", async () => {
	const runtime = makeAppRuntime();

	try {
		await runtime.runPromise(
			Effect.gen(function* () {
				const service = yield* MonitorService;
				yield* service.create(makeMonitor());
			}),
		);

		const monitors = await runtime.runPromise(
			Effect.gen(function* () {
				const service = yield* MonitorService;
				return yield* service.list();
			}),
		);

		expect(monitors).toHaveLength(1);
		expect(monitors[0]?.displayName).toBe("Effect");
	} finally {
		await runtime.dispose();
	}
});
