
import { orderBy } from 'lodash';
import { JestStatus } from './status';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';

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

function getStatusEmoji(status: jest.Status) {
    switch(status) {
        case 'failed' : return '❌';
        case 'passed' : return '✅';
        case 'pending' : return '⏱';
        case 'skipped' : return '⏭';
        default: return '❓';
    }
}

function getStatusText(status: jest.Status) {
    switch(status) {
        case 'failed' : return 'Failed';
        case 'passed' : return 'Passed';
        case 'pending' : return 'Pending';
        case 'skipped' : return 'Skipped';
        default: return '❓';
    }
}

function assertionResultNameToString(result: jest.AssertionResult) {
    const allTitles = [...result.ancestorTitles, result.title];
    return allTitles.join(' ➤ ');
}

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

    appendColor(color: string, s: string) {
        // Class names are a hack, Buildkite filter the <font> element
        // But they allow className and have a wide library of colors
        // in their terminal css renderer.
        let className;
        let colorValue = color;
        switch (color) {
            case 'red':
                className = 'term-fgx160';
                colorValue = '#d70000';
                break;
            case 'green':
                className = 'term-fgx70';
                colorValue = '#5faf00';
                break;
        }

        if (className) {
            this.append(`<span class="${className}">`);
        }
        
        this.append(`<font color="${colorValue}">${s}</font>`);

        if (className) {
            this.append(`</span>`);
        }
    }

    appendColorIf(color: string, s: string, condition: boolean) {
        if (condition) {
            this.appendColor(color, s);
        } else {
            this.append(s);
        }
    }

    appendTerm(text: string) {
        this.appendLine();
        this.appendLine('```term');
        this.appendLine(text);
        this.appendLine('```');
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

function appendAssertionResult(assertionResult: jest.AssertionResult, builder: MarkdownBuilder) {
    const assertionEmoji = getStatusEmoji(assertionResult.status);
    const name = assertionResultNameToString(assertionResult);

    builder.appendLine(`<details><summary>${assertionEmoji} ${name}</summary>`);
    builder.append(getStatusText(assertionResult.status));
    if (assertionResult.duration) {
        builder.append(` in ${humanizeDuration(assertionResult.duration)}`);
    }
    builder.appendLine();
    for (const failureMessage of assertionResult.failureMessages) {
        builder.appendTerm(failureMessage);
        builder.appendLine();
    }
    builder.appendLine('</details>');
    builder.appendLine();
}

function appendTestResult(cwd: string, testResult: jest.TestResult, builder: MarkdownBuilder) {
    const emoji = testResult.numFailingTests === 0 ? '✅' : '❌';
    const path = formatRelativePath(cwd, testResult.testFilePath);
    builder.appendLine(`## ${emoji} ${path}`);
    builder.appendLine();
    
    const orderedAssertions = orderBy(testResult.testResults, ['status', 'fullName']);
    for(const assertionResult of orderedAssertions) {
        appendAssertionResult(assertionResult, builder);
    }
}

export function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    const builder = new MarkdownBuilder();
    getJestStatusSummary(status, builder);
    builder.appendLine();
    builder.appendLine();

    const orderedTests = orderBy(status.result.testResults, ['numFailingTests', 'testFilePath'], ['desc', 'asc']);
    for(const testResult of orderedTests) {
        appendTestResult(cwd, testResult, builder);
    }

    const text = builder.toString();
    if (debug) {
        require('fs').writeFileSync("debug.md", text);
    }
    return text;
}