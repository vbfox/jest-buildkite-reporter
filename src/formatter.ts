
import { orderBy } from 'lodash';
import { JestStatus, emptyAdditionalTestInfo, AdditionalTestInfo } from './status';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { TestResult, Status, AssertionResult } from '@jest/test-result';
import { ConsoleBuffer } from '@jest/console';

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

type SupportedColor = 'red' | 'green' | 'yellow' | 'lightgrey';

class MarkdownBuilder {
    private text: string = '';

    append(s: string) {
        this.text += s;
    }

    appendLine(s?: string) {
        if (s) {
            this.text += s + '\n';
        } else {
            this.text += '\n';
        }
    }

    appendParagraphBreak() {
        this.text += '\n\n';
    }

    appendLineBreak() {
        this.text += '<br />\n';
    }

    appendColor(color: SupportedColor, s: string) {
        // Class names are a hack, Buildkite filter the <font> element
        // But they allow className and have a wide library of colors
        // in their terminal css renderer.
        let className;
        let colorValue;
        switch (color) {
            case 'red':
                className = 'term-fgx160';
                colorValue = '#d70000';
                break;
            case 'green':
                className = 'term-fgx70';
                colorValue = '#5faf00';
                break;
            case 'lightgrey':
                className = 'term-fgx250';
                colorValue = '#bcbcbc';
                break;
            case 'yellow':
                // Orange in fact, because yellow over white is unreadable
                className = 'term-fgx214';
                colorValue = '#ffaf00';
                break;
        }

        this.append(`<span class="${className}">`);        
        this.append(`<font color="${colorValue}">${s}</font>`);
        this.append(`</span>`);
    }

    appendColorIf(color: SupportedColor, s: string, condition: boolean) {
        if (condition) {
            this.appendColor(color, s);
        } else {
            this.append(s);
        }
    }

    appendCode(format:string, text: string, indent?: number) {
        const indentStr = indent === undefined ? '' : ' '.repeat(indent);
        this.appendLine();
        this.appendLine(indentStr + '```' + format);
        const lines = text.split('\n');
        for(const line of lines) {
            this.appendLine(indentStr + line);    
        }
        this.appendLine(indentStr + '```');
    }

    appendTerm(text: string, indent?: number) {
        this.appendCode('term', text, indent);
    }

    appendDetailsStart(summary: string) {
        this.appendLine(`<details><summary>${summary}</summary>`);
        this.appendLine();
    }

    appendDetailsEnd() {
        this.appendLine(`</details>`);
    }

    toString() {
        return this.text;
    }
}

function getJestStatusSummary(status: JestStatus, builder: MarkdownBuilder) {
    if (status.inProgress) {
        const time = (new Date()).valueOf() - status.result.startTime;
        builder.append(`Tests are running for ${humanizeDuration(time)}`);
    } else {
        const end = (status.endTime || new Date()).valueOf();
        const time = end - status.result.startTime
        builder.append(`Tests finished in ${humanizeDuration(time)}`);
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

export function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    const builder = new MarkdownBuilder();
    getJestStatusSummary(status, builder);
    builder.appendLine();
    builder.appendLine();

    const orderedTests = orderBy(status.result.testResults, ['numFailingTests', 'testFilePath'], ['desc', 'asc']);
    for(const testResult of orderedTests) {
        const additional = status.additionalTestInfo.get(testResult.testFilePath) || emptyAdditionalTestInfo;
        appendTestResult(cwd, testResult, additional, builder);
    }

    const others = [...status.additionalTestInfo.keys()]
        .filter(testPath => orderedTests.findIndex(p => p.testFilePath === testPath) === -1);
    for(const other of others) {
        appendRunningTest(cwd, other, builder);
    }

    const text = builder.toString();
    if (debug) {
        require('fs').writeFileSync("debug.md", text);
    }
    return text;
}