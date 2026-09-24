import { expect, it } from "@effect/vitest";
import { DateTime, Duration, Option, Schema } from "effect";
import { Monitor, SourceKind } from "./monitor.ts";

const baseInput = {
	id: "monitor-1",
	source: "npm_package",
	identifier: "effect",
	displayName: "Effect",
	enabled: true,
	checkInterval: Duration.hours(6),
	releaseAgeWindow: Duration.days(3),
	includePrerelease: false,
	createdAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
};

it("decodes a valid npm monitor", () => {
	const monitor = Schema.decodeUnknownSync(Monitor)(baseInput);

	expect(monitor.source).toBe("npm_package");
	expect(monitor.identifier).toBe("effect");
	expect(monitor.checkInterval).toEqual(Duration.hours(6));
	expect(monitor.releaseAgeWindow).toEqual(Duration.days(3));
});

it("supports both supported source kinds", () => {
	expect(Schema.decodeUnknownSync(SourceKind)("npm_package")).toBe(
		"npm_package",
	);
	expect(Schema.decodeUnknownSync(SourceKind)("github_repo")).toBe(
		"github_repo",
	);
});

it("allows an omitted lastCheckedAt", () => {
	const monitor = Schema.decodeUnknownSync(Monitor)(baseInput);

	expect(Option.isNone(monitor.lastCheckedAt)).toBe(true);
});

it("preserves lastCheckedAt when it is provided", () => {
	const lastCheckedAt = DateTime.makeUnsafe("2026-09-24T12:00:00Z");
	const monitor = Schema.decodeUnknownSync(Monitor)({
		...baseInput,
		lastCheckedAt,
	});

	expect(Option.getOrUndefined(monitor.lastCheckedAt)?.epochMilliseconds).toBe(
		lastCheckedAt.epochMilliseconds,
	);
});

it("rejects an unsupported source kind", () => {
	expect(() =>
		Schema.decodeUnknownSync(Monitor)({
			...baseInput,
			source: "unknown_source",
		}),
	).toThrow();
});

it("rejects a monitor without an identifier", () => {
	const inputWithoutIdentifier = Object.fromEntries(
		Object.entries(baseInput).filter(([key]) => key !== "identifier"),
	);

	expect(() =>
		Schema.decodeUnknownSync(Monitor)(inputWithoutIdentifier),
	).toThrow();
});
