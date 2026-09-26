import { Context, Effect } from "effect";
import type { NpmMetadataValue } from "../../domain/npm-metadata.ts";
import type { NpmRegistryError } from "./npm-registry.errors.ts";

export class NpmRegistry extends Context.Service<
	NpmRegistry,
	{
		readonly getPackageMetadata: (
			packageName: string,
		) => Effect.Effect<NpmMetadataValue, NpmRegistryError>;
	}
>()("NpmRegistry") {}
