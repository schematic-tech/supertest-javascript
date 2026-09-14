# Schematic Supertest for TypeScript and JavaScript

Authoring primitives for [Schematic](https://schematic.tech) supertests: specifications
over typed inputs, assumptions, and ordinary assertions. One package supplies ESM,
CommonJS, TypeScript declarations, source maps, and a browser entry. There are no
runtime dependencies.

## Installation

Prepared npm package: **`schematic-supertest@0.1.0`**. It has not been published yet.
After publication:

```sh
npm install --save-dev schematic-supertest
```

Node.js 22+ is supported. Browser bundles target ES2022 and need no Node polyfills.
The published JavaScript can be used directly without compiling TypeScript.

## Authoring

```typescript
import { assume, supertest } from "schematic-supertest";

export const incrementIsLarger = supertest((value: number) => {
  assume(Number.isSafeInteger(value) && value < Number.MAX_SAFE_INTEGER);
  if (value + 1 <= value) {
    throw new Error("increment must increase an admitted input");
  }
});
```

JavaScript uses the same imports and function calls, without the type annotation.
Use JSDoc to describe JavaScript inputs when needed. CommonJS is also supported:

```javascript
const { assume, supertest } = require("schematic-supertest");
```

For a namespace import, use `import * as schematic from "schematic-supertest"` and
call `schematic.assume(...)` / `schematic.supertest(...)`.

`supertest(fn)` returns the original function without calling or wrapping it. It
preserves its identity, argument/return types, generics, `this`, and async behavior.
It is a source marker, not a unit-test registration or a TypeScript method decorator.
`assume(condition)` follows JavaScript truthiness and evaluates the argument once.
Its declaration narrows TypeScript types after a successful assumption.

## Runtime assumptions

On Node's main thread, a false assumption calls `process.exit(0)`. Run one concrete
input per process. Rejection ends the caller, skips stack `finally` blocks and
pending asynchronous work, and runs synchronous exit handlers. Do not use a
successful rejected input as evidence that the property holds. A Node Worker calls
the same API but exits only that worker, not the parent process.

Browser-aware bundlers automatically select the portable implementation. You can
also select it explicitly, including in a custom Node runner:

```javascript
import { assume, supertest, AssumptionNotMet } from "schematic-supertest/browser";

const property = supertest((value) => {
  assume(value >= 0);
  if (Math.sqrt(value) < 0) throw new Error("unexpected result");
});

try {
  property(-1);
} catch (error) {
  if (!(error instanceof AssumptionNotMet)) throw error;
  // This concrete input was rejected; let the runner record that outcome.
}
```

**Browser limitation:** there is no process exit status. A false assumption throws
`AssumptionNotMet`; a runner must catch it and record rejection. It does not stop
other browser tasks, and `finally` blocks still run. Await asynchronous supertests
inside the runner's `try` block so rejected promises are classified correctly.
Use an explicit thrown error or a test assertion library for failures:
`console.assert` only logs and is unsuitable for enforcing a property.

This library supplies authoring primitives. Pup discovery and backend checking for
TypeScript/JavaScript require separate integration, which is not implemented here.

## Development and releases

With Node.js 22+, npm, and Python 3.11+:

```sh
npm ci
npm test
python3 scripts/package.py
```

Packaging checks install the actual tarball in an isolated consumer and test ESM,
CommonJS, TypeScript NodeNext/Bundler resolution, runtime rejection, and a browser
bundle without Node globals. CI tests Node 22/24/26 and Windows. Release jobs use
Node 24 and npm 11.16.0 and publish only from matching version tags in
`schematic-tech/supertest-javascript`.

See [RELEASING.md](RELEASING.md) for initial npm credentials, trusted publishing,
and tag commands. Each release includes an npm tarball, source archives, both
licenses, and checksums.

Licensed **MIT OR Apache-2.0**, at your option. See [LICENSE-MIT](LICENSE-MIT) and
[LICENSE-APACHE](LICENSE-APACHE). The API follows the authoring model in
[schematic-tech/schematic-supertests](https://github.com/schematic-tech/schematic-supertests).
