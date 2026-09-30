import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDocument } from "../packages/validator/validate.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bundlePath = join(root, "packages/schema/schema/1.0/schema.bundle.json");
const examplesDir = join(root, "packages/schema/examples");
const bundle = JSON.parse(readFileSync(bundlePath, "utf8"));
const bundleText = readFileSync(bundlePath, "utf8");

describe("schema bundle", () => {
  it("does not contain external /modules/ references", () => {
    assert.equal(bundleText.includes("/modules/"), false);
  });

  it("validates every example except index.json with zero errors", () => {
    const files = readdirSync(examplesDir)
      .filter((name) => name.endsWith(".json") && name !== "index.json")
      .sort();

    assert.ok(files.length > 0, "expected example files");

    for (const name of files) {
      const document = JSON.parse(readFileSync(join(examplesDir, name), "utf8"));
      const result = validateDocument(document, bundle);
      assert.equal(
        result.valid,
        true,
        `${name} should be valid, errors: ${JSON.stringify(result.errors, null, 2)}`,
      );
      assert.equal(result.errors.length, 0, name);
    }
  });

  it("hello.json matches the quick-start shape", () => {
    const hello = JSON.parse(readFileSync(join(examplesDir, "hello.json"), "utf8"));
    assert.equal(hello.visualSpec, "1.0");
    assert.deepEqual(hello.profiles, ["ui"]);
    assert.equal(hello.scenes[0].id, "scene.main");
    assert.equal(hello.scenes[0].nodes[0].kind, "text");
  });
});
