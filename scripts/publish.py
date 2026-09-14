#!/usr/bin/env python3
"""Publish the tested npm tarball from the matching public version tag."""
import base64
import hashlib
import json
import shutil
import subprocess
import urllib.error
import urllib.request

from release import ROOT, VERSION, require_public_tag, verify_assets


require_public_tag()
verify_assets()
artifact = ROOT / 'dist' / f'schematic-supertest-{VERSION}.tgz'
try:
    with urllib.request.urlopen(f'https://registry.npmjs.org/schematic-supertest/{VERSION}', timeout=30) as response:
        published = json.load(response)
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
    published = None
if published is not None:
    integrity = 'sha512-' + base64.b64encode(hashlib.sha512(artifact.read_bytes()).digest()).decode()
    if published['dist']['integrity'] != integrity:
        raise SystemExit('This npm version already exists with different bytes; release a new version')
    print('Identical tarball is already published on npm; keeping it unchanged')
else:
    npm = shutil.which('npm')
    # setup-node supplies an npmrc and placeholder NODE_AUTH_TOKEN. npm obtains
    # publishing credentials through GitHub OIDC; no stored npm token is used.
    subprocess.run([npm, 'publish', str(artifact), '--access', 'public', '--provenance',
                    '--ignore-scripts', '--registry', 'https://registry.npmjs.org/'],
                   cwd=ROOT, check=True)
