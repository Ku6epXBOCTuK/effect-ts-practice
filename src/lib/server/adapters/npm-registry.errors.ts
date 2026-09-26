import { Schema } from "effect";

export class NpmRegistryError extends Schema.TaggedError<NpmRegistryError>()(
	"NpmRegistryError",
	{
		packageName: Schema.String,
		code: Schema.String,
	},
) {}
