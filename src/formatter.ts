
import { orderBy } from 'lodash';
import { JestStatus } from './status';

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