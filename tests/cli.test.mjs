import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "packages/validator/cli.mjs");
const hello = join(root, "packages/schema/examples/hello.json");

describe("validator CLI", () => {
  it("exits 0 for a valid hello example", () => {
    const result = spawnSync(process.execPath, [cli, hello], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  it("exits 1 for an invalid document", () => {
    const dir = mkdtempSync(join(tmpdir(), "visualspec-cli-"));
    try {
      const file = join(dir, "bad.visualspec.json");
      writeFileSync(
        file,
        JSON.stringify({
          visualSpec: "1.0",
          profiles: ["nope"],
          scenes: [],
        }),
      );
      const result = spawnSync(process.execPath, [cli, file], {
        cwd: root,
        encoding: "utf8",
      });
      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.match(result.stdout + result.stderr, /VS-SCHEMA/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
