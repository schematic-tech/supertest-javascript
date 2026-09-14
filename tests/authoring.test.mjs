// SPDX-License-Identifier: MIT OR Apache-2.0
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { test } from "node:test";
import { Worker } from "node:worker_threads";
import { assume, supertest } from "schematic-supertest";
import * as browser from "schematic-supertest/browser";

const require = createRequire(import.meta.url);

test("marker preserves identity, this, arguments, return types and async behavior", async () => {
  let calls = 0;
  function add(value) { calls++; return this.base + value; }
  assert.equal(supertest(add), add);
  assert.equal(calls, 0);
  assert.equal(supertest(add).call({ base: 3 }, 4), 7);
  assert.equal(calls, 1);
  const asynchronous = async (value) => value + 1;
  assert.equal(supertest(asynchronous), asynchronous);
  assert.equal(await supertest(asynchronous)(2), 3);
  assert.throws(() => supertest(42), TypeError);
});

test("true assumptions evaluate once and continue", () => {
  let calls = 0;
  assume(++calls);
  assert.equal(calls, 1);
  require("schematic-supertest").assume(true);
});

test("false assumptions terminate helper callers successfully in ESM and CommonJS", () => {
  for (const [type, load] of [
    ["module", 'import { assume } from "schematic-supertest";'],
    ["commonjs", 'const { assume } = require("schematic-supertest");'],
  ]) {
    // Synchronous exit-handler writes remain reliable even when stdout is piped.
    const source = `${load}
      ${type === "module" ? 'import { writeSync } from "node:fs";' : 'const { writeSync } = require("node:fs");'}
      process.on("exit", () => writeSync(1, "exit-handler"));
      try { function helper() { assume(false); } helper(); writeSync(1, "continued"); }
      catch { writeSync(1, "caught"); }
      finally { writeSync(1, "finally"); }
      process.exitCode = 41;`;
    const result = spawnSync(process.execPath, [`--input-type=${type}`, "-e", source],
      { encoding: "utf8", timeout: 10000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "exit-handler");
    assert.equal(result.stderr, "");
  }
});

test("assertions still fail for admitted inputs", () => {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e",
    'import { assume } from "schematic-supertest"; import assert from "node:assert/strict"; assume(true); assert.fail("property failed");'],
    { encoding: "utf8", timeout: 10000 });
  assert.ifError(result.error);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /AssertionError/);
});

test("a Node worker exits successfully without terminating the parent", async () => {
  const worker = new Worker('require("schematic-supertest").assume(false); throw new Error("continued");', { eval: true });
  const code = await new Promise((resolve, reject) => {
    worker.on("error", reject);
    worker.on("exit", resolve);
  });
  assert.equal(code, 0);
});

test("browser rejection is a distinct catchable error, including for async inputs", async () => {
  browser.assume(true);
  for (const api of [browser, require("schematic-supertest/browser")]) {
    let unwound = false;
    assert.throws(() => {
      try { api.assume(false); assert.fail("continued"); }
      finally { unwound = true; }
    }, api.AssumptionNotMet);
    assert.equal(unwound, true);
    await assert.rejects(api.supertest(async () => api.assume(false))(), api.AssumptionNotMet);
  }
});

test("browser condition selects the portable entry without an explicit subpath", () => {
  const result = spawnSync(process.execPath, ["--conditions=browser", "--input-type=module", "-e",
    'import { assume, AssumptionNotMet } from "schematic-supertest"; let rejected=false; try { assume(false); } catch(e) { if (!(e instanceof AssumptionNotMet)) throw e; rejected=true; } if(!rejected) throw new Error("continued"); console.log("rejected");'],
    { encoding: "utf8", timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "rejected\n");
});
