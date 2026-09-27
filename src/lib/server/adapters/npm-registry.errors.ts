import { Schema } from "effect";

export const NPM_REGISTRY_ERROR_CODES = {
	NOT_FOUND: "not_found",
	UNKNOWN: "unknown",
} as const;
export type NpmRegistryErrorCode =
	(typeof NPM_REGISTRY_ERROR_CODES)[keyof typeof NPM_REGISTRY_ERROR_CODES];

export class NpmRegistryError extends Schema.TaggedError<NpmRegistryError>()(
	"NpmRegistryError",
	{
		packageName: Schema.String,
		code: Schema.Literals(Object.values(NPM_REGISTRY_ERROR_CODES)),
	},
) {}
