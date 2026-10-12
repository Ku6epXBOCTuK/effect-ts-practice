import { Option, Schema } from "effect";
import type { NpmMetadataValue } from "./npm-metadata.ts";

/**
 * Релиз одного пакета/репозитория: конкретная версия, дата её публикации и
 * ссылка на источник. `publishedAt` опционален — API может не вернуть
 * надёжную дату, и тогда Release Gate даст статус `date_unknown`.
 */
export const Release = Schema.Struct({
	version: Schema.String,
	publishedAt: Schema.OptionFromOptional(Schema.DateTimeUtc),
	url: Schema.String,
});

export type ReleaseValue = typeof Release.Type;

export const toRelease = (metadata: NpmMetadataValue): ReleaseValue => {
	const latest = metadata.distTags.latest;
	const latestData = metadata.versions.find((data) => data.version === latest);
	if (latestData === undefined) {
		return {
			version: latest,
			publishedAt: Option.none(),
			url: metadata.npmUrl,
		};
	}

	return {
		version: metadata.distTags.latest,
		publishedAt: latestData.publishedAt,
		url: metadata.npmUrl,
	};
};
