import { DateTime, Duration } from "effect";
import { describe, expect, it } from "@effect/vitest";
import { evaluateReleaseGate, type ReleaseGateInput } from "./release-age";

const instant = (value: string): DateTime.Utc => DateTime.makeUnsafe(value);

const makeInput = (
	publishedAt: DateTime.Utc | undefined,
	now: DateTime.Utc,
	releaseAgeWindow: Duration.Duration,
): ReleaseGateInput => ({
	publishedAt,
	now,
	releaseAgeWindow,
});

const assertInstant = (
	actual: DateTime.Utc | undefined,
	expected: DateTime.Utc,
): void => {
	expect(actual).toBeDefined();
	if (actual !== undefined) {
		expect(actual.epochMilliseconds).toBe(expected.epochMilliseconds);
	}
};

const assertDuration = (
	actual: Duration.Duration | undefined,
	expectedMilliseconds: number,
): void => {
	expect(actual).toBeDefined();
	if (actual !== undefined) {
		expect(Duration.toMillis(actual)).toBe(expectedMilliseconds);
	}
};

describe("Release Gate", () => {
	it("marks a release as cooling_down before eligibleAt", () => {
		const publishedAt = instant("2026-09-24T10:00:00Z");
		const now = instant("2026-09-27T09:00:00Z");

		const result = evaluateReleaseGate(
			makeInput(publishedAt, now, Duration.days(3)),
		);

		expect(result.status).toBe("cooling_down");
		assertInstant(result.eligibleAt, instant("2026-09-27T10:00:00Z"));
		assertDuration(result.remaining, 60 * 60 * 1000);
	});

	it("marks a release as ready at the exact eligibleAt boundary", () => {
		const publishedAt = instant("2026-09-24T10:00:00Z");
		const now = instant("2026-09-27T10:00:00Z");

		const result = evaluateReleaseGate(
			makeInput(publishedAt, now, Duration.days(3)),
		);

		expect(result.status).toBe("ready");
		assertInstant(result.eligibleAt, instant("2026-09-27T10:00:00Z"));
		assertDuration(result.remaining, 0);
	});

	it("keeps a release ready after the cooldown window", () => {
		const publishedAt = instant("2026-09-24T10:00:00Z");
		const now = instant("2026-09-28T10:00:00Z");

		const result = evaluateReleaseGate(
			makeInput(publishedAt, now, Duration.days(3)),
		);

		expect(result.status).toBe("ready");
		assertInstant(result.eligibleAt, instant("2026-09-27T10:00:00Z"));
		assertDuration(result.remaining, 0);
	});

	it("supports a custom release age window", () => {
		const publishedAt = instant("2026-09-24T10:00:00Z");
		const now = instant("2026-09-26T09:00:00Z");

		const result = evaluateReleaseGate(
			makeInput(publishedAt, now, Duration.hours(48)),
		);

		expect(result.status).toBe("cooling_down");
		assertInstant(result.eligibleAt, instant("2026-09-26T10:00:00Z"));
		assertDuration(result.remaining, 60 * 60 * 1000);
	});

	it("returns date_unknown when publishedAt is missing", () => {
		const result = evaluateReleaseGate(
			makeInput(undefined, instant("2026-09-28T10:00:00Z"), Duration.days(3)),
		);

		expect(result.status).toBe("date_unknown");
		expect(result.eligibleAt).toBeUndefined();
		expect(result.remaining).toBeUndefined();
	});
});
