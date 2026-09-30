# Media profiles

Profiles specialize the shared core for a kind of visual artifact. Select by artifact, not by technology stack. Combined profiles share one id space. Adapters **MUST** disclose which profile capabilities they support.

Schema-enforced required properties for each profile are restated below. Additional fields are optional unless a nested schema marks them required.

## UI

**Required:** at least one entry in `scenes`.

Primary concern: components, responsive layout, semantics, interaction, and accessibility. Typical root companions: `components`, `semantics`, `events`, `actions`, `states`, `tokens`, `visualLanguage`, `accessibility`.

Scene nodes place text, shapes, and component instances. UI documents **SHOULD** keep keyboard and focus contracts with interactive components. Business workflows behind a button are out of scope; visual activation and state changes are in scope.

```json
{
  "profiles": ["ui"],
  "scenes": [{
    "id": "scene.main",
    "kind": "2d",
    "nodes": [{
      "id": "node.button",
      "kind": "component",
      "componentRef": "component.primary-button",
      "text": "Continue"
    }]
  }]
}
```

## Image

**Required:** `entities` (≥ 1), `scenes` (≥ 1), `cameras` (≥ 1).

Primary concern: subject identity, composition, lighting, and still-image appearance. Documents **MAY** include `lights`, `visualReferences`, materials-like appearance on entities, and rendering targets.

Cameras describe photographic intent (`type`, framing, focal length, aperture, and related fields). Lights describe key/fill/rim roles and intensity. Validators **MUST NOT** fetch reference images to decide structural validity.

## Illustration

**Required:** `illustrations` (≥ 1), `entities` (≥ 1).

Primary concern: shape language, graphic style, and vector or raster representation. `illustrations[]` bind style and geometry intent to entities and scenes. Tokens and visual language **MAY** encode shared radii, strokes, and color systems. Appearance and graphics modules describe fills, strokes, and composition without requiring a specific illustration tool.

## Document

**Required:** `documents` (≥ 1).

Primary concern: paginated structure, typography, reading order, and accessibility relationships. A document object lists `pages` with `number`, optional `size`, and `sceneRef` for visual layout. Semantics **SHOULD** express headings and reading order when assistive access matters. Pagination and page size are visual/structural; document workflow engines and CMS schemas are out of scope.

## Presentation

**Required:** `presentations` (≥ 1).

Primary concern: slide sequence, masters/repeated structure, visual hierarchy, and transitions. Presentations reference scenes per slide and **MAY** use `timelines` for timed builds. Accessibility contracts apply to readable slide content. Presentation software APIs are adapter concerns.

## Video

**Required:** `videos` (≥ 1), `timelines` (≥ 1).

Primary concern: shots, temporal composition, camera intent, grading cues, and audio-visual synchronization. A video object **MAY** list `shots` with `sceneRef`, `start`, and `duration`, and link `timelineRef`. Cameras and lights belong when framing and illumination are part of intent. Timelines host picture, audio, caption, camera, and effect tracks.

Clip and interval ordering **MUST** satisfy `VS-TIME-001`.

## Motion graphics

**Required:** `motion` (≥ 1), `scenes` (≥ 1).

Primary concern: animated graphics, typography, and temporal composition. Motion entries and optional timelines coordinate fades, paths, morphs, and staggered reveals. Reduced-motion alternatives **SHOULD** be declared when motion carries emphasis rather than information.

## 3D

**Required:** `threeD`, `scenes` (≥ 1), `entities` (≥ 1).

Primary concern: spatial entities, geometry, materials, lights, and cameras. `threeD` may list meshes, scene refs, and related spatial data. `materials[]` describe surface models (for example `pbr-metallic-roughness` with `baseColor`, `roughness`, `metalness`). `lights[]` and `cameras[]` define illumination and viewpoint. Scene nodes bind `entityRef` and `materialRef`.

```json
{
  "profiles": ["3d"],
  "entities": [{ "id": "entity.cup", "kind": "object.product", "name": "Ceramic cup" }],
  "materials": [{
    "id": "material.ceramic",
    "model": "pbr-metallic-roughness",
    "baseColor": "#f4f1ea",
    "roughness": 0.45,
    "metalness": 0
  }],
  "threeD": {
    "sceneRefs": ["scene.product"],
    "meshes": [{
      "id": "mesh.cup",
      "geometry": { "type": "cylinder" },
      "materialRefs": ["material.ceramic"]
    }]
  },
  "scenes": [{
    "id": "scene.product",
    "kind": "3d",
    "nodes": [{
      "id": "node.cup",
      "kind": "mesh",
      "entityRef": "entity.cup",
      "materialRef": "material.ceramic"
    }]
  }]
}
```

glTF/USD export is an adapter concern. Visual Spec describes intent; it does not replace those formats.

## Game

**Required:** `game`.

Primary concern: **visual state only** - levels and scene bindings, HUD, character animation mapping, VFX, spatial UI, and cutscenes.

The game profile **MUST NOT** encode damage formulas, inventory systems, economy, networking, matchmaking, or win/loss conditions. External gameplay systems emit state and events; Visual Spec maps those to appearance, motion, effects, and UI.

Typical `game` contents:

- `worldRef`, `levels[]` with `sceneRefs`
- `characters[]` with `entityRef`, optional animation controller and `visualStateMappings`
- `hud` (scene binding, safe area)
- spatial UI modes (`world-space`, `screen-space`, `anchored`, `entity-attached`)
- cutscene timeline refs and effect refs

Cameras, lights, and materials **MAY** be used as in the 3D profile when the game view is spatial. HUD and spatial UI **MAY** reuse UI components for controls that remain visual/semantic, not systemic.

```json
{
  "profiles": ["game"],
  "game": {
    "worldRef": "world.grove",
    "levels": [{ "id": "level.grove", "sceneRefs": ["scene.grove"] }],
    "characters": [{ "id": "character.guide", "entityRef": "entity.guide" }],
    "hud": { "sceneRef": "scene.grove", "safeArea": true }
  }
}
```

A mapping such as “damaged → red flash + limp animation” is in scope. Computing hit points is not.
