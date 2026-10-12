import { svelteTesting } from "@testing-library/svelte/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import adapter from "@sveltejs/adapter-node";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
			},
		}),
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/lib/paraglide",
			emitTsDeclarations: true,
		}),
		svelteTesting(),
	],
	test: {
		passWithNoTests: true,
		environment: "jsdom",
		expect: { requireAssertions: true },
		include: ["src/**/*.{test,spec}.{js,ts}"],
		exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
	},
});
