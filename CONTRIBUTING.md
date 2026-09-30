# Contributing

Thanks for helping improve Visual Spec. Public docs and the specification are written in **English**. This repository is maintainer-led ([GOVERNANCE.md](./GOVERNANCE.md)).

## Local setup

Node.js ≥ 24 and pnpm ≥ 10.

```sh
pnpm install
pnpm test
pnpm validate -- packages/schema/examples/hello.json
pnpm dev
pnpm build
```

The documentation site lives in `apps/web`. Format it with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html):

```sh
pnpm fmt
pnpm fmt:check
```

## Examples

Positive examples live under `packages/schema/examples/`. They **MUST** validate successfully.

1. Add a JSON document that uses only properties defined by the generated schemas.
2. Register it in `packages/schema/examples/index.json` when it should appear in the site catalog.
3. Run `pnpm validate -- packages/schema/examples/<your-file>.json` and `pnpm test`.

Negative / semantic-error fixtures belong under the test suite (see `tests/`). A negative example should fail for a documented reason (schema or a `VS-*` rule), not for an accidental typo.

Do **not** commit secrets, credentials, private design files, or live access tokens in examples or references.

## Schema changes

Generated JSON under `packages/schema/schema/` (and generated example packaging tied to the build) **MUST NOT** be hand-edited.

1. Change the schema sources consumed by `scripts/build-schema.mjs`.
2. Run `node scripts/build-schema.mjs` (also invoked by `pnpm dev` / `pnpm build`).
3. Update normative specification pages under `specification/1.0/` when meaning changes.
4. For normative behavior, new profiles, or compatibility impact, follow [rfcs/0000-process.md](./rfcs/0000-process.md).

## Specification and content

- Normative pages: `specification/1.0/*.md`
- Learning guides: `content/docs.json` (do not rewrite casually; coordinate if meaning shifts)
- Profiles catalog: `content/profiles.json`
- Component registry: `content/components.json`

Keep platform `mappings` informative. Do not claim shipped adapters that do not exist.

## Pull requests

- Prefer focused PRs with a clear summary.
- Include tests or examples for behavioral fixes.
- Link an RFC when required by the process document.
