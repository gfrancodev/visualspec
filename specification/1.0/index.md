# Visual Spec 1.0

**Status:** Release candidate (`1.0.0-rc.1`). The document format version is `visualSpec: "1.0"`. This text defines normative behavior for that format. It is maintainer-led and has not been independently ratified as a final standard.

**Canonical domain:** [https://visualspec.dev](https://visualspec.dev)  
**Schema id:** `https://visualspec.dev/schema/1.0/schema.json`  
**Repository:** [https://github.com/gfrancodev/visualspec](https://github.com/gfrancodev/visualspec)  
**Maintainer:** [Gustavo Franco](https://github.com/gfrancodev)

## Prior art

A framework-independent JSON description of an interface is not new. UIDL, IFML and the W3C model-based UI work already separate an intermediate description from a target toolkit. Design tokens already have a community format. Web Animations, CSS easing and platform springs already describe timing and physics. Visual Spec 1.0 does not claim to be the first visual IR. Its claim is the composition: one document for evidence, tokens, components, scenes, motion, accessibility and conformance, specialized by media profile, with provenance kept explicit.

## Definition

Visual Spec is an open, machine-readable contract for **visual intent**. Independently of tool, framework, or platform, a document describes:

- what exists visually,
- how it should appear and be organized,
- how it should behave and move,
- how it changes over time,
- how it should be perceived and operated,
- and which evidence defines the expected result.

It is a **visual intermediate representation (Visual IR)**, not a programming language, UI framework, image format, or replacement for HTML, CSS, Figma, glTF, USD, PowerPoint, Flutter, SwiftUI, Compose, Unity, or Unreal.

```text
Sources → Understanding / Authoring → Visual Spec → Adapter → Render → Validate
```

## How to read this specification

The keywords **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119). They are defined once here and apply throughout Visual Spec 1.0.

| Term | Meaning |
| --- | --- |
| MUST | Absolute requirement for conformance |
| MUST NOT | Absolute prohibition for conformance |
| SHOULD | Strong recommendation; legitimate exceptions exist |
| SHOULD NOT | Strong negative recommendation |
| MAY | Truly optional behavior |

Normative requirements appear in this directory. Learning guides under `/learn/` are informative. JSON Schema defines structural shape; semantic rules in `semantic-rules.json` add ID, reference, token, time, graph, and state checks that Schema alone cannot express.

Consumers **MUST** pin `visualSpec: "1.0"` and validate against the versioned schema id above. A “latest” discovery URL, if published, is discovery-only and **MUST NOT** be the sole dependency of a reproducible build.

## Conceptual models

A complete document may combine complementary models. Each answers a different question. None of them encode application business logic.

| Model | Question |
| --- | --- |
| Reference | Which evidence defines the expected result? |
| World | What exists and retains identity? |
| Scene | Where and how does a representation appear? |
| Component | Which reusable interface patterns are composed? |
| Semantic | What meaning and reading relationships are exposed? |
| Relationship | How do independently identified things relate? |
| Event | What occurred (activation, marker, gesture, …)? |
| Action | What visual response is requested? |
| State | Which visual condition is active? |
| Motion | How does appearance change during a transition? |
| Timeline | When do clips, markers, and sync events occur? |
| Accessibility | How must the result be named, focused, and operated? |
| Rendering | Under which targets and capabilities is output produced? |
| Validation | What evidence is needed to judge the result? |

These graphs can refer to the same object without being the same tree. A decorative background may exist in a scene and be absent from the semantic tree. An entity may appear in multiple scenes without becoming a new entity.

## Root document shape

A Visual Spec 1.0 document is a JSON object. It **MUST** set `visualSpec` to `"1.0"`, include `metadata`, and include a non-empty `profiles` array. When `$schema` is present, it **MUST** equal `https://visualspec.dev/schema/1.0/schema.json`. Unknown root properties **MUST NOT** be used outside `extensions`.

```json
{
  "$schema": "https://visualspec.dev/schema/1.0/schema.json",
  "visualSpec": "1.0",
  "metadata": { "title": "Hello Visual Spec" },
  "profiles": ["ui"],
  "scenes": [{
    "id": "scene.main",
    "kind": "2d",
    "nodes": [{
      "id": "node.title",
      "kind": "text",
      "text": "Hello Visual Spec"
    }]
  }]
}
```

Optional root properties defined by the schema (use only those that apply):

| Property | Role |
| --- | --- |
| `sources` | Addressable source resources |
| `visualReferences` | Evidence locators and roles |
| `visualReferenceSets` | Grouped evidence and conflict policies |
| `visualLanguage` | Global visual personality and principles |
| `tokens` | Design-token registry |
| `world` | World container |
| `entities` | Identifiable subjects |
| `relationships` | Graph edges between entities and other ids |
| `scenes` | Scene trees |
| `components` | Component definitions |
| `semantics` | Semantic tree nodes |
| `events`, `actions`, `states` | Interaction models |
| `motion`, `timelines` | Change over time |
| `assets` | Media and resource descriptors |
| `cameras`, `lights`, `materials`, `effects` | Imaging and 3D appearance |
| `compositions`, `illustrations`, `videos` | Media profile objects |
| `presentations`, `documents` | Paginated / slide structures |
| `threeD`, `game` | Profile-specific containers |
| `accessibility` | Document-level a11y contract |
| `rendering`, `platformOverrides` | Output targets and overrides |
| `validation` | Declared validation expectations |
| `extensions` | Namespaced extension payloads |

Not every document needs every area. A photograph may omit `components`. A UI screen may omit `cameras`. Profile selection imposes additional required properties (see Profiles).

The [generated reference](/reference/) lists every root property and every module definition, including enum values and numeric bounds. This specification states what those fields mean.

## Profiles

Official 1.0 profiles (**MUST** use these enum values when selected):

`ui` · `image` · `illustration` · `document` · `presentation` · `video` · `motion-graphics` · `3d` · `game`

Profiles specialize the shared core. A document **MAY** combine profiles. Shared ids, assets, references, and tokens remain one namespace. Profile combination **MUST NOT** introduce contradictory requirements for the same aspect without an explicit conflict policy.

Schema-enforced minimums when a profile is present:

| Profile | Required |
| --- | --- |
| `ui` | at least one `scenes` entry |
| `image` | `entities`, `scenes`, `cameras` (each min 1) |
| `illustration` | `illustrations`, `entities` (each min 1) |
| `document` | `documents` (min 1) |
| `presentation` | `presentations` (min 1) |
| `video` | `videos`, `timelines` (each min 1) |
| `motion-graphics` | `motion`, `scenes` (each min 1) |
| `3d` | `threeD`, `scenes`, `entities` (`scenes`/`entities` min 1) |
| `game` | `game` |

Details: [Media profiles](/specification/1.0/media/).

## Conformance levels

Three questions **MUST** remain distinct:

1. **Structural** - Does the JSON satisfy Draft 2020-12 schemas (types, required fields, enums, bounds)?
2. **Semantic** - Do ids resolve, graphs stay acyclic, intervals order correctly, and declared semantic rules hold? Validators **MUST NOT** fetch or execute reference targets to decide these checks.
3. **Runtime** - Does a particular implementation produce the required appearance, interaction, semantics, and motion under declared conditions?

Passing one level does not imply the next. Repository tooling reports structural and implemented semantic checks. A playground preview of a subset is not a runtime conformance certificate.

**Document conformance.** A conforming document declares version and profiles, satisfies applicable schemas, uses unique addressable ids matching `^[A-Za-z_][A-Za-z0-9_.:/-]*$`, resolves required internal references, and obeys normative semantic rules. It **MUST NOT** hide required behavior only inside an unrecognized optional extension.

**Implementation conformance.** An implementation declares the format version, profiles, modules, extensions, and operations it supports. Unsupported **required** capabilities are errors. Allowed approximations **MUST** be reported. Parsing a field does not implement its rendering behavior.

## What Visual Spec does not represent

Visual Spec **MUST NOT** encode:

- database schemas, HTTP APIs, authentication, authorization, billing,
- networking protocols, backend orchestration,
- business rules, gameplay formulas (damage, inventory, economy, win conditions),
- physics simulation as game logic, or application domain decisions.

Observable visual responses (for example, closing a dialog on activate) belong here. Computing loan eligibility or applying damage points does not.

## Versioning

- Pin documents to `visualSpec: "1.0"` and the versioned schema `$id`.
- Distinguish **document format version**, **implementation version** (validator/renderer), and **asset/reference version**.
- Editorial clarifications **MAY** improve prose without changing previously valid behavior.
- Normative changes, new profiles, and compatibility breaks require the [RFC process](/rfcs/).

## Specification pages

- [References](/specification/1.0/references/) - sources, assets, visual references, locators, sets, provenance, match modes
- [World](/specification/1.0/world/) - entities, environment, relationships, scenes, layout, appearance
- [Components](/specification/1.0/components/) - kinds, anatomy, states, semantics, accessibility
- [Behavior](/specification/1.0/behavior/) - events, actions, states, motion, timelines
- [Media](/specification/1.0/media/) - profile requirements for all nine profiles
- [Rendering](/specification/1.0/rendering/) - targets, capabilities, validation, extensions, rule codes
