module.exports = {
    "reporters": ["default", ["<rootDir>/dist/index.js", {
        title: 'No tests but ok suite',
        debug: process.env.NODE_ENV === 'development'
    }]],
    testMatch: [
        "**/test/build_no_tests/**/*.+(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
};