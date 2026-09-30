# Rendering, validation, and extensions

This page defines how documents declare output conditions, how implementations negotiate capabilities, how validation is layered, and how extensions may appear.

## Rendering targets

`rendering.targets[]` entries **MUST** include `id` and `platform`. They **MAY** declare width, height, pixel density, color space (and fallback), frame rate, aspect ratio, quality (`draft`, `preview`, `production`, `lossless`), format, transparency, and profile refs.

Document-level `rendering` **MAY** also set shared `capabilities`, `quality`, `deterministic`, `seed`, `fallbackPolicy` (`explicit-only`, `report-and-approximate`, `error`), and `background`.

A visual result depends on viewport, fonts, locale, assets, time, camera, and user preferences. Authors **SHOULD** record the conditions that matter to comparison. Implementation hints **MUST** remain distinct from hard requirements.

## Capabilities and fallbacks

Each capability has `name` and `level`: `required`, `preferred`, `optional`, or `unsupported`. Optional `fallback` may set `strategy` to `omit`, `approximate`, `substitute`, `rasterize`, or `flatten`, with optional description and substitute refs.

- Unsupported **required** capabilities **MUST** be reported as errors before claiming conforming output.
- Allowed approximations **MUST** describe what changed.
- `fallbackPolicy: error` forbids silent degradation.

## Platform overrides

`platformOverrides[]` **MAY** adjust properties for a named platform or `targetRef`. Overrides **MUST** state a `reason` when they change normative appearance or behavior expectations for that platform. Overrides **MUST NOT** silently redefine core field meanings for all platforms.

## Validation rules (document-declared)

`validation` **MAY** enable schema, semantic, accessibility, and capability checks, and list `rules[]`. Each rule **MUST** have `id` and `type` (`schema`, `semantic`, `capability`, `accessibility`, `visual`, `reference-conformance`). Rules **MAY** bind `targetRef`, `referenceRef`, aspect, metric, match mode, conformance level, tolerance, severity, viewport, state, and time.

Passing schema validation does not prove keyboard behavior, focus restoration, or perceptual similarity. Those require runtime evidence. Unavailable evidence **MUST** be reported as unverified, not passed.

## Reference conformance

Reference conformance compares rendered or extracted results to visual references under declared `matchMode` and `conformance` (`strict`, `approximate`, `inspiration`). Tolerances are metric-specific. Discrete conditions (selected state, accessible name present) **SHOULD** use exact assertions. Continuous qualities **SHOULD** use meaningful units.

Validators performing structural and semantic checks **MUST NOT** fetch or execute reference targets. Runtime conformance tools that deliberately retrieve authorized assets are outside the structural validator’s role and **MUST** keep credentials outside the Visual Spec document.

## Extensions

`extensions` (and nested extension objects) **MUST** use namespaced keys only, matching the schema pattern (for example `x-acme.panel` or `tool.feature`).

| Rule | Requirement |
| --- | --- |
| Unknown optional extensions | Consumers **MAY** retain them without interpretation |
| Required unsupported extensions | Consumers **MUST** report an error before claiming conforming output |
| Redefinition | Extensions **MUST NOT** change the meaning of existing core fields |
| Identity | Extensions **SHOULD** reference existing ids instead of duplicating whole objects solely to attach metadata |

## Normative semantic rule codes

Implementations that claim semantic validation for Visual Spec 1.0 **MUST** recognize these codes (severity error unless documented otherwise). Structural schema failures **MAY** be reported as `VS-SCHEMA`.

| Code | Summary |
| --- | --- |
| `VS-ID-001` | Document ids **MUST** be unique. |
| `VS-REF-001` | Identifier references **MUST** resolve to an object in the same document. Validators **MUST NOT** fetch external resources. |
| `VS-TOKEN-001` | Token alias graphs **MUST** be acyclic. |
| `VS-TOKEN-002` | Brace token references **MUST** name a token declared in the document. |
| `VS-TIME-001` | Timed intervals **MUST** end at or after they start. Clips **MUST** fit their timeline and **MUST NOT** overlap on the same track. |
| `VS-GRAPH-001` | Entity parts, component composition, scene `instanceOf`, and joint parent graphs **MUST** be acyclic. |
| `VS-STATE-001` | State transitions **MUST** target a declared state. |
| `VS-TOKEN-003` | A token alias **MUST** target a token of the same type. |
| `VS-MOTION-001` | Non-essential motion **MUST** declare a reduced-motion alternative. |
| `VS-MOTION-002` | Keyframe offsets **MUST** be non-decreasing. |
| `VS-FLOW-001` | A flow's initial state and transitions **MUST** name states declared on that flow. |
| `VS-PROV-001` | A provenance JSON Pointer **MUST** exist in the document. |
| `VS-SCHEMA` | Document **MUST** satisfy the applicable JSON Schema (Draft 2020-12) constraints for Visual Spec 1.0. |

Diagnostics **SHOULD** include code, severity, JSON pointer or path, and a concrete explanation. Runtime reports **SHOULD** include renderer identity/version, resolved assets, unsupported capabilities, applied fallbacks, and evidence locations.

## Conformance checklist (implementer)

A **conforming document**:

1. Sets `visualSpec` to `"1.0"` and valid `metadata` / `profiles`.
2. Satisfies profile-required properties and module schemas.
3. Uses unique, well-formed ids; resolves internal refs; obeys semantic rules above.
4. Places custom data only under namespaced extensions.

A **conforming implementation** for a claimed profile set:

1. Declares supported versions, profiles, and capabilities.
2. Rejects or reports unsupported required capabilities and required extensions.
3. Does not treat parse retention as behavioral support.
4. Does not fetch or execute reference targets during structural/semantic validation.
