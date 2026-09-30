# World

The world model answers **what exists** and how identity survives changes of viewpoint, media, and representation.

## Entities

`entities[]` entries **MUST** include `id` and `kind`. `kind` is an open taxonomy string (for example `living.person`, `object.product`, `object.vehicle.car`, `environment.landscape`). The core does not enumerate every industrial object; organization-specific kinds **MAY** use namespaced forms such as `x-acme.instrument-panel`.

Entities **MAY** declare:

- `name`, `role`
- `geometry`, `transform`, `appearance`
- `representation` or `representations[]` (types: `image`, `video`, `vector`, `3d`, `illustration`, `generated`, `ui`, `text`, `procedural`)
- `visibility` (`visible`, `occluded`, `opacity`, `layers`)
- `presence` (`from`, `to`, `condition`, `sceneRefs`)
- `lifecycle`, parts, and relationship lists as defined by the world schema
- `referenceRefs` linking evidence

Example:

```json
{
  "id": "entity.cup",
  "kind": "object.product",
  "name": "Ceramic cup",
  "appearance": { "fill": "#f4f1ea" }
}
```

## Lifecycle and presence

Lifecycle describes whether an entity is persistent, ephemeral, generated, procedural, tracked, or conditional, as declared on the entity. Presence intervals (`from` / `to`) describe when an entity participates in an experience.

Presence is not opacity. A fully transparent object can still exist, participate in relationships, and require explicit treatment in interaction or semantics. Omitting a representation **MUST NOT** erase the entity’s identity from the document.

## Identity versus representation

**Identity** is what a thing is across scenes and media. **Representation** is how it is made visible in a particular context. A product photograph and a product mesh **MAY** share one entity id. Switching representations **SHOULD** preserve reference relationships and semantic identity.

A missing or unsupported representation is a capability concern for the adapter. It **MUST NOT** be reported as “entity does not exist” when the entity object remains in the document.

## Environment

`world` and nested environment objects describe surroundings: layered entity refs (`foreground`, `midground`, `background`), `sky`, `terrain`, `weather`, `timeOfDay`, `season`, fog/haze, and linked lights or effects. Environment kinds are open taxonomy. Environments can contain many entities and still carry their own properties.

## Relationships

`relationships[]` capture facts that **MUST NOT** be forced into a single containment tree: attached-to, looking-at, inside, following, owns, and other declared relationship kinds. Each relationship is an addressable edge between document ids. Circular part / parent graphs are forbidden by semantic rule `VS-GRAPH-001`.

## Scenes

`scenes[]` describe a **view** of the world: which representations appear and how they are arranged. A scene **MUST** have `id` and `kind` (for example `2d` or `3d`). Nodes form a tree via `children`. Nodes **MAY** bind `entityRef`, `componentRef`, `semanticRef`, `assetRef`, `materialRef`, and `instanceOf`.

```json
{
  "id": "scene.still",
  "kind": "2d",
  "cameraRef": "camera.main",
  "entityRefs": ["entity.cup"],
  "nodes": [{
    "id": "node.cup",
    "kind": "image",
    "entityRef": "entity.cup"
  }]
}
```

An entity **MAY** appear in more than one scene. Scene trees are for placement and parent-relative transforms; relationship graphs hold other facts.

## Coordinate spaces

Transforms, paths, and scene coordinates **MUST** use the coordinate space declared by the producer (`coordinateSpace` where the schema provides it). Adapters **MUST NOT** silently reinterpret units or handedness. When converting between 2D layout space and 3D world space, the conversion **MUST** be explicit in the adapter report.

## Layout, responsive, and adaptive behavior

Nodes and components **MAY** carry `layout` (constraints, flex/grid-like arrangement as modeled by the layout schema) and `responsive` alternatives. Responsive rules select alternatives by viewport or other declared conditions. Adaptive alternatives **MAY** substitute structure while preserving semantic identity and accessibility contracts.

Authors **SHOULD** express requirements (spacing, alignment, stacking) rather than framework-specific layout engines. An adapter **MAY** implement the same visual arrangement with different layout primitives if the declared constraints and semantics are satisfied.

## Tokens

`tokens` is a map. Each name matches `^[A-Za-z_][A-Za-z0-9_.-]*$` and each value **MUST** include `value`. `type` **SHOULD** be one of `color`, `dimension`, `spacing`, `radius`, `border`, `shadow`, `typography`, `font`, `gradient`, `opacity`, `duration`, `easing`, `motion`, `material`, `breakpoint`, `z-index`, `number`, or `string`.

A brace reference such as `"{color.brand}"` **MUST** name a token in the same document (`VS-TOKEN-002`). Alias graphs **MUST** be acyclic (`VS-TOKEN-001`). Modes **MAY** carry alternate values; consumers **MUST** say which mode they resolved. External token files **MAY** be cited from `visualLanguage.externalTokens` without being fetched during structural validation.

`visualLanguage` records personality, principles, density (`compact`, `comfortable`, `spacious`), geometry, and shared palettes. Principles guide unspecified cases. They **MUST NOT** override an explicit property on the instance they describe.

## Layout contract

`layout.type` **MUST** be one of `stack`, `row`, `column`, `grid`, `overlay`, `flow`, `absolute`, or `constraint-based` when `type` is present. Sizes accept a number, a unit string (`px`, `%`, `rem`, `em`, `pt`, `mm`, `cm`, `in`, `vw`, `vh`, `m`), a keyword (`auto`, `fill`, `hug`, `min-content`, `max-content`), or a token reference.

Alignment uses `start`, `end`, `center`, `stretch`, and `baseline` where the schema lists them. Distribution uses `start`, `end`, `center`, `space-between`, `space-around`, and `space-evenly`. Constraints name an attribute (`left`, `right`, `top`, `bottom`, `width`, `height`, `center-x`, `center-y`, `baseline`, `aspect-ratio`), a relation, and an optional target.

`responsive.strategy` is `responsive` or `adaptive`. Each rule **MUST** include `when`. Queries **MAY** test viewport size, orientation, input modality, window class, platform, and capabilities. An adaptive rule **MAY** swap visibility or a component reference. It **MUST NOT** drop an accessible name or a required keyboard behavior that the base component declares.

## Appearance and geometry

`appearance` describes fill, color, opacity, radius, effects, and related visual attributes (including token references such as `"{color.brand}"`). `geometry` describes shape and measurable structure. Tokens and visual language supply shared vocabulary; concrete node or entity values remain authoritative for that instance when both are present, unless a documented override order says otherwise.

See [Components](/specification/1.0/components/) for reusable interface patterns placed into scenes, and [Media](/specification/1.0/media/) for profile-specific world usage.
