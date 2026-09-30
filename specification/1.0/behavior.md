# Behavior

Behavior separates **what happened**, **what visual response is requested**, and **which condition is active**. Motion and timelines describe **how** and **when** the result changes. None of these models execute business logic, billing, networking, auth, or gameplay formulas.

## Events versus actions versus states

| Model | Role |
| --- | --- |
| Event | Records an occurrence (`type`, optional `targetRef`, gesture, key, marker, external name) |
| Action | Requests a visual response (`verb`, targets, optional motion/state links, composition) |
| State | Records a visual condition on a target (`name`, `targetRef`, optional appearance) |

```text
activate → open drawer → opening → open
                       ↳ translate + fade
```

```json
{
  "id": "event.press",
  "type": "activate",
  "targetRef": "node.button"
}
```

Events **MAY** list `actionRefs`. Actions **MUST** include `id` and `verb`. Actions **MAY** compose with `composition`: `sequence`, `parallel`, `conditional`, or `stagger`, and chain via `actionRefs`, `onComplete`, and `onCancel`.

Parameters are limited to visual/spatial values (`value`, `position`, `angle`, `scale`, `time`, `destination`, `materialRef`, `duration`, `property`, `visible`). An action **MUST NOT** encode HTTP calls, SQL, payment calculation, or damage computation.

## Action graph

The action graph is declarative. Cycles that make a required settled state unreachable **SHOULD** be avoided; adapters **MUST** report cancellation and interruption outcomes. Application systems supply domain state; Visual Spec describes its visible expression.

## States and transitions

Document `states[]` attach named conditions to targets. Transitions referenced from states or game animation controllers **MUST** target a declared state (`VS-STATE-001`). A state can remain valid when reduced-motion preferences skip entrance animation: final condition and motion are distinct layers.

## Motion

`motion[]` entries describe temporal visual change. An animation **MUST** have `id`. It **MAY** declare `kind` (`property`, `spring`, `path`, `morph`, `layout`, `shared-element`, `sequence`, `parallel`, `stagger`), `targets`, `tracks`, timing, easing, springs, paths, shared elements, interruption policy, and reduced-motion alternatives.

### Keyframes and tracks

A track identifies an animatable property path (for example `appearance.opacity` or `transform.translate`) and **MAY** use `from`/`to` or `keyframes` (min 2). Interpolation depends on value type and coordinate space. Adapters **MUST NOT** invent units from numeric magnitude alone; prefer explicit duration strings such as `"800ms"` when units matter.

### Easing and springs

Easing **MAY** be `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, a cubic-bezier object, or steps. Springs **MUST** include `mass`, `stiffness`, and `damping` when the spring object is used. Platforms that cannot reproduce a spring exactly **MAY** approximate only when permitted by the rendering contract and **MUST** disclose the substitution.

### Paths, morphing, shared elements

Path motion follows `path.data` or `pathRef`. Morphing connects `fromPath` / `toPath`. Shared-element transitions **MUST** name `entityRef`, `fromNodeRef`, and `toNodeRef`, and **MAY** preserve position, size, shape, opacity, color, or content.

### Interruption and reduced motion

`interrupt` **MAY** be `cancel`, `finish`, `retarget`, `queue`, or `ignore`. `cancel` aftermath **MAY** be `restore`, `freeze`, or `finish`. Infinite animations **SHOULD** define a cancellation path. A state **MUST NOT** become unreachable solely because motion was interrupted.

`reducedMotion.strategy` **MAY** be `instant`, `fade`, `reduce`, `substitute`, or `none`. Reduced motion **MUST** preserve information and the intended settled state while reducing unnecessary movement.

```json
{
  "id": "motion.fade",
  "targets": ["node.title"],
  "duration": "800ms",
  "tracks": [{
    "property": "appearance.opacity",
    "from": 0,
    "to": 1
  }],
  "reducedMotion": {
    "strategy": "fade",
    "duration": "1ms"
  }
}
```

Drivers (`trigger`) include `event`, `state-transition`, `gesture`, `scroll`, `timeline`, `viewport`, `visibility`, `media-playback`, and `external-progress`.

## Units, order and choreography

A time value **MAY** be a nonnegative number of seconds, an `ms` / `s` / `f` string, or `{ "value", "unit" }`. New documents **SHOULD** use the object form so a bare `240` is not guessed to be milliseconds. Delay **MAY** be negative. `timing` carries `duration`, `delay`, `endDelay`, `iterations`, `iterationStart`, `direction`, `fill` and `playbackRate`.

A keyframe **MUST** include `offset` in `[0, 1]` and either `value` or `values`. Offsets on one track **MUST** be non-decreasing (`VS-MOTION-002`). `values` maps several properties at one offset. An easing **MAY** be a keyword, cubic Bézier (`x1` and `x2` in `[0, 1]`), linear points, steps, or a spring.

Transforms **MAY** be a single object or an ordered list of `translate`, `scale`, `rotate`, `skew` and `perspective` steps. Consumers **MUST** apply list order as written. Springs **MAY** retarget with `interrupt.preserveVelocity`. Decay uses `velocity` and `deceleration` and **MUST NOT** be given a fake fixed duration.

`children` on a motion step form a choreography tree: `sequence`, `parallel`, `stagger` or `wait`. A reproducible random stagger **MUST** set `seed`.

Non-essential motion **MUST** declare `reducedMotion` (`VS-MOTION-001`). The alternative **MUST** preserve the information and the settled state. Strategies include `disable`, `replace`, `shorten`, `instant`, `fade`, `reduce` and `substitute`. When the platform exposes a reduced-motion preference, an implementation **MUST** honor it.

## Timelines

`timelines[]` schedule tracks, clips, and markers. Timed intervals **MUST** end at or after they start. Clips **MUST** fit their timeline and **MUST NOT** overlap on the same track (`VS-TIME-001`).

Track `type` values include `visual`, `video`, `audio`, `motion`, `action`, `camera`, `lighting`, `entity`, `effect`, `caption`, and `subtitle`. Clips **MUST** include `id`, `start`, and `duration`, and **MAY** reference scenes, assets, entities, motion, actions, cameras, lights, or effects.

Markers **MUST** include `id` and `time`, and **MAY** fire `actionRefs`. Timelines coordinate typography, camera movement, scene changes, and audio-visual cues without embedding domain logic.

```json
{
  "id": "timeline.main",
  "duration": 4,
  "fps": 24,
  "tracks": [{
    "id": "track.picture",
    "type": "visual",
    "clips": [{
      "id": "clip.hold",
      "start": 0,
      "duration": 4,
      "sceneRef": "scene.shot"
    }]
  }]
}
```

See [Media](/specification/1.0/media/) for profile-specific timeline and motion requirements, and [Rendering](/specification/1.0/rendering/) for capability and validation rules.
