import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Schema } from "effect";
import { Monitor } from "$lib/domain/monitor";
import { appRuntime } from "$lib/server/runtime";
import { MonitorService } from "$lib/server/services/monitor-service";
import { load } from "./+page.server";

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

it("loads monitor summaries through the shared app runtime", async () => {
	const id = `page-load-${Date.now()}`;

	await appRuntime.runPromise(
		Effect.gen(function* () {
			const service = yield* MonitorService;
			yield* service.create(makeMonitor(id));
		}),
	);

	const result = await load({} as Parameters<typeof load>[0]);

	expect(result).toEqual({
		monitors: [
			{
				id,
				source: "npm_package",
				identifier: "effect",
				displayName: "Effect",
				enabled: true,
			},
		],
	});
});
