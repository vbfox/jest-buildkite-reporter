export interface ReporterOptions {
    readonly debug?: boolean;
}

export function getDefaultOptions(): Required<ReporterOptions> {
    return {
        debug: false,
    }
}