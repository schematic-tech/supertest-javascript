// SPDX-License-Identifier: MIT OR Apache-2.0
import { rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
rmSync("lib", { recursive: true, force: true });
for (const [directory, module, resolution, type] of [
  ["esm", "ES2022", "Bundler", "module"],
  ["cjs", "CommonJS", "Node10", "commonjs"],
]) {
  execFileSync(process.execPath, [require.resolve("typescript/bin/tsc"), "--project", "tsconfig.json",
    "--module", module, "--moduleResolution", resolution, "--outDir", `lib/${directory}`], { stdio: "inherit" });
  writeFileSync(`lib/${directory}/package.json`, JSON.stringify({ type }) + "\n");
}
