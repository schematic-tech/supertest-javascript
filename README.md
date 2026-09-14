# Supertest for TypeScript and JavaScript

```sh
npm install --save-dev schematic-supertest
```

```typescript
import { assume, supertest } from "schematic-supertest";

export const incrementIsLarger = supertest((value: number) => {
  assume(Number.isSafeInteger(value) && value < Number.MAX_SAFE_INTEGER);
  if (value + 1 <= value) {
    throw new Error("Increment must increase the value");
  }
});
```

For JavaScript, omit the `: number` annotation.

See the [Getting Started Documentation](https://docs.schematic.tech/pup).

## License

This library is available under either MIT or Apache-2.0, at your option.
