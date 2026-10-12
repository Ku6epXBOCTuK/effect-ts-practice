import { render, screen } from "@testing-library/svelte";
import { expect, it } from "vitest";
import MonitorListItem from "./MonitorListItem.svelte";

const monitor = {
	id: "monitor-1",
	source: "npm_package" as const,
	identifier: "effect",
	displayName: "Effect",
	enabled: true,
};

it("renders a check error for the matching monitor", () => {
	render(MonitorListItem, {
		monitor,
		form: {
			code: "monitor_not_found",
			id: monitor.id,
		},
	});

	expect(screen.getByRole("alert").textContent).toContain(
		"This monitor no longer exists.",
	);
});

it("does not render a check error for another monitor", () => {
	render(MonitorListItem, {
		monitor,
		form: {
			code: "monitor_not_found",
			id: "another-monitor",
		},
	});

	expect(screen.queryByRole("alert")).toBeNull();
});

it("renders a check form with the monitor id", () => {
	render(MonitorListItem, { monitor });

	const button = screen.getByRole("button", { name: "Check now" });
	const form = button.closest("form");
	const input = form?.querySelector("input[name='id']");

	expect(form?.getAttribute("action")).toBe("?/check");
	expect(input?.getAttribute("value")).toBe(monitor.id);
});
