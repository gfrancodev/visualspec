---
id: RFC-0000
title: How to change Visual Spec
status: active
---

# RFC-0000: How to change Visual Spec

Visual Spec is **maintainer-led**. There is no separate standards committee. Gustavo Franco decides acceptance of RFCs and releases. This process exists so normative changes stay reviewable and compatibility impacts stay explicit.

## When a pull request is enough

Use an ordinary pull request (no RFC) for:

- Documentation and guide wording that does **not** change normative meaning
- Examples, fixtures, and editorial clarifications
- Bugfixes that restore behavior already required by the specification or schemas
- Non-normative website or tooling improvements that do not alter document interpretation

If reviewers disagree whether meaning changed, open an RFC.

## When an RFC is required

Open an RFC before merging changes that:

- Alter normative behavior or conformance requirements
- Add, remove, or redefine profiles
- Change required fields, enums, semantic rules, or default interpretation
- Affect compatibility of existing `visualSpec: "1.0"` documents
- Introduce public commitments about adapters, versioning, or migration

## RFC statuses

| Status | Meaning |
| --- | --- |
| `draft` | Proposal under discussion; not approved |
| `active` | Process or standing document currently in force (this RFC) |
| `accepted` | Approved; implementation may proceed or is complete as stated |
| `rejected` | Declined; rationale should remain visible |
| `superseded` | Replaced by a later RFC |

Status appears in the YAML frontmatter and **SHOULD** be updated in the same change that alters the RFC’s standing.

## How to write an RFC

1. Copy a clear problem statement, motivation, and proposed change.
2. List affected schemas, specification pages, semantic rules, and examples.
3. State compatibility impact for existing 1.0 documents and implementations.
4. Describe alternatives considered and why they were rejected.
5. Note security or privacy considerations when references, assets, or execution boundaries change.
6. Submit a pull request that adds `rfcs/NNNN-slug.md` with frontmatter `id`, `title`, and `status: draft`.

Number RFCs monotonically. Do not reuse numbers. Keep RFCs in English, matching the public specification language.

## Review and acceptance

- Anyone may comment on an RFC pull request.
- The maintainer accepts, requests changes, or rejects.
- Accepted normative RFCs **MUST** update the specification text and schemas through the normal generation pipeline (`scripts/build-schema.mjs`). Hand-editing generated JSON under `packages/schema/schema` is not allowed.
- After a stable 1.0 release, incompatible changes require a new major document version rather than silently rewriting 1.0 semantics.

## Out of scope for RFCs

Private design files, secrets, credentials, and unverifiable marketing claims do not belong in RFCs or the public repository.
