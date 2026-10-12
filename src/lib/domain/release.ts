import { Schema } from "effect";
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

// TODO(student): реализуй маппинг NpmMetadataValue -> ReleaseValue.
// 1) версия берётся из metadata.distTags.latest;
// 2) найди объект этой версии в metadata.versions и забери его publishedAt;
// 3) url = metadata.npmUrl;
// 4) если версия или её дата не найдены — publishedAt остаётся None.
export const toRelease = (metadata: NpmMetadataValue): ReleaseValue => {
	throw new Error("not implemented");
};
