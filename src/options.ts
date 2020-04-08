import { ClientConfiguration } from "buildkite-agent-node/dist/config";

export interface ReporterOptions {
    readonly title?: string;
    readonly debug?: boolean;
    readonly agentConfig ?: ClientConfiguration;
    readonly verbose?: boolean;
}

export interface ResolvedReporterOptions {
    readonly title?: string;
    readonly debug: boolean;
    readonly agentConfig: ClientConfiguration;
    readonly verbose: boolean;
}

export function getDefaultOptions(): ResolvedReporterOptions {
    return {
        title: undefined,
        debug: false,
        agentConfig: {},
        verbose: false,
    }
}