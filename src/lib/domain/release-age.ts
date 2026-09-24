import { DateTime, Duration } from "effect";

export interface ReleaseGateInput {
	publishedAt: DateTime.Utc | undefined;
	now: DateTime.Utc;
	releaseAgeWindow: Duration.Duration;
}

export const RELEASE_GATE_STATUS = {
	COOLING_DOWN: "cooling_down",
	READY: "ready",
	DATE_UNKNOWN: "date_unknown",
} as const;
export type ReleaseGateStatus =
	(typeof RELEASE_GATE_STATUS)[keyof typeof RELEASE_GATE_STATUS];

export interface ReleaseGateResult {
	status: ReleaseGateStatus;
	eligibleAt: DateTime.Utc | undefined;
	remaining: Duration.Duration | undefined;
}

export function evaluateReleaseGate(
	input: ReleaseGateInput,
): ReleaseGateResult {
	if (input.publishedAt !== undefined) {
		const eligibleAt = input.publishedAt.pipe(
			DateTime.addDuration(input.releaseAgeWindow),
		);
		const remaining = DateTime.distance(input.now, eligibleAt);

		const isReleased = DateTime.isGreaterThanOrEqualTo(input.now, eligibleAt);

		if (isReleased) {
			return {
				status: RELEASE_GATE_STATUS.READY,
				eligibleAt,
				remaining: Duration.seconds(0),
			};
		}
		return {
			status: RELEASE_GATE_STATUS.COOLING_DOWN,
			eligibleAt,
			remaining,
		};
	}
	return {
		status: RELEASE_GATE_STATUS.DATE_UNKNOWN,
		eligibleAt: undefined,
		remaining: undefined,
	};
}
