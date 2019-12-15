module.exports = {
    "reporters": ["default", ["<rootDir>/dist/index.js", {
        title: 'Success suite',
        debug: process.env.NODE_ENV === 'development'
    }]],
    testMatch: [
        "**/test/build_success/**/*.+(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
};