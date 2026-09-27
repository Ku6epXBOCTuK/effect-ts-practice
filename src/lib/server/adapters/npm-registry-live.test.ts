import { expect, it } from "@effect/vitest";
import { DateTime, Effect, Layer, Option } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { NpmRegistry, NpmRegistryLive } from "./npm-registry.ts";
import { NpmRegistryError } from "./npm-registry.errors.ts";

const rawResponse = {
	name: "effect",
	"dist-tags": {
		latest: "4.0.0",
	},
	versions: {
		"4.0.0": {
			version: "4.0.0",
		},
	},
	time: {
		"4.0.0": "2026-09-24T10:00:00Z",
	},
	repository: {
		url: "https://github.com/Effect-TS/effect",
	},
};

let requestedUrl = "";

const TestHttpClientLayer = Layer.succeed(
	HttpClient.HttpClient,
	HttpClient.make((request) => {
		requestedUrl = request.url;

		return Effect.succeed(
			HttpClientResponse.fromWeb(
				request,
				new Response(JSON.stringify(rawResponse), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			),
		);
	}),
);

const appLayer = NpmRegistryLive.pipe(Layer.provide(TestHttpClientLayer));

const NotFoundHttpClientLayer = Layer.succeed(
	HttpClient.HttpClient,
	HttpClient.make((request) =>
		Effect.succeed(
			HttpClientResponse.fromWeb(
				request,
				new Response(JSON.stringify({ error: "Not found" }), {
					status: 404,
					headers: { "content-type": "application/json" },
				}),
			),
		),
	),
);

const notFoundAppLayer = NpmRegistryLive.pipe(
	Layer.provide(NotFoundHttpClientLayer),
);

it.effect("fetches and maps npm metadata through HttpClient", () =>
	Effect.gen(function* () {
		const registry = yield* NpmRegistry;
		const metadata = yield* registry.getPackageMetadata("effect");

		expect(requestedUrl).toBe("https://registry.npmjs.org/effect");
		expect(metadata.name).toBe("effect");
		expect(metadata.distTags).toEqual({ latest: "4.0.0" });
		expect(metadata.versions).toHaveLength(1);
		expect(
			Option.getOrThrow(metadata.versions[0]?.publishedAt ?? Option.none()),
		).toEqual(DateTime.makeUnsafe("2026-09-24T10:00:00Z"));
		expect(metadata.repositoryUrl).toBe("https://github.com/Effect-TS/effect");
		expect(metadata.npmUrl).toBe("https://www.npmjs.com/package/effect");
	}).pipe(Effect.provide(appLayer)),
);

it.effect("maps a 404 response to a typed not_found error", () =>
	Effect.gen(function* () {
		const registry = yield* NpmRegistry;
		const error = yield* Effect.flip(registry.getPackageMetadata("missing"));

		expect(error).toBeInstanceOf(NpmRegistryError);
		expect(error._tag).toBe("NpmRegistryError");
		expect(error.code).toBe("not_found");
	}).pipe(Effect.provide(notFoundAppLayer)),
);
