import { getEnv, annotate, AnnotationStyle } from 'buildkite-agent-node';

interface ReporterOptions {
    readonly debug?: boolean;
}

function getDefaultOptions(): Required<ReporterOptions> {
    return {
        debug: false,
    }
}

interface JestStatus {
    tests?: jest.Test[];
    estimatedTime?: number;
    result?: jest.AggregatedResult;
}

function renderJestStatus(status: JestStatus) {
    let text = '# Tests\n\n';
    if (status.estimatedTime) {
        text += `Estimated time: ${status.estimatedTime}s\n`;
    }

    if (status.result) {
        text += `**Test Suites**: ${status.result.numFailedTestSuites} failed, ${status.result.numTotalTestSuites} total\n`;
        text += `**Tests**: ${status.result.numFailedTests} failed, ${status.result.numTotalTests} total\n`;

        text += '## Test suites\n';
        for(const testResult of status.result.testResults) {
            console.log(testResult);
        }
    }

    return text;
}

class JestBuildkiteReporter implements jest.Reporter {
    private uniqueKey: string;
    private enabled: boolean;
    private currentPromise: Promise<any>;
    private status: JestStatus;
    private config: Required<ReporterOptions>;

    constructor(private globalConfig: jest.GlobalConfig, options?: ReporterOptions) {
        this.enabled = getEnv().isPresent;
        this.uniqueKey = 'jest-' + (new Date().toISOString());
        this.currentPromise = Promise.resolve();
        this.status = {};
        this.config = { ...getDefaultOptions(), ...options };

        if (!!globalConfig.verbose) {
            console.log('Jest Buildkite reporter is ' + (this.enabled ? 'enabled' : 'disabled'));
            console.log('\tOptions', options)
        }
    }

    private async annotate(body: string, style: AnnotationStyle) {
        if (this.config.debug) {
            console.log('Sending ' + style + ' body:\n' + body);
            return;
        }

        await annotate(body, {
            context: this.uniqueKey,
            append: false,
            style
        });
    }

    async continue(continuation: () => Promise<any>) {
        await this.currentPromise;
        const promise = continuation();
        this.currentPromise = promise;
        return promise;
    }

    private sendNextAnnotation() {
        const text = renderJestStatus(this.status);
        const style = this.status.result
            ? (this.status.result.success
                ? 'success'
                : (((this.status.result.numFailedTests > 0) || (this.status.result.numFailedTestSuites > 0))
                    ? 'error'
                    : 'info'))
            : 'info';
        this.continue(() => this.annotate(text, style));
    }

    async onRunStart(results: jest.AggregatedResult, options: jest.ReporterOnStartOptions) {
        if (!this.enabled) {
            return;
        }

        this.status.estimatedTime = options.estimatedTime;
        this.status.result = results;
        this.sendNextAnnotation();
    }

    onTestResult(test: jest.Test, testResult: jest.TestResult, aggregatedResult: jest.AggregatedResult) {
        if (!this.enabled) {
            return;
        }

        this.status.result = aggregatedResult;
        this.sendNextAnnotation();
    }

    onTestStart(test: jest.Test) {
        if (!this.enabled) {
            return;
        }

        this.sendNextAnnotation();
    }

    async onRunComplete(contexts: Set<jest.Context>, results: jest.AggregatedResult): Promise<void> {
        if (!this.enabled) {
            return;
        }
        
        return this.sendNextAnnotation();
    }
}

module.exports = JestBuildkiteReporter;