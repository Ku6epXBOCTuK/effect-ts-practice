import { NpmMetadata, type NpmMetadataValue } from "$lib/domain/npm-metadata";
import { Effect, Schema } from "effect";

const DistTags = Schema.Record(Schema.String, Schema.String);

const Version = Schema.Struct({
	version: Schema.String,
});

export const NpmRegistryResponse = Schema.Struct({
	name: Schema.String,
	"dist-tags": DistTags,
	versions: Schema.Record(Schema.String, Version),
	time: Schema.Record(Schema.String, Schema.DateTimeUtcFromString),
	repository: Schema.Struct({
		url: Schema.String,
	}),
});
export type NpmRegistryResponseValue = typeof NpmRegistryResponse.Type;

const toNormalizedInput = (raw: NpmRegistryResponseValue) => {
	const versions = Object.entries(raw.versions).map(([version]) => ({
		version,
		publishedAt: raw.time[version],
	}));

	return {
		name: raw.name,
		distTags: raw["dist-tags"],
		repositoryUrl: raw.repository.url,
		npmUrl: `https://www.npmjs.com/package/${raw.name}`,
		versions,
	};
};

export const normalizeNpmResponse = (
	raw: NpmRegistryResponseValue,
): Effect.Effect<NpmMetadataValue, Schema.SchemaError> =>
	Schema.decodeUnknownEffect(NpmMetadata)(toNormalizedInput(raw));
