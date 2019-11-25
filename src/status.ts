export interface JestStatus {
    inProgress: boolean;
    tests?: jest.Test[];
    estimatedTime: number;
    result: jest.AggregatedResult;
    endTime?: Date;
}
