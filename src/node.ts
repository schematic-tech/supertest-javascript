// SPDX-License-Identifier: MIT OR Apache-2.0
import { exit } from "node:process";
export { AssumptionNotMet, supertest } from "./core.js";

/**
 * Continues for a truthy condition; otherwise exits Node with status 0.
 * Run one concrete input per process, on its main thread. In a Node Worker this
 * exits only that worker. Stack finally blocks and pending async work do not run.
 */
export function assume(condition: unknown): asserts condition {
  if (!condition) {
    exit(0);
  }
}
