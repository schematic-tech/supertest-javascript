// SPDX-License-Identifier: MIT OR Apache-2.0
import { AssumptionNotMet } from "./core.js";
export { AssumptionNotMet, supertest } from "./core.js";

/**
 * Continues for a truthy condition; otherwise throws AssumptionNotMet.
 * A runner must catch this specific error and classify the input as rejected.
 * Browsers have no process exit status. Other tasks and finally blocks can run.
 */
export function assume(condition: unknown): asserts condition {
  if (!condition) {
    throw new AssumptionNotMet();
  }
}
