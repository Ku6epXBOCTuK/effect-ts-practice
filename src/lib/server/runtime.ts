import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { NpmRegistryLive } from "./adapters/npm-registry";
import { InMemoryMonitorRepositoryLayer } from "./repositories/monitor-repository";
import { MonitorServiceLive } from "./services/monitor-service";

const AppServiceLayer = Layer.mergeAll(
	MonitorServiceLive.pipe(Layer.provide(InMemoryMonitorRepositoryLayer)),
	NpmRegistryLive,
);

export function makeAppRuntime() {
	return ManagedRuntime.make(
		AppServiceLayer.pipe(Layer.provide(FetchHttpClient.layer)),
	);
}

export const appRuntime = makeAppRuntime();
