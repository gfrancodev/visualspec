# Governance

Visual Spec is **maintainer-led**.

- **Maintainer:** Gustavo Franco ([https://github.com/gfrancodev](https://github.com/gfrancodev))
- **Status:** Release candidate (`1.0.0-rc.1`); document format version `1.0`
- **Canonical domain:** [https://visualspec.dev](https://visualspec.dev)

## Decisions

The maintainer decides releases, RFC acceptance, and repository direction. There is no separate committee.

## Normative changes

Changes to normative behavior, profiles, or compatibility **MUST** go through the [RFC process](./rfcs/0000-process.md). Editorial documentation and non-semantic bugfixes may use ordinary pull requests.

## Generated artifacts

Files produced by `scripts/build-schema.mjs` under `packages/schema/schema/` are **not** edited by hand. Contributors change inputs and regenerate.

## Scope boundaries

Visual Spec documents visual intent. Business logic, gameplay formulas, networking, authentication, and billing remain outside the format. Validators must not fetch or execute reference targets as part of structural or semantic validation.
