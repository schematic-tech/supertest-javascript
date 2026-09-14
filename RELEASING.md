# Releasing TypeScript and JavaScript

Prepared version: **0.1.0**, licensed **MIT OR Apache-2.0** at the user's option.
Public repository: `schematic-tech/supertest-javascript`.
npm package: **`schematic-supertest`** (one package for both languages).

## One-time setup

1. Create the public repository from a reviewed squash snapshot, including `.github`,
   without copying private Git history. Enable Actions and create environment
   **`release`**, allowing version tags. Leave required reviewers unset if a tag
   should publish automatically.
2. Confirm your npm account can create `schematic-supertest`. The current name
   availability check is not a reservation. npm requires the package to exist
   before its trusted publisher can be configured, so the first tag uses a token.
3. Generate a short-lived **granular access token** in npm's website. Grant package
   **Read and write (publish and stage)** permissions, select **All Packages** so
   the new unscoped package can be created, and enable **Bypass two-factor
   authentication** for unattended publication. Do not select stage-only access.
   Store it as environment secret **`NPM_TOKEN`** in the public repository:

```sh
gh secret set NPM_TOKEN --repo schematic-tech/supertest-javascript --env release
```

After public CI passes, publish the first version from its public checkout:

```sh
python3 scripts/release.py check --tag v0.1.0
git tag -a v0.1.0 -m 'Release 0.1.0'
git push origin v0.1.0
```

The workflow runs the full CI, downloads and verifies the tested tarball, publishes
it with provenance, and creates a GitHub Release. GitHub's built-in token handles
release assets; no GitHub PAT is needed. Normal branch pushes only build/test;
publishing is guarded by the exact public repository and matching version tag.

## Switch to trusted publishing after the first release

In the npm package's Settings → Trusted publishing, add a GitHub Actions publisher:

- Organization/user: **`schematic-tech`**
- Repository: **`supertest-javascript`**
- Workflow filename: **`release.yml`**
- Environment: **`release`**
- Allow **direct `npm publish`**, so tags do not require a separate staged approval.

Alternatively, with npm 11.15+ and an interactive login/2FA session:

```sh
npm trust github schematic-supertest --repo schematic-tech/supertest-javascript \
  --file release.yml --env release --allow-publish
```

Then remove and revoke the bootstrap token:

```sh
gh secret delete NPM_TOKEN --repo schematic-tech/supertest-javascript --env release
```

Revoke it on npm's Access Tokens page. Future releases use GitHub OIDC and need no
stored npm token. The workflow pins npm 11.16.0 and uses GitHub-hosted runners with
`id-token: write`; these satisfy npm's trusted-publishing requirements. Keep the
publisher configuration and `package.json`'s public repository URL in agreement.

## Validation, version bumps, and recovery

Run `npm ci` then `python3 scripts/package.py` locally. It builds, tests, packs, and
installs the tarball for ESM/CommonJS, types, subprocess, worker, and browser checks.
These checks do not publish. `npm pack` also builds JavaScript through `prepack`.

Update `VERSION`, `package.json` and `package-lock.json` together before subsequent
public squash commits and tags. Never move a published tag or replace a package
version. On a retry, the publishing script skips an existing version only if its
SHA512 integrity matches the tested tarball. Fix credentials and rerun failed jobs
for transient errors; use a new version when package bytes change. GitHub assets
are uploaded to a draft first and published assets are retained unchanged.

References: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[trusted publisher prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/),
[granular tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/).
