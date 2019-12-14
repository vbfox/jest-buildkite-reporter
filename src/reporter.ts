import { getBuildkiteEnv, annotate } from 'buildkite-agent-node';
import { JestStatus } from './status';
import { renderJestStatus } from './formatter';
import { getDefaultOptions, ReporterOptions } from './options';

export class JestBuildkiteReporter implements jest.Reporter {
    private uniqueKey: string;
    private enabled: boolean;
    private currentPromise: Promise<any> | undefined;
    private status: JestStatus | undefined;
    private config: Required<ReporterOptions>;
    private cwd: string;
    private reAnnotate: boolean = false;

    constructor(private globalConfig: jest.GlobalConfig, options?: ReporterOptions) {
        this.uniqueKey = 'jest-' + (new Date().toISOString());
        this.config = { ...getDefaultOptions(), ...options };
        this.enabled = getBuildkiteEnv().isPresent || this.config.debug;
        this.cwd = process.cwd();
        if (!!globalConfig.verbose) {
            console.log('Jest Buildkite reporter is ' + (this.enabled ? 'enabled' : 'disabled'));
            console.log('\tOptions', options)
        }
    }

    /**
     * Send an annotation to Buildkite asynchronously.
     * 
     * This method will re-annotate after doing it if `reAnnotate` is true. 
     */
    private async annotateNow(): Promise<void> {
        if (this.status === undefined) {
            return;
        }

        const body = renderJestStatus(this.cwd, this.status, this.config.debug);
        const result = this.status.result;
        const style = result.success
                ? 'success'
                : (((result.numFailedTests > 0) || (result.numFailedTestSuites > 0))
                    ? 'error'
                    : 'info');

        if (this.config.debug) {
            console.log('Sending ' + style + ' body:\n' + body);
            return;
        }

        this.currentPromise = annotate(body, {
            context: this.uniqueKey,
            append: false,
            style
        });

        await this.currentPromise;

        this.currentPromise = undefined;
        if (this.reAnnotate) {
            this.reAnnotate = false;
            this.annotateNow();
        }
    }

    /**
     * Signal that the state changed and the annotation should be re-computed
     * and sent to Buildkite. 
     */
    private onAnnotationChanged() {
        if (this.currentPromise !== undefined) {
            // If an annotation is currently being sent we simply ask for another one to run when it's done
            this.reAnnotate = true;
        } else {
            // Otherwise we start sending one now
            this.annotateNow();
        }
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
        this.onAnnotationChanged();
    }

    onTestResult(test: jest.Test, testResult: jest.TestResult, aggregatedResult: jest.AggregatedResult) {
        if (!this.enabled) {
            return;
        }

        this.status!.result = aggregatedResult;
        this.onAnnotationChanged();
    }

    onTestStart(test: jest.Test) {
        if (!this.enabled) {
            return;
        }

        this.onAnnotationChanged();
    }

    async onRunComplete(contexts: Set<jest.Context>, results: jest.AggregatedResult): Promise<void> {
        if (!this.enabled) {
            return;
        }
        
        this.status!.inProgress = false;
        this.status!.result = results;
        this.status!.endTime = new Date();
        
        if (this.currentPromise) {
            // If a previous annotation was being sent
            // ensure it doesn't re-annotate and wait for it to end.
            this.reAnnotate = false;
            await this.currentPromise;
        }

        // Send one last annotation with the final info
        await this.annotateNow();
    }
}