import { getBuildkiteEnv, annotate, AnnotationStyle, resolveConfig } from 'buildkite-agent-node';
import { JestStatus, AdditionalTestInfo, emptyAdditionalTestInfo } from './status';
import { renderJestStatus } from './formatter';
import { getDefaultOptions, ReporterOptions } from './options';
import { AggregatedResult, TestResult } from '@jest/test-result';
import { Reporter, ReporterOnStartOptions } from '@jest/reporters'
import { Context, Test } from '@jest/reporters/build/types';
import { Config } from '@jest/types';

function getAnnotationStyle(inProgress: boolean, result: AggregatedResult): AnnotationStyle {
    if ((result.numFailedTests > 0) || (result.numFailedTestSuites > 0)) {
        return AnnotationStyle.Error;
    }
    
    if (inProgress) {
        return AnnotationStyle.Info;
    }
    
    return AnnotationStyle.Success;
}

export class JestBuildkiteReporter implements Reporter {
    private uniqueKey: string;
    private enabled: boolean;
    private currentPromise: Promise<any> | undefined;
    private status: JestStatus | undefined;
    private config: Required<ReporterOptions>;
    private cwd: string;
    private reAnnotate: boolean = false;

    constructor(private globalConfig: Config.GlobalConfig, options?: ReporterOptions) {
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
        if (this.status === undefined || !this.enabled) {
            return;
        }

        const body = renderJestStatus(this.cwd, this.status, this.config.debug);
        const result = this.status.result;
        const style = getAnnotationStyle(result);

        this.currentPromise = annotate(body, {
            context: this.uniqueKey,
            append: false,
            style
        });

        try {
            await this.currentPromise;
        }
        catch (error) {
            this.enabled = false;
            this.currentPromise = undefined;
            this.reAnnotate = false;
            
            const resolvedAgentConfig = resolveConfig(this.config.agentConfig);
            console.error(`jest-buildkite-reporter failed on endpoint '${resolvedAgentConfig.endpoint}' and job '${resolvedAgentConfig.jobId}':\n\n`, error);
            return;
        }

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

    async onRunStart(results: AggregatedResult, options: ReporterOnStartOptions) {
        if (!this.enabled) {
            return;
        }

        this.status = {
            inProgress: true,
            estimatedTime: options.estimatedTime,
            result: results,
            additionalTestInfo: new Map<string, AdditionalTestInfo>(),
        };
        this.onAnnotationChanged();
    }

    onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
        if (!this.enabled) {
            return;
        }

        // Some information like console logs are stripped from AggregatedResult
        this.status!.additionalTestInfo.set(testResult.testFilePath, {
            console: testResult.console
        });

        this.status!.result = aggregatedResult;
        this.onAnnotationChanged();
    }

    onTestStart(test: Test) {
        if (!this.enabled) {
            return;
        }

        // AggregatedResult don't contain running tests
        this.status!.additionalTestInfo.set(test.path, emptyAdditionalTestInfo);

        this.onAnnotationChanged();
    }

    async onRunComplete(contexts: Set<Context>, results: AggregatedResult): Promise<void> {
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

    getLastError() {
    }
}