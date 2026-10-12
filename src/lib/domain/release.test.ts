import { expect, it } from "@effect/vitest";
import { DateTime, Option, Schema } from "effect";
import type { NpmMetadataValue } from "./npm-metadata.ts";
import { NpmMetadata } from "./npm-metadata.ts";
import { Release, toRelease } from "./release.ts";

const baseRelease = {
	version: "4.0.0",
	publishedAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
	url: "https://www.npmjs.com/package/effect/v/4.0.0",
};

const makeMetadata = (overrides: {
	distTags?: Record<string, string>;
	versions?: ReadonlyArray<{ version: string; publishedAt?: string }>;
	npmUrl?: string;
}): NpmMetadataValue => {
	const value = Schema.decodeUnknownSync(NpmMetadata)({
		name: "effect",
		distTags: overrides.distTags ?? { latest: "4.0.0" },
		versions: overrides.versions ?? [
			{ version: "4.0.0", publishedAt: "2026-09-24T10:00:00Z" },
			{ version: "3.19.0", publishedAt: "2024-01-01T00:00:00Z" },
		],
		repositoryUrl: "https://github.com/Effect-TS/effect",
		npmUrl: overrides.npmUrl ?? "https://www.npmjs.com/package/effect",
	});

	return value;
};

it("decodes a release with a publishedAt", () => {
	const release = Schema.decodeUnknownSync(Release)(baseRelease);

	expect(release.version).toBe("4.0.0");
	expect(Option.getOrUndefined(release.publishedAt)?.epochMilliseconds).toBe(
		baseRelease.publishedAt.epochMilliseconds,
	);
	expect(release.url).toBe(baseRelease.url);
});

it("allows an omitted publishedAt", () => {
	const release = Schema.decodeUnknownSync(Release)({
		...baseRelease,
		publishedAt: undefined,
	});

	expect(Option.isNone(release.publishedAt)).toBe(true);
});

it("rejects a release without a version", () => {
	expect(() =>
		Schema.decodeUnknownSync(Release)({
			...baseRelease,
			version: undefined,
		}),
	).toThrow();
});

it("rejects a release without a url", () => {
	expect(() =>
		Schema.decodeUnknownSync(Release)({
			...baseRelease,
			url: undefined,
		}),
	).toThrow();
});

it("builds a release from the latest version", () => {
	const release = toRelease(makeMetadata({}));

	expect(release.version).toBe("4.0.0");
	expect(Option.getOrUndefined(release.publishedAt)?.epochMilliseconds).toBe(
		DateTime.makeUnsafe("2026-09-24T10:00:00Z").epochMilliseconds,
	);
	expect(release.url).toBe("https://www.npmjs.com/package/effect");
});

it("marks publishedAt as none when the latest version has no date", () => {
	const release = toRelease(
		makeMetadata({
			distTags: { latest: "4.1.0-rc.1" },
			versions: [{ version: "4.1.0-rc.1" }],
		}),
	);

	expect(release.version).toBe("4.1.0-rc.1");
	expect(Option.isNone(release.publishedAt)).toBe(true);
});

it("marks publishedAt as none when the latest version is missing", () => {
	const release = toRelease(
		makeMetadata({
			distTags: { latest: "9.9.9" },
			versions: [{ version: "4.0.0", publishedAt: "2026-09-24T10:00:00Z" }],
		}),
	);

	expect(release.version).toBe("9.9.9");
	expect(Option.isNone(release.publishedAt)).toBe(true);
});

it("uses the npm url as the release url", () => {
	const release = toRelease(
		makeMetadata({ npmUrl: "https://www.npmjs.com/package/effect" }),
	);

	expect(release.url).toBe("https://www.npmjs.com/package/effect");
});
