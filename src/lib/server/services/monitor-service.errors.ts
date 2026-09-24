import { Schema } from "effect";

export class DuplicateMonitorError extends Schema.TaggedError<DuplicateMonitorError>()(
	"DuplicateMonitorError",
	{ id: Schema.String },
) {}

export class MonitorNotFoundError extends Schema.TaggedError<MonitorNotFoundError>()(
	"MonitorNotFoundError",
	{ id: Schema.String },
) {}
