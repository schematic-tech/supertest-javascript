# Supertest for TypeScript and JavaScript

```sh
npm install --save-dev schematic-supertest
```

From the [text-tools example](examples/text-tools):

```javascript
import assert from 'node:assert/strict';
import { assume, supertest } from 'schematic-supertest';
import { collapseSpaces } from '../src/text.js';

export const collapsingSpacesAgainChangesNothing = supertest((text) => {
  assume(typeof text === 'string');
  const once = collapseSpaces(text);
  const twice = collapseSpaces(once);

  assert.equal(twice, once);
});
```

See the [Getting Started Documentation](https://docs.schematic.tech/pup).

## Example

Try [text-tools](https://github.com/schematic-tech/supertest-javascript/tree/main/examples/text-tools), a space-normalization example with a supertest.

## License

This library is available under either MIT or Apache-2.0, at your option.
