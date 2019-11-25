Tests finished in XXXs

**Test Suites**: 2 failed, 3 total

**Tests**: 2 failed, 5 total

## ❌ test/test.ts

<details><summary>❌ foo bar Failure</summary>

```term
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

[32m- Expected[39m
[31m+ Received[39m

[2m  Array [[22m
[2m    42,[22m
[32m-   43,[39m
[31m+   42,[39m
[2m  ][22m
    at Object.<anonymous> (/Users/fox/Code/jest-buildkite-reporter/test/test.ts:9:30)
    at Object.asyncJestTest (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:102:37)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/queueRunner.js:43:12
    at new Promise (<anonymous>)
    at mapper (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/queueRunner.js:26:19)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/queueRunner.js:73:41
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
```

</details>

<details><summary>✅ foo bar Console outout</summary>

</details>

<details><summary>✅ foo bar Success</summary>

</details>

<details><summary>Failure message</summary>

```term
[1m[31m  [1m● [1mfoo › bar › Failure[39m[22m

    [2mexpect([22m[31mreceived[39m[2m).[22mtoEqual[2m([22m[32mexpected[39m[2m) // deep equality[22m

    [32m- Expected[39m
    [31m+ Received[39m

    [2m  Array [[22m
    [2m    42,[22m
    [32m-   43,[39m
    [31m+   42,[39m
    [2m  ][22m
[2m[22m
[2m    [0m [90m  7 | [39m        })[33m;[39m[0m[22m
[2m    [0m [90m  8 | [39m        test([32m'Failure'[39m[33m,[39m () [33m=>[39m {[0m[22m
[2m    [0m[31m[1m>[2m[39m[90m  9 | [39m            expect([[35m42[39m[33m,[39m [35m42[39m])[33m.[39mtoEqual([[35m42[39m[33m,[39m [35m43[39m])[33m;[39m[0m[22m
[2m    [0m [90m    | [39m                             [31m[1m^[2m[39m[0m[22m
[2m    [0m [90m 10 | [39m        })[33m;[39m[0m[22m
[2m    [0m [90m 11 | [39m        test([32m'Console outout'[39m[33m,[39m () [33m=>[39m {[0m[22m
[2m    [0m [90m 12 | [39m            console[33m.[39mlog([32m'Hello world'[39m)[33m;[39m[0m[22m
[2m[22m
[2m      [2mat Object.<anonymous> ([2m[0m[36mtest/test.ts[39m[0m[2m:9:30)[2m[22m
EOM
```

</details>

## ❌ test/timeout.test.ts

<details><summary>❌ foo bar Long async</summary>

```term
: Timeout - Async callback was not invoked within the 5000ms timeout specified by jest.setTimeout.Timeout - Async callback was not invoked within the 5000ms timeout specified by jest.setTimeout.Error: 
    at new Spec (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Spec.js:116:22)
    at new Spec (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/setup_jest_globals.js:80:9)
    at specFactory (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:575:24)
    at Env.it (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:644:24)
    at Env.it (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:132:23)
    at it (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/jasmineLight.js:93:21)
    at Suite.<anonymous> (/Users/fox/Code/jest-buildkite-reporter/test/timeout.test.ts:5:9)
    at addSpecsToSuite (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:496:51)
    at Env.describe (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:466:11)
    at describe (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/jasmineLight.js:81:18)
    at Suite.<anonymous> (/Users/fox/Code/jest-buildkite-reporter/test/timeout.test.ts:4:5)
    at addSpecsToSuite (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:496:51)
    at Env.describe (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/Env.js:466:11)
    at describe (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/jasmine/jasmineLight.js:81:18)
    at Object.<anonymous> (/Users/fox/Code/jest-buildkite-reporter/test/timeout.test.ts:3:1)
    at Runtime._execModule (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runtime/build/index.js:867:68)
    at Runtime._loadModule (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runtime/build/index.js:577:12)
    at Runtime.requireModule (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runtime/build/index.js:433:10)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:202:13
    at Generator.next (<anonymous>)
    at asyncGeneratorStep (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:27:24)
    at _next (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:47:9)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:52:7
    at new Promise (<anonymous>)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:44:12
    at _jasmine (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:207:19)
    at jasmine2 (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-jasmine2/build/index.js:60:19)
    at /Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runner/build/runTest.js:385:24
    at Generator.next (<anonymous>)
    at asyncGeneratorStep (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runner/build/runTest.js:161:24)
    at _next (/Users/fox/Code/jest-buildkite-reporter/node_modules/jest-runner/build/runTest.js:181:9)
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
```

</details>

<details><summary>Failure message</summary>

```term
[1m[31m  [1m● [1mfoo › bar › Long async[39m[22m

    : Timeout - Async callback was not invoked within the 5000ms timeout specified by jest.setTimeout.Timeout - Async callback was not invoked within the 5000ms timeout specified by jest.setTimeout.Error:
[2m[22m
[2m    [0m [90m 3 | [39mdescribe([32m'foo'[39m[33m,[39m () [33m=>[39m {[0m[22m
[2m    [0m [90m 4 | [39m    describe([32m'bar'[39m[33m,[39m () [33m=>[39m {[0m[22m
[2m    [0m[31m[1m>[2m[39m[90m 5 | [39m        test([32m'Long async'[39m[33m,[39m async () [33m=>[39m {[0m[22m
[2m    [0m [90m   | [39m        [31m[1m^[2m[39m[0m[22m
[2m    [0m [90m 6 | [39m            console[33m.[39mlog([32m'start'[39m)[33m;[39m[0m[22m
[2m    [0m [90m 7 | [39m[0m[22m
[2m    [0m [90m 8 | [39m            await wait([35m2000[39m)[33m;[39m[0m[22m
[2m[22m
[2m      [2mat new Spec ([2mnode_modules/jest-jasmine2/build/jasmine/Spec.js[2m:116:22)[2m[22m
[2m      [2mat Suite.<anonymous> ([2m[0m[36mtest/timeout.test.ts[39m[0m[2m:5:9)[2m[22m
[2m      [2mat Suite.<anonymous> ([2m[0m[36mtest/timeout.test.ts[39m[0m[2m:4:5)[2m[22m
[2m      [2mat Object.<anonymous> ([2m[0m[36mtest/timeout.test.ts[39m[0m[2m:3:1)[2m[22m
EOM
```

</details>

## ✅ test/another.test.ts

<details><summary>✅ Direct under file</summary>

</details>

