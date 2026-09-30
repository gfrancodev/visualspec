import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDocument } from "../packages/validator/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = JSON.parse(
  readFileSync(join(root, "packages/schema/schema/1.0/schema.bundle.json"), "utf8"),
);
const hello = JSON.parse(readFileSync(join(root, "packages/schema/examples/hello.json"), "utf8"));
const video = JSON.parse(readFileSync(join(root, "packages/schema/examples/video.json"), "utf8"));

/** @param {unknown} value */
function clone(value) {
  return structuredClone(value);
}

/** @param {{ errors: Array<{ code: string }> }} result @param {string} code */
function hasCode(result, code) {
  return result.errors.some((e) => e.code === code);
}

describe("semantic validation", () => {
  it("reports VS-ID-001 for duplicate ids", () => {
    const doc = clone(hello);
    doc.scenes[0].nodes.push({
      id: "node.title",
      kind: "text",
      text: "Duplicate",
    });
    const result = validateDocument(doc, bundle);
    assert.equal(result.valid, false);
    assert.equal(hasCode(result, "VS-ID-001"), true);
  });

  it("reports VS-REF-001 for dangling componentRef", () => {
    const doc = clone(hello);
    doc.scenes[0].nodes[0].kind = "component";
    doc.scenes[0].nodes[0].componentRef = "component.missing";
    delete doc.scenes[0].nodes[0].text;
    const result = validateDocument(doc, bundle);
    assert.equal(result.valid, false);
    assert.equal(hasCode(result, "VS-REF-001"), true);
    const refErr = result.errors.find((e) => e.code === "VS-REF-001");
    assert.match(refErr.message, /Unresolved reference "component\.missing"/);
  });

  it("reports VS-TOKEN-001 for token alias cycles", () => {
    const doc = clone(hello);
    doc.tokens = {
      a: { type: "string", value: "{b}" },
      b: { type: "string", value: "{a}" },
    };
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-TOKEN-001"), true);
    assert.equal(
      result.errors.filter((e) => e.code === "VS-TOKEN-001").length,
      1,
    );
    // Prefer schema-valid so the cycle is the semantic focus
    assert.equal(hasCode(result, "VS-SCHEMA"), false, JSON.stringify(result.errors));
  });

  it("reports VS-TOKEN-002 for unresolved brace token refs", () => {
    const doc = clone(hello);
    doc.scenes[0].nodes[0].text = "{color.missing}";
    const result = validateDocument(doc, bundle);
    assert.equal(result.valid, false);
    assert.equal(hasCode(result, "VS-TOKEN-002"), true);
  });

  it("reports VS-TIME-001 for overlapping clips", () => {
    const doc = clone(video);
    doc.timelines[0].tracks[0].clips = [
      {
        id: "clip.a",
        start: 0,
        duration: 3,
        sceneRef: "scene.shot",
      },
      {
        id: "clip.b",
        start: 2,
        duration: 2,
        sceneRef: "scene.shot",
      },
    ];
    const result = validateDocument(doc, bundle);
    assert.equal(result.valid, false);
    assert.equal(hasCode(result, "VS-TIME-001"), true);
    assert.equal(hasCode(result, "VS-SCHEMA"), false, JSON.stringify(result.errors));
  });

  it("reports VS-GRAPH-001 for entity parts cycles", () => {
    const doc = {
      visualSpec: "1.0",
      metadata: { title: "Parts cycle" },
      profiles: ["illustration"],
      entities: [
        { id: "entity.a", kind: "graphic.symbol", name: "A", parts: ["entity.b"] },
        { id: "entity.b", kind: "graphic.symbol", name: "B", parts: ["entity.a"] },
      ],
      illustrations: [
        {
          id: "illustration.main",
          sceneRef: "scene.main",
          technique: "vector.flat",
        },
      ],
      scenes: [
        {
          id: "scene.main",
          kind: "2d",
          nodes: [{ id: "node.a", kind: "group", entityRef: "entity.a" }],
        },
      ],
    };
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-GRAPH-001"), true);
    assert.equal(hasCode(result, "VS-SCHEMA"), false, JSON.stringify(result.errors));
  });

  it("reports VS-STATE-001 for unknown transition target", () => {
    const doc = clone(hello);
    doc.states = [
      {
        id: "state.open",
        name: "open",
        transitions: [{ to: "state.missing" }],
      },
    ];
    const result = validateDocument(doc, bundle);
    assert.equal(result.valid, false);
    assert.equal(hasCode(result, "VS-STATE-001"), true);
    assert.equal(hasCode(result, "VS-REF-001"), false);
  });

  it("reports VS-TOKEN-003 when an alias changes type", () => {
    const doc = clone(hello);
    doc.tokens = {
      "color.brand": { type: "color", value: "#4b621c" },
      "space.card": { type: "spacing", value: "{color.brand}" },
    };
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-TOKEN-003"), true);
  });

  it("reports VS-MOTION-001 when reduced motion is missing", () => {
    const doc = clone(hello);
    doc.motion = [{ id: "motion.enter", targets: ["node.title"], duration: { value: 200, unit: "ms" }, tracks: [{ property: "appearance.opacity", from: 0, to: 1 }] }];
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-MOTION-001"), true);
    assert.equal(hasCode(result, "VS-SCHEMA"), false, JSON.stringify(result.errors));
  });

  it("reports VS-MOTION-002 for decreasing keyframe offsets", () => {
    const doc = clone(hello);
    doc.motion = [{
      id: "motion.enter",
      essential: true,
      tracks: [{ property: "appearance.opacity", keyframes: [{ offset: 0.8, value: 0 }, { offset: 0.2, value: 1 }] }],
    }];
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-MOTION-002"), true);
  });

  it("reports VS-FLOW-001 for an unknown flow state", () => {
    const doc = clone(hello);
    doc.flows = [{ id: "flow.main", initial: "flow.missing", states: [{ id: "flow.here", name: "here" }] }];
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-FLOW-001"), true);
  });

  it("reports VS-PROV-001 for a dangling provenance path", () => {
    const doc = clone(hello);
    doc.provenance = [{ path: "/tokens/missing", method: "explicit" }];
    const result = validateDocument(doc, bundle);
    assert.equal(hasCode(result, "VS-PROV-001"), true);
  });

  it("reports VS-SCHEMA for negative opacity or invalid profile", () => {
    const opacityDoc = clone(hello);
    opacityDoc.scenes[0].nodes[0].appearance = { opacity: -0.1 };
    const opacityResult = validateDocument(opacityDoc, bundle);
    assert.equal(opacityResult.valid, false);
    assert.equal(hasCode(opacityResult, "VS-SCHEMA"), true);

    const profileDoc = clone(hello);
    profileDoc.profiles = ["nope"];
    const profileResult = validateDocument(profileDoc, bundle);
    assert.equal(profileResult.valid, false);
    assert.equal(hasCode(profileResult, "VS-SCHEMA"), true);
  });
});
