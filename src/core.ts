// SPDX-License-Identifier: MIT OR Apache-2.0

/** A rejected input in a browser or a runner using the portable entry point. */
export class AssumptionNotMet extends Error {
  override readonly name = "AssumptionNotMet";

  constructor(message = "Supertest assumption did not hold") {
    super(message);
  }
}

/**
 * Marks a specification while preserving the original function and its types.
 * Does not invoke it, generate inputs, or register an ordinary unit test.
 */
export function supertest<F extends (...args: never[]) => unknown>(fn: F): F {
  if (typeof fn !== "function") {
    throw new TypeError("supertest expects a function");
  }
  return fn;
}
