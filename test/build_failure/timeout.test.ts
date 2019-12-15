import { setTimeout } from "timers";

describe('foo', () => {
    describe('bar', () => {
        test('Long async', async () => {
            console.log('start');

            await wait(2000);
            console.log('2s');

            await wait(2000);
            console.log('4s');

            await wait(2000);
            console.log('6s');

            await wait(2000);
            console.log('8s');

            expect([42, 42]).toEqual([42, 42]);
        });
    })
})

function wait(ms: number) {
    return new Promise(accept => {
        setTimeout(() => accept(), ms);
    })
}
