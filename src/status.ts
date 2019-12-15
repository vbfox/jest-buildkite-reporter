import { AggregatedResult } from '@jest/test-result';
import { Test } from '@jest/reporters/build/types';
import { ConsoleBuffer } from '@jest/console';

export interface AdditionalTestInfo {
    readonly console?: ConsoleBuffer;
}

export const emptyAdditionalTestInfo: AdditionalTestInfo = {
    console: undefined
}

export interface JestStatus {
    inProgress: boolean;
    tests?: Test[];
    estimatedTime: number;
    result: AggregatedResult;
    endTime?: Date;
    additionalTestInfo: Map<string, AdditionalTestInfo>;
}

export function isSuccessfulResult(result: AggregatedResult) {
    return result.numFailedTestSuites == 0
        && result.numFailedTests == 0;
}