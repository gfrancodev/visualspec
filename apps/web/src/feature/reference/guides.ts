export interface ModuleGuide {
  role: string;
  intro: string;
  useWhen: string;
  caution: string;
}

/** Plain-language introductions for each schema module. */
export const MODULE_GUIDES: Record<string, ModuleGuide> = {
  common: {
    role: "Shared vocabulary",
    intro:
      "Almost every other module borrows from Common. It does not describe a screen, a shot, or a scene. It describes the small reusable values those things are built from: identifiers, times, sizes, colors-as-tokens, evidence, and the metadata of the document itself.",
    useWhen:
      "You need a stable id, a duration, a length, a point in space, a condition, or a record of where a value came from. If two modules would otherwise invent their own spelling for “an id” or “two seconds”, they use a definition from here instead.",
    caution:
      "An id names something inside this document. It is not a CSS selector, a file path, or a URL. References resolve locally. Nothing in Common is allowed to fetch the network.",
  },
  references: {
    role: "Evidence",
    intro:
      "A reference points at the evidence behind a visual decision: a region of an image, a moment in a video, a node in a design file, a page in a PDF. The reference says what to look at and which aspects it constrains. It does not paste the asset into the document and it does not override an explicit requirement by itself.",
    useWhen:
      "Someone needs to know why a color, a crop, a type style, or a motion exists. Record the source, how to find the exact part, and what that part is allowed to decide.",
    caution:
      "A reference is not executable content. Tools must not treat a URL or a selector as instructions to run.",
  },
  appearance: {
    role: "How it looks",
    intro:
      "Appearance is the visual surface: color, paint, stroke, shadow, type, and filters. It describes what a person sees, not which CSS property or which renderer produced it.",
    useWhen:
      "You are specifying fill, stroke, type, shadow, or a filter and you want every adapter to read the same intent.",
    caution:
      "Prefer a token reference when the value belongs to a design system. A raw color is a decision; a token is a decision you can change in one place.",
  },
  tokens: {
    role: "Named decisions",
    intro:
      "Tokens name reusable visual decisions: a brand color, a type ramp, a radius, a duration. Modes (light, dark, compact) can change the value without changing the name. Aliases point at other tokens. Cycles are invalid and are caught by semantic validation, not by the shape alone.",
    useWhen: "The same decision should survive a theme change or be shared by many components.",
    caution: "A token is data. It is not a CSS variable until an adapter maps it.",
  },
  layout: {
    role: "Where things sit",
    intro:
      "Layout places content without choosing a framework. It covers insets, constraints, flow, and rules that change when the viewport changes. The same document can describe a column on a phone and a row on a desk.",
    useWhen:
      "Position, spacing, alignment, or a responsive change is part of the contract, not an accident of one implementation.",
    caution:
      "Layout does not encode product logic. “Show the pay button when the form is valid” belongs to interaction and state, not to a media query.",
  },
  geometry: {
    role: "Shape and space",
    intro:
      "Geometry describes shapes and how they are placed in space: rectangles, paths, and transforms. Coordinates follow the convention recorded on the value, so a point means the same thing in a UI, an illustration, and a 3D view.",
    useWhen:
      "You need an explicit shape, path, or transform instead of implying it from a picture.",
    caution:
      "A transform is a list of operations. Order matters. Do not collapse it into a single mystery matrix unless that is the source of truth.",
  },
  accessibility: {
    role: "How it is operated",
    intro:
      "Accessibility records the name, role, focus, and relationships a person needs in order to understand and operate the result. The contract is native-first: platform semantics come before ARIA, and ARIA is an explicit mapping when the web is the target.",
    useWhen:
      "The visual result must be named, focused, or related to another control. If a sighted person can see the relationship, a non-visual user must get it from this module.",
    caution:
      "Do not hide meaning that only exists in pixels. A button that looks like a button still needs a name.",
  },
  components: {
    role: "Reusable interface patterns",
    intro:
      "A component is a pattern with a meaning: a button, a dialog, a tab list. The definition describes anatomy (the named parts), variants, and behavior. An instance places that pattern in a scene. The kind is not a React component and not a Swift view.",
    useWhen:
      "The same interface pattern appears more than once, or its behavior and parts need to stay stable across platforms.",
    caution:
      "Platform mappings in the catalog are design guidance. This release does not ship those adapters.",
  },
  semantics: {
    role: "Meaning, separate from pixels",
    intro:
      "The semantic tree says what something means and how it should be read. It is not the scene tree. A decorative shape can exist in the scene and be absent here. A heading can be a heading even when it is drawn as a path.",
    useWhen: "Reading order, role, or grouping would be lost if you only stored rectangles.",
    caution:
      "Do not mirror every visual node into the semantic tree. Only what carries meaning belongs here.",
  },
  interaction: {
    role: "What happened, and what should change visually",
    intro:
      "Interaction records observable events (a press, a hover, a marker), the visual action they request, and the states a thing can be in. It does not contain business logic, network calls, or application code.",
    useWhen: "A visual response depends on an event or on being in a named state.",
    caution:
      "“Submit the order” is application behavior. “Show the pressed appearance” is a visual action. Only the second belongs here.",
  },
  motion: {
    role: "How appearance changes over time",
    intro:
      "Motion describes a change: keyframes, springs, paths, and shared elements. Durations and easing are part of the contract. Reduced-motion preferences are a requirement, not a suggestion to ignore later.",
    useWhen:
      "Something moves, fades, springs, or follows a path, and that movement is part of the intended result.",
    caution:
      "Motion is not a timeline of media clips. Clips, markers, and editorial cuts live in Timeline.",
  },
  timeline: {
    role: "When clips and markers occur",
    intro:
      "A timeline places clips on tracks, marks moments, and describes transitions between them. It is the editorial clock: what is on screen at a given time, and how one shot hands off to the next.",
    useWhen:
      "You are describing video, a narrated deck, or any sequence whose meaning depends on time.",
    caution:
      "A marker is a point in time you can refer to. It is not an animation keyframe. Keyframes live in Motion.",
  },
  assets: {
    role: "Files the output uses",
    intro:
      "An asset is a resource the output needs: an image file, a font, a model, a clip. It is not the same as a reference. A reference is evidence of intent. An asset is something the renderer is allowed to use.",
    useWhen: "The result embeds or links a concrete resource.",
    caution:
      "Owning a file is not the same as having the right to use it. Record the resource. Do not pretend the schema transfers rights.",
  },
  camera: {
    role: "How the scene is seen",
    intro:
      "Camera records the optical and compositional intent: where the viewer stands, how wide the view is, and what the lens is trying to do. The same idea covers a photograph and a realtime 3D view.",
    useWhen:
      "Framing, lens, or viewpoint is part of the result rather than a default the tool happened to use.",
    caution:
      "A camera does not create the subject. The subject lives in the world or the scene. The camera only decides how it is seen.",
  },
  lighting: {
    role: "How the scene is lit",
    intro:
      "Lighting records lights, environment illumination, and shadow intent. A light can be described physically or as an intention (“soft key from the left”) when the exact fixture is not the point.",
    useWhen:
      "The light setup changes the meaning of the image and must survive a different renderer.",
    caution:
      "Do not hide a required light inside a baked image if another profile still needs to relight the scene.",
  },
  materials: {
    role: "What a surface is made of",
    intro:
      "Materials describe surface intent: base color, roughness, metalness, and the textures bound to those roles. The goal is a shared idea of the surface, not a dump of one engine’s shader graph.",
    useWhen: "A 3D or product surface has to look like a specific material in more than one tool.",
    caution: "A texture is a binding to an asset plus a role. The image file itself is an asset.",
  },
  effects: {
    role: "Effects and post",
    intro:
      "Effects cover reusable visual treatments: particles, blurs, grades, and other post-processing intent. They say what the treatment is for, not which plugin must run.",
    useWhen: "A look depends on an effect that is not just paint on a single shape.",
    caution:
      "If an effect is required for conformance, say so. An adapter that cannot produce it must report that, not silently drop it.",
  },
  world: {
    role: "What exists",
    intro:
      "The world answers “what is this thing?” independently of one picture of it. An entity keeps its identity when it appears in another scene. Environments, representations, and relationships live here.",
    useWhen:
      "The same cup, character, or product must stay the same object across views, shots, or UI states.",
    caution:
      "A scene shows an entity. It does not create a second entity. If you only have a drawing and no lasting identity, you may only need a scene.",
  },
  scene: {
    role: "What is shown",
    intro:
      "A scene is one renderable arrangement: the nodes you would see in a given view, their content, and links back to semantics, entities, and components. A document can have many scenes.",
    useWhen:
      "You are describing a specific composition: a screen, a slide frame, a shot, or a 3D view.",
    caution:
      "Do not store identity only on the scene node. If the thing must survive the next scene, give it an entity in World.",
  },
  media: {
    role: "Pictures, illustration, and moving images",
    intro:
      "Media specializes the shared core for still images, illustration, captions, shots, video projects, and charts. It adds the words those profiles need without inventing a second document format.",
    useWhen:
      "The profile is image, illustration, video, or a chart, and the generic scene fields are not specific enough.",
    caution:
      "A chart is a visual claim about data. Record the mapping. Do not leave the reader to guess which bar means which value.",
  },
  presentation: {
    role: "Slides",
    intro:
      "Presentation describes a deck: masters, slides, the order of the story, speaker notes, and the timeline of a single slide. A slide is not a screenshot of a slide tool. It is the contract for that frame.",
    useWhen: "The artifact is a deck, including a deck that is also narrated or filmed.",
    caution:
      "Notes for the speaker are not content for the audience. Keep them in the field meant for notes.",
  },
  document: {
    role: "Pages you read",
    intro:
      "Document describes pages, sections, figures, notes, and pagination. Reading order and page structure matter more than a single viewport. A page is a sheet with a job, not a long screenshot.",
    useWhen: "The artifact is a PDF, a report, a spec, or any paginated reading experience.",
    caution: "Reading order is explicit. Visual position on the page is not a substitute for it.",
  },
  "three-d": {
    role: "Spatial models",
    intro:
      "This module adds 3D structure the shared scene does not carry alone: meshes, skeletons, skinning, rigs, levels of detail, and morph targets. It is intent for a spatial object, not a private scene-graph dump.",
    useWhen: "The profile is 3d, or a UI embeds a 3D product that has real geometry.",
    caution:
      "Level of detail is a declared alternative, not an excuse to drop a required silhouette.",
  },
  game: {
    role: "Visual state of a game",
    intro:
      "Game describes what the player sees: levels, characters as visual entities, HUD, spatial UI, and cutscenes. It does not describe rules, scoring code, or networking.",
    useWhen:
      "You need the visual contract of a game view: the HUD, the space, and how visual state is shown.",
    caution:
      "Gameplay rules stay outside the document. If a rule changes pixels, record the visual state, not the rule engine.",
  },
  rendering: {
    role: "What the output must support",
    intro:
      "Rendering states the targets, capabilities, fallbacks, and overrides. An adapter compares this list with what it can actually do. Missing a required capability is a reported gap, not a quiet substitution.",
    useWhen: "You need to say which platforms, features, or fidelity levels the result depends on.",
    caution: "A fallback must say what it changes. “Close enough” is not a fallback.",
  },
  validation: {
    role: "How to judge the result",
    intro:
      "Validation records what “correct” means: structural checks, semantic checks, accessibility checks, visual tolerances, and reference comparisons. It turns “looks right” into evidence someone else can rerun.",
    useWhen: "A later review has to decide whether an implementation matched the document.",
    caution:
      "JSON Schema checks shape. This module records the extra expectations schema cannot express, including how much visual difference is acceptable.",
  },
};
