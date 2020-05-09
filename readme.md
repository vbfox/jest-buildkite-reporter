# Jest Buildkite reporter

[![CI](https://github.com/vbfox/jest-buildkite-reporter/workflows/CI/badge.svg)](https://github.com/vbfox/jest-buildkite-reporter/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/jest-buildkite-reporter)](https://www.npmjs.com/package/jest-buildkite-reporter)

Report Jest test results in [Buildkite](https://buildkite.com/) output as annotations

## Usage

Install the package :

```bash
npm install -D jest-buildkite-reporter
# or
yarn add -D jest-buildkite-reporter
```

Add it your jest reporters. If you don't have any reporters
you should also add the `default` one or you will lose
the console output.

```javascript
module.exports = {
    reporters: ['default', 'jest-buildkite-reporter'],
};
```

The reporter only run when it detect that buildkite is present,
so there is no need to conditionally include it.

### Inside docker

When your tests are running in a docker containter they won't have access to buildkite by default and some environment variables need to be passed to them.

When `jest` is called as a `RUN` step inside the `Dockerfile` it need to specify the following args:

```dockerfile
ARG BUILDKITE
ARG BUILDKITE_AGENT_ACCESS_TOKEN
ARG BUILDKITE_JOB_ID

RUN yarn run jest
```

And they need to be passed to the `docker build` command:

```bash
docker build --build-arg BUILDKITE --build-arg BUILDKITE_AGENT_ACCESS_TOKEN --build-arg BUILDKITE_JOB_ID .
```

## License

This project is using the [MIT](LICENSE) license.

## Similar projects

* [junit-annotate-buildkite-plugin](https://github.com/buildkite-plugins/junit-annotate-buildkite-plugin) Official Buildkite plugin for JUnit
* [jest-teamcity-reporter](https://github.com/winterbe/jest-teamcity-reporter) Jest reporter for TeamCity
* [jest-teamcity](https://github.com/itereshchenkov/jest-teamcity) Another Jest reporter for TeamCity
* [bugcrowd-test-summary-buildkite-plugin](https://github.com/bugcrowd/test-summary-buildkite-plugin) BugCrowd reporter for BuildKite
