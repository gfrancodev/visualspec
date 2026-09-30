#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createValidator } from "./validate.mjs";

function findSchemaBundle() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const candidate = join(dir, "packages/schema/schema/1.0/schema.bundle.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("Could not locate packages/schema/schema/1.0/schema.bundle.json");
    }
    dir = parent;
  }
}

function printUsage() {
  const msg = `Usage: node packages/validator/cli.mjs <file> [more files] [--json]

Validate Visual Spec JSON documents against the local schema bundle.
`;
  process.stderr.write(msg);
}

function main(argv) {
  const args = argv.slice(2);
  const jsonMode = args.includes("--json");
  const files = args.filter((a) => a !== "--json");

  if (files.length === 0) {
    printUsage();
    process.exit(1);
  }

  const bundlePath = findSchemaBundle();
  const bundleSchema = JSON.parse(readFileSync(bundlePath, "utf8"));
  const validate = createValidator(bundleSchema);

  let allValid = true;
  /** @type {Array<{ file: string, valid: boolean, errors: unknown[] }>} */
  const results = [];

  for (const file of files) {
    let document;
    try {
      document = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      allValid = false;
      const message = err instanceof Error ? err.message : String(err);
      const result = {
        file,
        valid: false,
        errors: [
          {
            code: "VS-SCHEMA",
            severity: "error",
            message: `Invalid JSON: ${message}`,
            path: "/",
          },
        ],
      };
      results.push(result);
      if (!jsonMode) {
        for (const e of result.errors) {
          process.stdout.write(`${file} ${e.path} ${e.code} ${e.message}\n`);
        }
      }
      continue;
    }

    const result = validate(document);
    results.push({ file, valid: result.valid, errors: result.errors });
    if (!result.valid) allValid = false;

    if (!jsonMode) {
      if (result.valid) {
        process.stdout.write(`${file}: valid\n`);
      } else {
        for (const e of result.errors) {
          process.stdout.write(`${file} ${e.path} ${e.code} ${e.message}\n`);
        }
      }
    }
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify(files.length === 1 ? results[0] : results, null, 2) + "\n");
  }

  process.exit(allValid ? 0 : 1);
}

main(process.argv);
