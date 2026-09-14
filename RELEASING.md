# Releasing TypeScript and JavaScript

Prepared version: **0.1.0**, licensed **MIT OR Apache-2.0** at the user's option.
Public repository: `schematic-tech/supertest-javascript`.
npm package: **`schematic-supertest`** (one package for both languages).

## One-time setup

1. Create the public repository from a reviewed squash snapshot, including `.github`,
   without copying private Git history. Enable Actions and create environment
   **`release`**, allowing version tags. Leave required reviewers unset if a tag
   should publish automatically.
2. Sign in to an individual npm account with 2FA enabled and membership in the npm
   organization **`schematic-tech`**. npm organizations are separate from GitHub
   organizations. Create a free public-package organization if needed.
3. Keep the global package name **`schematic-supertest`**. Organization team access
   does not require renaming it to a scoped package. Confirm that your npm account
   may create the name; availability checks do not reserve it.
4. npm requires the package to exist before configuring trusted publishing. For
   the first version only, download the **successful final public commit's CI
   artifact** and publish that exact tested tarball using browser login/2FA:

```sh
npm login --auth-type=web --registry=https://registry.npmjs.org
# Set ci_run to the successful ci.yml run for the exact public HEAD.
gh run download "$ci_run" --repo schematic-tech/supertest-javascript \
  --name release-assets --dir dist
python3 scripts/release.py verify-assets
npm publish dist/schematic-supertest-0.1.0.tgz --access public --ignore-scripts \
  --registry=https://registry.npmjs.org
```

The interactive first upload has no GitHub OIDC provenance. Later new versions
published by Actions have provenance. Do not create a placeholder version or
rebuild the tarball locally. No `NPM_TOKEN` GitHub secret is used.

After configuring team access and trusted publishing below, finish the first
release from the same public checkout:

```sh
python3 scripts/release.py check --tag v0.1.0
git tag -a v0.1.0 -m 'Release 0.1.0'
git push origin v0.1.0
```

The workflow runs the full CI, downloads and verifies the tested tarball, checks
that the initial npm upload has identical SHA512 integrity, and creates a GitHub
Release. For later versions it publishes through OIDC with provenance. GitHub's built-in token handles
release assets; no GitHub PAT is needed. Normal branch pushes only build/test;
publishing is guarded by the exact public repository and matching version tag.

## Organization management and trusted publishing

Grant a team within the npm organization read/write access to the existing global
package. For example, create a dedicated `supertest-maintainers` team, add the
release maintainers who are already organization members, then grant it access:

```sh
npm team create schematic-tech:supertest-maintainers
npm team add schematic-tech:supertest-maintainers YOUR_NPM_USERNAME
npm access grant read-write schematic-tech:supertest-maintainers schematic-supertest
npm access list packages schematic-tech:supertest-maintainers --json
```

Reuse the team if it already exists. Team access manages permissions; npm still
records the authenticated account or workflow as the publisher of each version.
It does not rename the package or make an organization into a login account.

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

Check the saved configuration with `npm trust list schematic-supertest --json`.
The workflow uses GitHub OIDC and needs no stored npm token. If you created a token
while following an older version of this guide, revoke it and remove any GitHub
`NPM_TOKEN` secret. The workflow pins npm 11.16.0 and uses GitHub-hosted runners with
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
[organization scopes and unscoped packages](https://docs.npmjs.com/about-organization-scopes-and-packages/),
[team package access](https://docs.npmjs.com/cli/v11/commands/npm-access/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/).
