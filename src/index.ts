import { getBuildkiteEnv, annotate, AnnotationStyle } from 'buildkite-agent-node';

interface ReporterOptions {
    readonly debug?: boolean;
}

function getDefaultOptions(): Required<ReporterOptions> {
    return {
        debug: false,
    }
}

interface JestStatus {
    inProgress: boolean;
    tests?: jest.Test[];
    estimatedTime: number;
    result: jest.AggregatedResult;
    endTime?: Date;
}

function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    let text = '';
    if (status.inProgress) {
        text += 'Tests are running for XXXs';
    } else {
        text += 'Tests finished in XXXs';
    }
    if (status.inProgress) {
        text += ` of ${status.estimatedTime}s estimated`;
    }

    text += '\n\n';

    text += `**Test Suites**: ${status.result.numFailedTestSuites} failed, ${status.result.numTotalTestSuites} total\n\n`;
    text += `**Tests**: ${status.result.numFailedTests} failed, ${status.result.numTotalTests} total\n\n`;

    text += '';
    for(const testResult of status.result.testResults) {
        const emoji = testResult.numFailingTests === 0 ? '✅' : '❌';
        const path = testResult.testFilePath.replace(cwd + '/', '').replace(cwd, '');
        text += `## ${emoji} ${path}\n\n` 
        
        for(const assertionResult of testResult.testResults) {
            let assertionEmoji = '';
            switch(assertionResult.status) {
                case 'failed' : assertionEmoji = '❌'; break;
                case 'passed' : assertionEmoji = '✅'; break;
                case 'pending' : assertionEmoji = '⏱'; break;
                case 'skipped' : assertionEmoji = '⏭'; break;
                default: assertionEmoji = assertionResult.status; break;
            }
            text += `<details><summary>${assertionEmoji} ${assertionResult.fullName}</summary>\n\n`;
            for (const failureMessage of assertionResult.failureMessages) {
                text += '```term\n';
                text += `${failureMessage}\n`;
                text += '```\n\n';
            }
            text += '</details>\n\n';
        }
        
        if (testResult.failureMessage) {
            text += '<details><summary>Failure message</summary>\n\n';
            text += '```term\n';
            text +=  testResult.failureMessage + 'EOM\n';
            text += '```\n\n';
            text += '</details>\n\n';
        }

        if (debug) {
            console.log(testResult);
        }
    }

    if (debug) {
        require('fs').writeFileSync("debug.md", text);
    }
    return text;
}

class JestBuildkiteReporter implements jest.Reporter {
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

module.exports = JestBuildkiteReporter;