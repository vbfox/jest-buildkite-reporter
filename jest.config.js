module.exports = {
    "reporters": ["default", ["<rootDir>/dist/index.js", { debug: true }]],
    testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
};