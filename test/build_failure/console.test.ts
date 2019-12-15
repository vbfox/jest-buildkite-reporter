describe('Console', () => {
    test('Log', () => {
        console.log('console.log');
    });
    test('Debug', () => {
        console.debug('console.debug');
    });
    test('Error', () => {
        console.error('console.error');
    });
    test('Group', () => {
        console.group('group');
        console.groupEnd();
    });
    test('GroupCollapsed', () => {
        console.groupCollapsed('groupCollapsed');
        console.groupEnd();
    });
    test('Warn', () => {
        console.warn('console.warn');
    });
    test('Assert true', () => {
        console.assert('value', 'console.assert');
    });
    test('Assert false', () => {
        const x: number = 0;
        console.assert(x === 1, 'console.assert');
    });
    test('Count', () => {
        console.count('console.count');
    });
    test('Time', () => {
        console.time('console.time');
        console.timeEnd('console.time');
    });
    test('Dir', () => {
        console.dir({ v: 'console.dir' });
    });
    test('DirXml', () => {
        console.dirxml({ v: 'console.dir' });
    });
});