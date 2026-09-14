#!/usr/bin/env python3
"""Build and test the npm tarball without publishing it."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile

from release import ROOT, VERSION, validate

NPM = shutil.which('npm')
NODE = shutil.which('node')


def run(*args: str, cwd: Path = ROOT) -> None:
    subprocess.run(args, cwd=cwd, check=True)


def test_package(artifact: Path) -> None:
    with tarfile.open(artifact) as archive:
        for name in ('LICENSE-MIT', 'LICENSE-APACHE'):
            assert archive.extractfile(f'package/{name}').read() == (ROOT / name).read_bytes()
        assert not any('node_modules/' in name or name.startswith('package/tests/') for name in archive.getnames())
    with tempfile.TemporaryDirectory(prefix='supertest-javascript-consumer-') as directory:
        work = Path(directory)
        (work / 'package.json').write_text('{"private": true, "type": "module"}\n')
        run(NPM, 'install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', str(artifact), cwd=work)
        shutil.copyfile(ROOT / 'tests/authoring.test.mjs', work / 'authoring.test.mjs')
        run(NODE, '--test', 'authoring.test.mjs', cwd=work)
        types = '''import { assume, supertest } from "schematic-supertest";
const original = (value: string | null): number => {
  assume(value !== null);
  return value.length;
};
const marked: typeof original = supertest(original);
const result: number = marked("input");
// @ts-expect-error The marker must preserve parameter types.
marked(42);
// @ts-expect-error The marker must require a function.
supertest(42);
const identity = supertest(<T,>(value: T): T => value);
const literal: "literal" = identity("literal" as const);
void result; void literal;
'''
        for suffix in ('mts', 'cts'):
            (work / f'consumer.{suffix}').write_text(types)
        config = {'compilerOptions': {'target': 'ES2022', 'module': 'NodeNext', 'moduleResolution': 'NodeNext',
                                     'strict': True, 'noEmit': True, 'types': [], 'lib': ['ES2022']},
                  'include': ['consumer.mts', 'consumer.cts']}
        (work / 'tsconfig.json').write_text(json.dumps(config))
        compiler = ROOT / 'node_modules/typescript/bin/tsc'
        run(NODE, str(compiler), '--project', str(work / 'tsconfig.json'), cwd=work)
        config['compilerOptions'].update(module='ES2022', moduleResolution='Bundler', customConditions=['browser'])
        config['include'] = ['consumer.mts']
        (work / 'tsconfig.json').write_text(json.dumps(config))
        run(NODE, str(compiler), '--project', str(work / 'tsconfig.json'), cwd=work)
        # Resolve the installed package as a browser bundler would, and execute
        # its bundle in a JavaScript context without Node globals or polyfills.
        test_browser = '''const assert = require("node:assert/strict");
const { buildSync } = require(process.argv[1]);
const { runInNewContext } = require("node:vm");
const result = buildSync({ stdin: { contents: 'export * from "schematic-supertest";', resolveDir: process.cwd() },
  bundle: true, platform: "browser", format: "iife", globalName: "Schematic", write: false });
const context = {};
runInNewContext(result.outputFiles[0].text, context);
const api = context.Schematic;
api.assume(true);
assert.throws(() => api.assume(false), api.AssumptionNotMet);
const fn = (value) => value + 1;
assert.equal(api.supertest(fn), fn);
console.log("Browser bundle passed without Node globals");
'''
        run(NODE, '-e', test_browser, str(ROOT / 'node_modules/esbuild'), cwd=work)
    print('Installed npm tarball passed ESM, CommonJS, TypeScript, browser, and termination checks')


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--test-only', action='store_true', help='test a downloaded CI tarball')
    args = parser.parse_args()
    validate()
    if not NPM or not NODE:
        raise SystemExit('Node.js 22+ and npm are required')
    artifact = ROOT / 'dist' / f'schematic-supertest-{VERSION}.tgz'
    if not args.test_only:
        shutil.rmtree(ROOT / 'dist', ignore_errors=True)
        (ROOT / 'dist').mkdir()
        run(NPM, 'test')
        run(NPM, 'pack', '--ignore-scripts', '--pack-destination', 'dist')
    test_package(artifact)


if __name__ == '__main__':
    main()
