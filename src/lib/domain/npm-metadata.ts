import { Schema } from "effect";

const DistTags = Schema.Record(Schema.String, Schema.String);

const Version = Schema.Struct({
	version: Schema.String,
	publishedAt: Schema.OptionFromOptional(Schema.DateTimeUtc),
});

export const NpmMetadata = Schema.Struct({
	name: Schema.String,
	distTags: DistTags,
	versions: Schema.Array(Version),
	repositoryUrl: Schema.String,
	npmUrl: Schema.String,
});

export type NpmMetadataValue = typeof NpmMetadata.Type;
