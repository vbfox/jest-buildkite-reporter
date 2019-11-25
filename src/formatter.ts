
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
            this.append(`<span className="${className}">`);
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
    builder.appendColorIf('green', `${numPassedTestSuites} passed</font>`, numPassedTestSuites > 0);
    builder.append(', ');
    builder.append(`${status.result.numTotalTestSuites} total`);
    
    builder.appendLineBreak();

    builder.appendLine('**Tests**: ');
    const numFailedTests = status.result.numFailedTests;
    builder.appendColorIf('red', `${numFailedTests} failed`, numFailedTests > 0);
    builder.append(', ');
    const numPassedTests = status.result.numPassedTests;
    builder.appendColorIf('green', `${numPassedTests} passed</font>`, numPassedTests > 0);
    builder.append(', ');
    builder.append(`${status.result.numTotalTests} total`);
}

export function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    const builder = new MarkdownBuilder();
    getJestStatusSummary(status, builder);
    let text = builder.toString();
    text += '\n\n';
    const orderedTests = orderBy(status.result.testResults, ['numFailingTests', 'testFilePath'], ['desc', 'asc']);
    for(const testResult of orderedTests) {
        const emoji = testResult.numFailingTests === 0 ? '✅' : '❌';
        const path = formatRelativePath(cwd, testResult.testFilePath);
        text += `## ${emoji} ${path}\n\n` 
        
        const orderedAssertions = orderBy(testResult.testResults, ['status', 'fullName']);
        for(const assertionResult of orderedAssertions) {
            const assertionEmoji = getStatusEmoji(assertionResult.status);
            const name = assertionResultNameToString(assertionResult);

            text += `<details><summary>${assertionEmoji} ${name}</summary>\n\n`;
            for (const failureMessage of assertionResult.failureMessages) {
                text += '```term\n';
                text += `${failureMessage}\n`;
                text += '```\n\n';
            }
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