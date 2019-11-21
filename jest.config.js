module.exports = {
    "reporters": ["default", ["<rootDir>/dist/index.js", {
        debug: process.env.NODE_ENV === 'development'
    }]],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
};