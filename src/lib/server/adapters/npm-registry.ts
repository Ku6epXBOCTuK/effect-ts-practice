import { Context, Effect, Layer, Schema } from "effect";
import { HttpClient } from "effect/unstable/http";
import { type NpmMetadataValue } from "../../domain/npm-metadata.ts";
import {
	normalizeNpmResponse,
	NpmRegistryResponse,
} from "./npm-registry-normalization.ts";
import {
	NPM_REGISTRY_ERROR_CODES,
	NpmRegistryError,
} from "./npm-registry.errors.ts";

export class NpmRegistry extends Context.Service<
	NpmRegistry,
	{
		readonly getPackageMetadata: (
			packageName: string,
		) => Effect.Effect<NpmMetadataValue, NpmRegistryError>;
	}
>()("NpmRegistry") {}

export const NpmRegistryLive = Layer.effect(
	NpmRegistry,
	Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			getPackageMetadata: (packageName: string) =>
				Effect.gen(function* () {
					const response = yield* client.get(
						`https://registry.npmjs.org/${packageName}`,
					);

					if (response.status === 404) {
						return yield* new NpmRegistryError({
							packageName,
							code: NPM_REGISTRY_ERROR_CODES.NOT_FOUND,
						});
					}

					if (response.status !== 200) {
						return yield* new NpmRegistryError({
							packageName,
							code: NPM_REGISTRY_ERROR_CODES.UNKNOWN,
						});
					}

					const json = yield* response.json;

					const rawResponse =
						yield* Schema.decodeUnknownEffect(NpmRegistryResponse)(json);

					return yield* normalizeNpmResponse(rawResponse);
				}).pipe(
					Effect.mapError((error) => {
						return error instanceof NpmRegistryError
							? error
							: new NpmRegistryError({
									packageName,
									code: NPM_REGISTRY_ERROR_CODES.UNKNOWN,
								});
					}),
				),
		};
	}),
);
