import { ClientConfiguration } from "buildkite-agent-node/dist/config";

export interface ReporterOptions {
    readonly debug?: boolean;
    readonly agentConfig ?: ClientConfiguration;
}

export function getDefaultOptions(): Required<ReporterOptions> {
    return {
        debug: false,
        agentConfig: {},
    }
}