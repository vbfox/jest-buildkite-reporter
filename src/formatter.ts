
import { orderBy } from 'lodash';
import { JestStatus, emptyAdditionalTestInfo, AdditionalTestInfo } from './status';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { TestResult, Status, AssertionResult } from '@jest/test-result';
import { ConsoleBuffer } from '@jest/console';
import { MarkdownBuilder } from './markdownBuilder';

const durationHumanizer = new HumanizeDuration(new HumanizeDurationLanguage());
durationHumanizer.setOptions({
    units: ['y', 'mo', 'd', 'w', 'h', 'm', 's', 'ms'],
    language: 'shortEn',
    languages: {
      shortEn: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's',
        ms: () => 'ms',
      }
    }
})

const humanizeDuration = durationHumanizer.humanize.bind(durationHumanizer);

function formatRelativePath(root: string, path: string) {
    return path.replace(root + '/', '').replace(root, '');
}

function getStatusEmoji(status: Status) {
    switch(status) {
        case 'failed' : return '❌';
        case 'passed' : return '✅';
        case 'pending' : return '⏱';
        case 'skipped' : return '⏭';
        default: return '❓';
    }
}

function getStatusText(status: Status) {
    switch(status) {
        case 'failed' : return 'Failed';
        case 'passed' : return 'Passed';
        case 'pending' : return 'Pending';
        case 'skipped' : return 'Skipped';
        default: return '❓';
    }
}

function assertionResultNameToString(result: AssertionResult) {
    const allTitles = [...result.ancestorTitles, result.title];
    return allTitles.join(' ➤ ');
}

function getJestStatusSummary(status: JestStatus, builder: MarkdownBuilder) {
    if (status.inProgress) {
        const time = (new Date()).valueOf() - status.result.startTime;
        builder.append(`Tests are running for ${humanizeDuration(time)}`);
    } else {
        const end = (status.endTime || new Date()).valueOf();
        const time = end - status.result.startTime;
        const endMessage = status.result.success ? 'succeeded' : 'failed';
        builder.append(`Tests ${endMessage} in ${humanizeDuration(time)}`);
    }
    if (status.inProgress) {
        builder.append(` of ${humanizeDuration(status.estimatedTime)} estimated`);
    }

    builder.appendParagraphBreak();

    builder.append('**Test Suites**: ');
    const numFailedTestSuites = status.result.numFailedTestSuites;
    builder.appendColorIf('red', `${numFailedTestSuites} failed`, numFailedTestSuites > 0);
    builder.append(', ');
    const numPassedTestSuites = status.result.numPassedTestSuites;
    builder.appendColorIf('green', `${numPassedTestSuites} passed`, numPassedTestSuites > 0);
    builder.append(', ');
    builder.append(`${status.result.numTotalTestSuites} total`);
    
    builder.appendLineBreak();

    builder.appendLine('**Tests**: ');
    const numFailedTests = status.result.numFailedTests;
    builder.appendColorIf('red', `${numFailedTests} failed`, numFailedTests > 0);
    builder.append(', ');
    const numPassedTests = status.result.numPassedTests;
    builder.appendColorIf('green', `${numPassedTests} passed`, numPassedTests > 0);
    builder.append(', ');
    builder.append(`${status.result.numTotalTests} total`);
}

function appendAssertionResult(assertionResult: AssertionResult, builder: MarkdownBuilder) {
    const assertionEmoji = getStatusEmoji(assertionResult.status);
    const name = assertionResultNameToString(assertionResult);

    builder.appendDetailsStart(`${assertionEmoji} ${name}`);
    builder.append(getStatusText(assertionResult.status));
    if (assertionResult.duration) {
        builder.append(` in ${humanizeDuration(assertionResult.duration)}`);
    }
    builder.appendLine();
    for (const failureMessage of assertionResult.failureMessages) {
        builder.appendTerm(failureMessage);
        builder.appendLine();
    }
    builder.appendDetailsEnd();
    builder.appendLine();
}

function appendConsole(cwd: string, console: ConsoleBuffer, builder: MarkdownBuilder) {
    builder.appendDetailsStart('Console');
    builder.appendLine();
    for(const logEntry of console) {
        const [path, line] = logEntry.origin.split(':'); 
        const relativePath = formatRelativePath(cwd, path);
        builder.append(' * ');
        builder.appendColor('lightgrey', 'console.');
        let prepend = '';
        if (logEntry.type === 'error') {
            prepend = '\u001b[31m';
            builder.appendColor('red', logEntry.type);
        } else if (logEntry.type === 'warn') {
            prepend = '\u001b[33m';
            builder.appendColor('yellow', logEntry.type);
        } else {
            builder.append(logEntry.type);
        }
        builder.appendColor('lightgrey', ' · ');
        builder.append(relativePath);
        builder.appendColor('lightgrey', ':');
        builder.appendLine(line);

        builder.appendTerm(prepend + logEntry.message, 3);
    }
    builder.appendLine();
    builder.appendDetailsEnd();
}

function appendTestResult(cwd: string, testResult: TestResult, additional: AdditionalTestInfo, builder: MarkdownBuilder) {
    const emoji = testResult.numFailingTests === 0 ? '✅' : '❌';
    const path = formatRelativePath(cwd, testResult.testFilePath);
    builder.appendLine();
    builder.appendLine(`## ${emoji} ${path}`);
    builder.appendLine();
    
    const orderedAssertions = orderBy(testResult.testResults, ['status', 'fullName']);
    for(const assertionResult of orderedAssertions) {
        appendAssertionResult(assertionResult, builder);
    }

    if (additional.console) {
        appendConsole(cwd, additional.console, builder);
    }
}

function appendRunningTest(cwd: string, path: string, builder: MarkdownBuilder) {
    const relativePath = formatRelativePath(cwd, path);
    const emoji = '🏃‍♀️';
    builder.appendLine();
    builder.appendLine(`## ${emoji} ${relativePath}`);
    builder.appendLine();
}

function appendTestResults(cwd: string, testResults: TestResult[], additionalTestInfo: Map<string, AdditionalTestInfo>, builder: MarkdownBuilder) {
    for(const testResult of testResults) {
        const additional = additionalTestInfo.get(testResult.testFilePath) || emptyAdditionalTestInfo;
        appendTestResult(cwd, testResult, additional, builder);
    }
}

function appendRunningTests(cwd: string, testResults: TestResult[], additionalTestInfo: Map<string, AdditionalTestInfo>, builder: MarkdownBuilder) {
    const others = [...additionalTestInfo.keys()]
        .filter(testPath => testResults.findIndex(p => p.testFilePath === testPath) === -1);
    for(const other of others) {
        appendRunningTest(cwd, other, builder);
    }
}

export function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    const builder = new MarkdownBuilder();

    getJestStatusSummary(status, builder);
    builder.appendLine();
    builder.appendLine();

    const finishedWithSuccess = !status.inProgress && status.result.success;
    if (finishedWithSuccess) {
        // When finished no need for details
        builder.appendDetailsStart('Details');
    }

    const orderedTests = orderBy(status.result.testResults, ['numFailingTests', 'testFilePath'], ['desc', 'asc']);
    const successfulTests = orderedTests.filter(t => t.numFailingTests == 0);
    const failedTests = orderedTests.filter(t => t.numFailingTests > 0);
    
    appendTestResults(cwd, failedTests, status.additionalTestInfo, builder);
    appendRunningTests(cwd, orderedTests, status.additionalTestInfo, builder);
    appendTestResults(cwd, successfulTests, status.additionalTestInfo, builder);

    if (finishedWithSuccess) {
        builder.appendDetailsEnd();
    }

    const text = builder.toString();
    if (debug) {
        require('fs').writeFileSync("debug.md", text);
    }
    return text;
}