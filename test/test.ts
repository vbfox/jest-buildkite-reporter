import { setTimeout } from "timers";

describe('foo', () => {
    describe('bar', () => {
        test('Success', () => {
            expect(true).toBeTruthy();
        });
        test('Failure', () => {
            expect([42, 42]).toEqual([42, 43]);
        });
        test('Console outout', () => {
            console.log('Hello world');
        });
    })
})