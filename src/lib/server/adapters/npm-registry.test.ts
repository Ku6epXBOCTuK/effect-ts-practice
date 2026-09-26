import { expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Schema } from "effect";
import { NpmMetadata } from "../../domain/npm-metadata.ts";
import { NpmRegistryError } from "./npm-registry.errors.ts";
import { NpmRegistry } from "./npm-registry.ts";

const metadata = Schema.decodeUnknownSync(NpmMetadata)({
	name: "effect",
	distTags: { latest: "4.0.0" },
	versions: [
		{
			version: "4.0.0",
			publishedAt: DateTime.makeUnsafe("2026-09-24T10:00:00Z"),
		},
	],
	repositoryUrl: "https://github.com/Effect-TS/effect",
	npmUrl: "https://www.npmjs.com/package/effect",
});

const TestNpmRegistryLayer = Layer.succeed(NpmRegistry)({
	getPackageMetadata: (packageName) =>
		packageName === "missing"
			? Effect.fail(
					new NpmRegistryError({
						packageName,
						code: "not_found",
					}),
				)
			: Effect.succeed(metadata),
});

it.effect("provides npm metadata through the registry service", () =>
	Effect.gen(function* () {
		const registry = yield* NpmRegistry;
		const result = yield* registry.getPackageMetadata("effect");

		expect(result.name).toBe("effect");
		expect(result.distTags.latest).toBe("4.0.0");
		expect(result.npmUrl).toBe("https://www.npmjs.com/package/effect");
	}).pipe(Effect.provide(TestNpmRegistryLayer)),
);

it.effect("preserves typed registry errors", () =>
	Effect.gen(function* () {
		const registry = yield* NpmRegistry;
		const error = yield* Effect.flip(registry.getPackageMetadata("missing"));

		expect(error).toBeInstanceOf(NpmRegistryError);
		expect(error._tag).toBe("NpmRegistryError");
		expect(error.code).toBe("not_found");
	}).pipe(Effect.provide(TestNpmRegistryLayer)),
);
