import { Layer, ManagedRuntime } from "effect";
import { InMemoryMonitorRepositoryLayer } from "./repositories/monitor-repository";
import { MonitorServiceLive } from "./services/monitor-service";

export function makeAppRuntime() {
	return ManagedRuntime.make(
		MonitorServiceLive.pipe(Layer.provide(InMemoryMonitorRepositoryLayer)),
	);
}

export const appRuntime = makeAppRuntime();
