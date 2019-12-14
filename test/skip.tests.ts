describe.skip('describe.skip', () => {
    test('foo', () =>
    {
        expect(true).toBe(false);
    })
});
describe('test inside skipped', () => {
    test.skip('skipped test', () => {
        expect(true).toBe(false);
    });
});