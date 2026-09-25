import { Monitor, SOURCE_KIND } from "$lib/domain/monitor";
import { DateTime, Duration, Effect, Schema } from "effect";
import { MonitorService } from "./services/monitor-service";

// Defaults и createdAt должны жить в команде: source=npm_package, identifier=packageName,
// displayName=packageName, enabled=true, checkInterval=6h, releaseAgeWindow=72h, includePrerelease=false,
//  id=npm:${packageName}, lastCheckedAt=None, createdAt=DateTime.now.

export const createNpmMonitor = (packageName: unknown) =>
	Effect.gen(function* () {
		const name = yield* Schema.decodeUnknownEffect(Schema.NonEmptyString)(
			packageName,
		);

		const service = yield* MonitorService;
		const createdAt = yield* DateTime.now;

		const monitor = yield* Schema.decodeUnknownEffect(Monitor)({
			id: `npm:${name}`,
			source: SOURCE_KIND.NPM_PACKAGE,
			identifier: name,
			displayName: name,
			enabled: true,
			checkInterval: Duration.hours(6),
			releaseAgeWindow: Duration.hours(72),
			includePrerelease: false,
			createdAt,
		});

		return yield* service.create(monitor);
	});
