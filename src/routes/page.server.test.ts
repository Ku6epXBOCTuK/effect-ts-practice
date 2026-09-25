import { isActionFailure } from "@sveltejs/kit";
import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Effect, Schema } from "effect";
import { Monitor } from "$lib/domain/monitor";
import { appRuntime } from "$lib/server/runtime";
import { MonitorService } from "$lib/server/services/monitor-service";
import { actions, load } from "./+page.server";

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

const makeCreateEvent = (packageName: string) => {
	const formData = new FormData();
	formData.set("packageName", packageName);

	return {
		request: new Request("http://localhost/?/create", {
			method: "POST",
			body: formData,
		}),
	} as Parameters<NonNullable<typeof actions>["create"]>[0];
};

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

it("creates an npm monitor through the form action", async () => {
	const packageName = `form-package-${Date.now()}`;
	const event = makeCreateEvent(packageName);

	const result = await actions.create(event);
	const page = await load({} as Parameters<typeof load>[0]);

	expect(result).toMatchObject({ success: true });
	expect(page).toMatchObject({
		monitors: expect.arrayContaining([
			expect.objectContaining({
				identifier: packageName,
				source: "npm_package",
			}),
		]),
	});
});

it("returns a validation failure for an empty package name", async () => {
	const result = await actions.create(makeCreateEvent(""));

	expect(isActionFailure(result)).toBe(true);
	if (isActionFailure(result)) {
		expect(result.status).toBe(400);
		expect(result.data).toEqual({ code: "invalid_package_name" });
	}
});

it("returns a conflict for a duplicate package monitor", async () => {
	const packageName = `duplicate-package-${Date.now()}`;
	const first = await actions.create(makeCreateEvent(packageName));
	const result = await actions.create(makeCreateEvent(packageName));

	expect(first).toMatchObject({ success: true });
	expect(isActionFailure(result)).toBe(true);
	if (isActionFailure(result)) {
		expect(result.status).toBe(409);
		expect(result.data).toEqual({
			code: "duplicate_monitor",
			id: `npm:${packageName}`,
		});
	}
});
