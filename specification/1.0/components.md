# Components

Component kinds identify **interface concepts**, not framework widgets. `action.button` means a pressable action pattern with a name and activation behavior. It does not choose React, SwiftUI, or Compose.

Platform mappings in the public component catalog and in `mappings` fields are **informative design guidance**. This project does **not** ship production platform adapters for those hints. An adapter author **MUST** verify target contracts before claiming equivalence.

## Kinds versus widgets

Classify by behavior first. A modal dialog, non-modal popover, and context menu may share a surface style while requiring different focus, keyboard, and dismissal rules. Same-named platform widgets are not always equivalent (for example, a platform “tab bar” may mean top-level navigation rather than `navigation.tabs` selection).

Common registry kinds include `action.button`, `action.link`, `input.*`, `navigation.*`, `overlay.*`, `feedback.toast`, `data.table`, and `container.card`. Taxonomy is extensible.

## Anatomy and slots

Anatomy makes composition explicit. Slots name parts such as `label`, `icon`, `backdrop`, `title`, `content`, or `actions`. A slot **MAY** declare `required`, `semanticRole`, `allowedKinds`, and nested states.

```json
{
  "id": "component.primary-button",
  "kind": "action.button",
  "name": "Primary button",
  "anatomy": {
    "slots": {
      "label": { "semanticRole": "text", "required": true }
    }
  }
}
```

## Definition versus instance

A **definition** in `components[]` declares a reusable contract (kind, anatomy, states, appearance, accessibility, behavior). A scene **instance** references it with `componentRef` and supplies instance content (for example `text`) or permitted overrides. Multiple instances share the definition without sharing runtime state unless the document models that sharing explicitly.

Variants (primary, secondary, destructive) change appearance; they **MUST NOT** remove underlying action or input semantics.

## States

Component `states` list visually meaningful conditions such as `default`, `hover`, `focus-visible`, `pressed`, `disabled`, `selected`, `open`, or `checked`. Document-level `states[]` objects can attach appearance overrides to targets. State transitions **MUST** target a declared state (`VS-STATE-001`).

## Semantic tree

`semantics[]` describes meaning and reading relationships independently of pixel layout. A semantic node **MAY** reference `nodeRef` and `componentRef`, declare `role`, and supply an accessible `name`. Decorative scene nodes **SHOULD NOT** automatically become assistive-technology objects.

```json
{
  "id": "sem.button",
  "role": "button",
  "name": { "source": "content", "value": "Continue" },
  "nodeRef": "node.button",
  "componentRef": "component.primary-button"
}
```

## Accessibility contract

Interactive components **SHOULD** define role, accessible name, states, properties, relationships, focus behavior, and keyboard activation. Name sources include `content`, `literal`, `reference`, and `derived`. Referenced labels **MUST** resolve inside the document for semantic validation.

Focus fields include `strategy` (`natural`, `roving`, `active-descendant`, `programmatic`, `none`), `trap`, `restore` / `restoreOnClose`, `initial`, and `order`. Overlay `behavior` may declare modality and dismiss mechanisms (`escape`, `backdrop`, `outside-press`, `close-button`, …).

### Informative ARIA / native-first mapping

On the web, adapters **SHOULD** prefer a native HTML element when it provides the required semantics and behavior, then add valid ARIA only where necessary. Visual Spec’s platform-independent contract does not remove the adapter’s obligation to obey target platform rules (see WAI-ARIA and APG). Mappings such as “HTML `button`”, “SwiftUI `Button`”, or “Compose `Button`” are starting points, not shipped adapters.

Document-level `accessibility` **MAY** declare reading order, announcements, and preference handling (contrast, text scaling, reduced motion). Accessibility conformance requires runtime observation of the rendered target; a declared role or a passing schema check is insufficient.

## Pattern requirements

These requirements apply when a document uses the named kind. The [component catalog](/components) records anatomy, states, and informative platform hints. The hints are not shipped adapters.

**`overlay.dialog`.** A modal dialog **MUST** name its surface, declare an accessible name, and state initial focus, focus containment while open, a dismissal mechanism (`escape`, backdrop, or an explicit close control), and focus restoration on close. `behavior.modal` and `behavior.modality` record modality. Dismissal **MUST NOT** depend on pointer position alone.

**`navigation.tabs`.** Tabs select among panels. The tab list, tabs, and panels are separate slots. Selection is not activation of a link. Keyboard behavior **MUST** match the declared `orientation` and `activation` (`automatic` or `manual`). A platform tab bar that switches top-level destinations is a different kind.

**`input.combobox`.** A combobox keeps an editable text field and exposes a popup with a list of options. The accessible name, expanded state, and active option **MUST** be representable. Mapping it to a plain text field drops the popup contract.

**`action.button`.** Enter and Space activate the control. An icon-only button still **MUST** have an accessible name. Disabled **MUST** block activation. Loading **MUST NOT** be conveyed by color alone.

## Where to read the fields

Every property, enum, and numeric bound is listed in the [generated reference](/reference/). This chapter states what those fields mean. If the reference and this text disagree about a value’s meaning, this text wins. If they disagree about which values the schema accepts, the schema wins and the disagreement is a specification defect.

See [Behavior](/specification/1.0/behavior/) for events, actions, and motion tied to components.
