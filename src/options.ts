import { ClientConfiguration } from "buildkite-agent-node/dist/config";

export interface ReporterOptions {
    readonly title?: string;
    readonly debug?: boolean;
    readonly agentConfig ?: ClientConfiguration;
}

export interface ResolvedReporterOptions {
    readonly title?: string;
    readonly debug: boolean;
    readonly agentConfig: ClientConfiguration;
}

export function getDefaultOptions(): ResolvedReporterOptions {
    return {
        title: undefined,
        debug: false,
        agentConfig: {},
    }
}