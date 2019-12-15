module.exports = {
    "reporters": ["default", ["<rootDir>/dist/index.js", {
        debug: process.env.NODE_ENV === 'development'
    }]],
    testMatch: [
        "**/test/build_failure/**/*.+(ts|tsx|js)",
    ],
    "transform": {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
};