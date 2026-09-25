import { Schema } from "effect";

export const SOURCE_KIND = {
	NPM_PACKAGE: "npm_package",
	GITHUB_REPO: "github_repo",
} as const;

export const SourceKind = Schema.Literals(["npm_package", "github_repo"]);

export const Monitor = Schema.Struct({
	id: Schema.String,
	source: SourceKind,
	identifier: Schema.String,
	displayName: Schema.String,
	enabled: Schema.Boolean,
	checkInterval: Schema.Duration,
	releaseAgeWindow: Schema.Duration,
	includePrerelease: Schema.Boolean,
	createdAt: Schema.DateTimeUtc,
	lastCheckedAt: Schema.OptionFromOptional(Schema.DateTimeUtc),
});

export type MonitorValue = typeof Monitor.Type;
