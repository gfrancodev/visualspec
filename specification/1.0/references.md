# References

Visual Spec treats evidence as a first-class model. A **visual reference** identifies an external resource or an addressable part of it and constrains stated aspects of the expected result. References are not executable content. Validators and adapters **MUST NOT** fetch or execute reference targets merely to validate document structure or resolve internal ids.

## Sources, assets, and visual references

| Kind | Purpose |
| --- | --- |
| `sources[]` | Declares addressable origin resources (`id`, `kind`, optional `uri`, checksum, version, license, provenance). |
| `assets[]` | Declares media and resource descriptors used by scenes, entities, or media objects. |
| `visualReferences[]` | Declares evidence: what to match, which aspects matter, and how strongly. |

A source answers “where did this material come from?” An asset answers “which payload is used at render time?” A visual reference answers “what evidence defines the expected visual outcome?”

A document **MAY** link a reference to a source with `sourceRef`. A live URL is a location, not a reproducible snapshot. Authors **SHOULD** record `checksum` or immutable `version` on sources when reproducibility matters. Credentials **MUST NOT** appear in the document.

## Roles

Every visual reference **MUST** declare `role`:

| Role | Meaning |
| --- | --- |
| `source-of-truth` | Authoritative for its declared aspects |
| `preferred` | Preferred when compatible with higher-priority evidence |
| `supporting` | Corroborating evidence |
| `inspiration` | Directional only; not a hard conformance target |
| `avoid` | Negative constraint - characteristics that **MUST NOT** appear |

An `avoid` reference **MUST NOT** be averaged into a positive style target. Conflict policies that blend weights **MUST** treat `avoid` as exclusion, not as a soft positive sample.

## Locators

`locator` narrows a reference to an addressable region. Locator shapes defined by the schema:

| Locator | Typical use |
| --- | --- |
| `image.region` / `region` | Bounding region of an image (normalized or absolute bounds as declared by the producer) |
| `dom` | `cssSelector`, `xpath`, `text`, optional `shadowPath`, with optional `viewport` |
| `figma` | `fileKey` + `nodeId` (required); optional `pageId`, `version` |
| `pdf` | `page` (required, ≥ 1); optional `region` |
| `presentation` | `slide` (required, ≥ 1); optional `shapeId` |
| `video` | `start` / `end` time, optional `frame`, `track`, `fps` |
| `scene3d` | `scene`, `node`, `camera`, and/or `material` names |
| `document` | `section`, `heading`, `paragraph`, `bookmark` |
| `text` | Character range `start` / `end` |

Example (schema-valid shape):

```json
{
  "id": "ref.checkout",
  "kind": "website",
  "role": "source-of-truth",
  "uri": "https://example.com/checkout",
  "aspects": ["layout", "typography", "color"],
  "locator": {
    "dom": { "cssSelector": "#checkout" },
    "viewport": { "width": 1440, "height": 900 }
  }
}
```

Authors **SHOULD** keep `aspects` narrow. A photograph may define lighting without defining subject identity. A video interval may define timing without defining color grading.

A locator that cannot be resolved at runtime **MUST** yield an unresolved-reference result. It **MUST NOT** be treated as proof that the desired feature is absent.

## Reference sets and conflict policies

`visualReferenceSets[]` group evidence for a shared purpose. Each set **MUST** include `id`, a non-empty `references` list (ids or bindings), and `conflictPolicy`.

Allowed `conflictPolicy` values:

| Policy | Behavior |
| --- | --- |
| `priority` | Higher `priority` (and optional `aspectPriority`) wins |
| `first-wins` | First listed binding wins |
| `last-wins` | Last listed binding wins |
| `weighted` | Combine using declared weights where aspects are compatible |
| `most-specific` | More specific locator / aspect binding wins |
| `explicit-over-inferred` | Explicit authored requirements outrank inferred evidence |
| `error` | Incompatible requirements are a diagnostic; the consumer **MUST NOT** silently pick a winner |

Equal-authority incompatible requirements under `error` **MUST** surface a diagnostic or require an author decision. A consumer **MUST NOT** conceal conflict by choosing whichever source loaded last.

Bindings may attach `aspects`, `weight` (0–1), and `priority` (≥ 0) to a `referenceRef`.

## Path-indexed provenance

`provenance[]` is an evidence index. Each entry **MUST** include a JSON Pointer `path` and a `method` (`direct`, `derived`, `inferred`, `manual`, `generated`, `validated`, or the extraction methods used elsewhere). The pointer **MUST** resolve inside the document (`VS-PROV-001`). This index exists so confidence does not have to wrap every value. Inferred values **SHOULD** be recorded here instead of being written as if they had been measured.

Responsive rules that match the same node resolve by specificity (number of conditions in `when`), then `priority`, then declaration order. Adapters **MUST NOT** invent a different winner.

`platforms` names implementation families (`web`, `apple`, `android`, `fluent`, `custom`). They are not the nine media profiles. Platform timings **MUST NOT** be promoted into universal core defaults.

## Provenance and confidence

Provenance records how a value was obtained. On references (and elsewhere via common provenance), `method` **MUST** be one of:

`explicit` · `measured` · `extracted` · `inferred` · `generated` · `defaulted` · `platform-derived` · `vision-inference` · `reference-derived`

`confidence`, when present, **MUST** be a number in `[0, 1]`. It describes producer confidence, not a universal quality score. Unknown values **SHOULD** remain unknown rather than receiving fabricated precision.

## Match modes and conformance hints

A reference **MAY** set `matchMode`:

`exact` · `structural` · `perceptual` · `semantic` · `stylistic` · `inspirational`

Optional `conformance` maps aspects to `strict`, `approximate`, or `inspiration`. Optional `tolerance` supplies absolute/relative thresholds for comparison. These fields guide runtime validation; they do not relax structural schema rules.

See also [Rendering](/specification/1.0/rendering/) for reference-conformance validation rules.
