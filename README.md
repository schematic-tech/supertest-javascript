# Supertest for TypeScript and JavaScript

```sh
npm install --save-dev @schematic-tech/supertest
```

From the [text-tools example](examples/text-tools):

```javascript
import assert from 'node:assert/strict';
import { assume, supertest } from '@schematic-tech/supertest';
import { collapseSpaces } from '../src/text.js';

export const collapsingSpacesAgainChangesNothing = supertest((text) => {
  assume(typeof text === 'string');
  const once = collapseSpaces(text);
  const twice = collapseSpaces(once);

  assert.equal(twice, once);
});
```

See the [Getting Started Documentation](https://docs.schematic.tech/super).

## Example

Try [text-tools](https://github.com/schematic-tech/supertest-javascript/tree/main/examples/text-tools), a space-normalization example with a supertest.

## Moving from `schematic-supertest`

Install `@schematic-tech/supertest` in place of `schematic-supertest`, and update
imports and `require()` calls to the scoped name. The browser entry point is now
`@schematic-tech/supertest/browser`. The authoring API is unchanged.

Use Super CLI 0.14.3 or later to discover supertests imported from the scoped package.
Existing releases of `schematic-supertest` remain available for projects that have
not migrated.

## License

This library is available under either MIT or Apache-2.0, at your option.
