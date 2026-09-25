import { Schema } from "effect";

export class InvalidPackageNameError extends Schema.TaggedError<InvalidPackageNameError>()(
	"InvalidPackageNameError",
	{},
) {}
