
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

export function renderJestStatus(cwd: string, status: JestStatus, debug: boolean) {
    let text = '';
    if (status.inProgress) {
        const time = (new Date()).valueOf() - status.result.startTime;
        text += `Tests are running for ${humanizeDuration(time)}`;
    } else {
        const end = (status.endTime || new Date()).valueOf();
        const time = end - status.result.startTime
        text += `Tests finished in ${humanizeDuration(time)}`;
    }
    if (status.inProgress) {
        text += ` of ${humanizeDuration(status.estimatedTime)} estimated`;
    }

    text += '\n\n';

    text += `**Test Suites**: ${status.result.numFailedTestSuites} failed, ${status.result.numTotalTestSuites} total\n\n`;
    text += `**Tests**: ${status.result.numFailedTests} failed, ${status.result.numTotalTests} total\n\n`;

    text += '';
    const orderedTests = orderBy(status.result.testResults, ['numFailingTests', 'testFilePath'], ['desc', 'asc']);
    for(const testResult of orderedTests) {
        const emoji = testResult.numFailingTests === 0 ? '✅' : '❌';
        const path = formatRelativePath(cwd, testResult.testFilePath);
        text += `## ${emoji} ${path}\n\n` 
        
        const orderedAssertions = orderBy(testResult.testResults, ['status', 'fullName']);
        for(const assertionResult of orderedAssertions) {
            let assertionEmoji = getStatusEmoji(assertionResult.status);
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