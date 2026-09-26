import { expect, it } from "@effect/vitest";
import { DateTime, Option, Schema } from "effect";
import { NpmMetadata } from "./npm-metadata.ts";

const rawMetadata = {
	name: "effect",
	distTags: {
		latest: "4.0.0",
		canary: "4.1.0-rc.1",
	},
	versions: [
		{
			version: "4.0.0",
			publishedAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
		},
		{
			version: "4.1.0-rc.1",
		},
	],
	repositoryUrl: "https://github.com/Effect-TS/effect",
	npmUrl: "https://www.npmjs.com/package/effect",
};

it("decodes npm metadata into a domain model", () => {
	const metadata = Schema.decodeUnknownSync(NpmMetadata)(rawMetadata);

	expect(metadata.name).toBe("effect");
	expect(metadata.distTags.latest).toBe("4.0.0");
	expect(metadata.distTags.canary).toBe("4.1.0-rc.1");
	expect(metadata.versions).toHaveLength(2);
	expect(Option.getOrUndefined(metadata.versions[0]?.publishedAt)).toEqual(
		rawMetadata.versions[0]?.publishedAt,
	);
	expect(
		Option.isNone(metadata.versions[1]?.publishedAt ?? Option.none()),
	).toBe(true);
	expect(metadata.npmUrl).toBe("https://www.npmjs.com/package/effect");
});

it("rejects metadata without a name or versions", () => {
	expect(() =>
		Schema.decodeUnknownSync(NpmMetadata)({
			...rawMetadata,
			name: undefined,
			versions: undefined,
		}),
	).toThrow();
});
