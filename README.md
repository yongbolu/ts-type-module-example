# Turning your TypeScript package into `"type": "module"`

This repository contains an example TypeScript package with full ES Module support.

## Import specifier

Unlike CommonJS Modules, file extensions (`.js`) are mandatory for ES Modules in Node.js.

| | Node.js | Webpack |
|---|---|---|
| CommonJS Modules | `require("foo")` or <br> `require("foo.js")` | `require("foo")` or <br> `require("foo.js")` |
| ES Modules | `import "foo.js";` only | `import "foo";` or <br> `import "foo.js";` |

This is more problematic in TypeScript; source extensions and output extensions differ in the language.

```typescript
// Which declaration should we use to import foo.ts?
import { foo } from "foo";
import { foo } from "foo.js";
import { foo } from "foo.ts";
```

In this repository, **we use `foo.js` to import `foo.ts`** because both TypeScript and Node.js supports it.

<details><summary>Error example</summary>

```
# TypeScript's error for an attempt to import .ts files
src/index.ts:1:21 - error TS2691: An import path cannot end with a '.ts' extension. Consider importing './square' instead.

1 import { square } from "./square.ts";
                         ~~~~~~~~~~~~~


Found 1 error.
```

</details>

## TypeScript

As stated above, TypeScript can resolve `*.js` imports as `*.ts` or `*.tsx` files.

```typescript
// index.ts
import { square } from "./square.js"; // resolves to square.ts
```

When transpiled, `square.ts` turns into `square.js` so Node.js straightforwardly resolves the import.

### Problems with react-jsx

When `"jsx": "react-jsx"` is specified, tsc produces the following snippet:

```typescript
import { jsx as _jsx } from "react/jsx-runtime";
```

The import is expected to be resolved as `node_modules/react/jsx-runtime.js`. As of the current version (React v17.0.1), it fails due to extension mismatch.

<details><summary>Error example</summary>

```
internal/process/esm_loader.js:74
    internalBinding('errors').triggerUncaughtException(
                              ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '$CWD/node_modules/react/jsx-runtime' imported from $CWD/dist-ts/App.js
Did you mean to import react/jsx-runtime.js?
    at finalizeResolution (internal/modules/esm/resolve.js:276:11)
    at moduleResolve (internal/modules/esm/resolve.js:699:10)
    at Loader.defaultResolve [as _resolve] (internal/modules/esm/resolve.js:810:11)
    at Loader.resolve (internal/modules/esm/loader.js:86:40)
    at Loader.getModuleJob (internal/modules/esm/loader.js:230:28)
    at ModuleWrap.<anonymous> (internal/modules/esm/module_job.js:56:40)
    at link (internal/modules/esm/module_job.js:55:36) {
  code: 'ERR_MODULE_NOT_FOUND'
}
```

</details>

The fix https://github.com/facebook/react/pull/20304 will land in the next version of React.

## Webpack

Due to Webpack's pipeline structure, imports must be resolved to the source extension (`.ts`), not the output extension (`.js`).

[Webpack has the ability to automatically add extensions](https://webpack.js.org/configuration/resolve/#resolveextensions), but unfortunately, there's no removal counterpart.

<details><summary>Error example</summary>

```
asset index.js 2.42 KiB [emitted] (name: index)
runtime modules 274 bytes 1 module
./index.ts 194 bytes [built] [code generated]

ERROR in ./index.ts 1:0-31
Module not found: Error: Can't resolve './square.js' in '$CWD/src'
resolve './square.js' in '$CWD/src'
  using description file: $CWD/package.json (relative path: ./src)
    using description file: $CWD/package.json (relative path: ./src/square.js)
      no extension
        $CWD/src/square.js doesn't exist
      .wasm
        $CWD/src/square.js.wasm doesn't exist
      .mjs
        $CWD/src/square.js.mjs doesn't exist
      .js
        $CWD/src/square.js.js doesn't exist
      .jsx
        $CWD/src/square.js.jsx doesn't exist
      .ts
        $CWD/src/square.js.ts doesn't exist
      .tsx
        $CWD/src/square.js.tsx doesn't exist
      .json
        $CWD/src/square.js.json doesn't exist
      as directory
        $CWD/src/square.js doesn't exist
```

</details>

In this repository, we remove the `.js` extension using [a babel plugin](https://www.npmjs.com/package/babel-plugin-replace-import-extension). We should enable this plugin only for Webpack.

## ts-node

As of ts-node 9.1.1, you cannot use the `ts-node` command in an ESM package:

<details><summary>Error example</summary>

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for $CWD/src/index.ts
    at Loader.defaultGetFormat [as _getFormat] (internal/modules/esm/get_format.js:71:15)
    at Loader.getFormat (internal/modules/esm/loader.js:102:42)
    at Loader.getModuleJob (internal/modules/esm/loader.js:231:31)
    at Loader.import (internal/modules/esm/loader.js:165:17)
    at Object.loadESM (internal/process/esm_loader.js:68:5)
```

</details>

You need a different command to enable [the experimental ESM support](https://github.com/TypeStrong/ts-node/issues/1007):

```
$ node --loader ts-node/esm src/index.js
```

## Jest (with ts-jest)

For whatever reason, it seems ts-jest just works with Jest 26.

However, this is no longer the case with Jest 27, which comes with the proper support for ES Modules. See the next section below.

## Jest (with babel-jest)

You need to [pass `--experimental-vm-modules` to Node.js](https://jestjs.io/docs/en/ecmascript-modules), but that's not enough.

<details><summary>Error example</summary>

```
$ node --experimental-vm-modules node_modules/.bin/jest --config=jest-babel.config.ts
(node:27619) ExperimentalWarning: VM Modules is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27660) ExperimentalWarning: VM Modules is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
(node:27654) ExperimentalWarning: VM Modules is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 FAIL  src/square.test.ts
  ● Test suite failed to run

    Jest encountered an unexpected token

    This usually means that you are trying to import a file which Jest cannot parse, e.g. it's not plain JavaScript.

    By default, if Jest sees a Babel config, it will use that to transform your files, ignoring "node_modules".

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/en/ecmascript-modules for how to enable it.
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/en/configuration.html

    Details:

    $CWD/src/square.test.ts:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,global,jest){import { square } from "./square";
                                                                                             ^^^^^^

    SyntaxError: Cannot use import statement outside a module

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1350:14)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.803 s
Ran all test suites.
error Command failed with exit code 1.
```

</details>

You need to [set `extensionsToTreatAsEsm` to `[".ts"]`](https://github.com/facebook/jest/pull/10823), but the option is only available in the coming Jest 27.
