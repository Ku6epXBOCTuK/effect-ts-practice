import { expect, it } from "@effect/vitest";
import { DateTime, Effect, Option, Schema } from "effect";
import {
	NpmRegistryResponse,
	normalizeNpmResponse,
} from "./npm-registry-normalization";

const rawResponse = {
	name: "effect",
	"dist-tags": {
		latest: "4.0.0",
		canary: "4.1.0-rc.1",
	},
	versions: {
		"4.0.0": {
			version: "4.0.0",
		},
		"4.1.0-rc.1": {
			version: "4.1.0-rc.1",
		},
	},
	time: {
		"4.0.0": "2026-09-24T10:00:00Z",
	},
	repository: {
		url: "https://github.com/Effect-TS/effect",
	},
};

it.effect("normalizes npm registry responses", () =>
	Effect.gen(function* () {
		const raw = Schema.decodeUnknownSync(NpmRegistryResponse)(rawResponse);
		const metadata = yield* normalizeNpmResponse(raw);

		expect(metadata.name).toBe("effect");
		expect(metadata.distTags).toEqual({
			latest: "4.0.0",
			canary: "4.1.0-rc.1",
		});
		expect(metadata.versions).toHaveLength(2);
		expect(
			Option.getOrThrow(metadata.versions[0]?.publishedAt ?? Option.none()),
		).toEqual(DateTime.makeUnsafe("2026-09-24T10:00:00Z"));
		expect(
			Option.isNone(metadata.versions[1]?.publishedAt ?? Option.none()),
		).toBe(true);
		expect(metadata.repositoryUrl).toBe("https://github.com/Effect-TS/effect");
		expect(metadata.npmUrl).toBe("https://www.npmjs.com/package/effect");
	}),
);

it("rejects a raw response without a name or versions", () => {
	expect(() =>
		Schema.decodeUnknownSync(NpmRegistryResponse)({
			...rawResponse,
			name: undefined,
			versions: undefined,
		}),
	).toThrow();
});
