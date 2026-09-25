import type { MonitorValue } from "./monitor";

export type MonitorSummary = Pick<
	MonitorValue,
	"id" | "source" | "identifier" | "displayName" | "enabled"
>;
