import { getBuildkiteEnv, annotate, AnnotationStyle } from 'buildkite-agent-node';
import { JestStatus } from './status';
import { renderJestStatus } from './formatter';
import { getDefaultOptions, ReporterOptions } from './options';

export class JestBuildkiteReporter implements jest.Reporter {
    private uniqueKey: string;
    private enabled: boolean;
    private currentPromise: Promise<any>;
    private status: JestStatus | undefined;
    private config: Required<ReporterOptions>;
    private cwd: string;

    constructor(private globalConfig: jest.GlobalConfig, options?: ReporterOptions) {
        this.uniqueKey = 'jest-' + (new Date().toISOString());
        this.currentPromise = Promise.resolve();
        this.config = { ...getDefaultOptions(), ...options };
        this.enabled = getBuildkiteEnv().isPresent || this.config.debug;
        this.cwd = process.cwd();
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
        if (this.status === undefined) {
            return;
        }

        const text = renderJestStatus(this.cwd, this.status, this.config.debug);
        const result = this.status.result;
        const style = result.success
                ? 'success'
                : (((result.numFailedTests > 0) || (result.numFailedTestSuites > 0))
                    ? 'error'
                    : 'info');
        this.continue(() => this.annotate(text, style));
    }

    async onRunStart(results: jest.AggregatedResult, options: jest.ReporterOnStartOptions) {
        if (!this.enabled) {
            return;
        }

        this.status = {
            inProgress: true,
            estimatedTime: options.estimatedTime,
            result: results
        };
        this.sendNextAnnotation();
    }

    onTestResult(test: jest.Test, testResult: jest.TestResult, aggregatedResult: jest.AggregatedResult) {
        if (!this.enabled) {
            return;
        }

        this.status!.result = aggregatedResult;
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
        
        this.status!.inProgress = false;
        this.status!.result = results;
        this.status!.endTime = new Date();
        return this.sendNextAnnotation();
    }
}