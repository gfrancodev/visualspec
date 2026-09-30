import Ajv from "ajv";
import addFormats from "ajv-formats";

const ID_PATTERN = /^[A-Za-z_][A-Za-z0-9_.:/-]*$/;
const TOKEN_REF_PATTERN = /^\{([A-Za-z_][A-Za-z0-9_.-]*)\}$/;
const TIME_STRING_PATTERN = /^(?:0|[0-9]+(?:\.[0-9]+)?)(ms|s|f)$/;

/**
 * @param {unknown} bundleSchema
 * @returns {(document: unknown) => { valid: boolean, errors: Array<{ code: string, severity: 'error', message: string, path: string }> }}
 */
export function createValidator(bundleSchema) {
  const ajv = new Ajv({ strict: false, allErrors: true, validateSchema: false });
  addFormats(ajv);
  const validateSchema = ajv.compile(bundleSchema);

  return function validate(document) {
    return runValidation(document, validateSchema);
  };
}

/**
 * @param {unknown} document
 * @param {unknown} bundleSchema
 */
export function validateDocument(document, bundleSchema) {
  return createValidator(bundleSchema)(document);
}

/**
 * @param {unknown} document
 * @param {(data: unknown) => boolean} validateSchema
 */
function runValidation(document, validateSchema) {
  /** @type {Array<{ code: string, severity: 'error', message: string, path: string }>} */
  const errors = [];

  const schemaOk = validateSchema(document);
  if (!schemaOk && validateSchema.errors) {
    for (const err of validateSchema.errors) {
      const path = err.instancePath && err.instancePath.length > 0 ? err.instancePath : "/";
      errors.push({
        code: "VS-SCHEMA",
        severity: "error",
        message: err.message || "Schema validation failed",
        path,
      });
    }
  }

  const isObject = document !== null && typeof document === "object" && !Array.isArray(document);
  if (!schemaOk && !isObject) {
    return finalize(errors);
  }

  if (isObject) {
    collectIdErrors(document, errors);
    collectRefErrors(document, errors);
    collectTokenErrors(document, errors);
    collectTimeErrors(document, errors);
    collectGraphErrors(document, errors);
    collectStateErrors(document, errors);
    collectMotionErrors(document, errors);
    collectFlowErrors(document, errors);
    collectProvenanceErrors(document, errors);
  }

  return finalize(errors);
}

/**
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function finalize(errors) {
  errors.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  });
  return { valid: errors.length === 0, errors };
}

/**
 * @param {unknown} value
 * @param {(value: unknown, path: string, key: string | null, parent: object | null) => void} visit
 * @param {string} [path]
 * @param {string | null} [key]
 * @param {object | null} [parent]
 */
function walk(value, visit, path = "", key = null, parent = null) {
  visit(value, path, key, parent);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      walk(value[i], visit, `${path}/${i}`, String(i), value);
    }
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      walk(v, visit, `${path}/${escapePointer(k)}`, k, value);
    }
  }
}

/** @param {string} key */
function escapePointer(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}

/** @param {string} path */
function pointerOrRoot(path) {
  return path.length > 0 ? path : "/";
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectIdErrors(document, errors) {
  /** @type {Set<string>} */
  const seen = new Set();
  walk(document, (value, path) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;
    if (typeof value.id !== "string") return;
    if (!ID_PATTERN.test(value.id)) return;
    if (seen.has(value.id)) {
      errors.push({
        code: "VS-ID-001",
        severity: "error",
        message: `Duplicate id "${value.id}"`,
        path: pointerOrRoot(`${path}/id`),
      });
    } else {
      seen.add(value.id);
    }
  });
}

/**
 * Collect all addressable IDs (first occurrence wins for the set).
 * @param {object} document
 * @returns {Set<string>}
 */
function collectIdSet(document) {
  /** @type {Set<string>} */
  const ids = new Set();
  walk(document, (value) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;
    if (typeof value.id !== "string") return;
    if (!ID_PATTERN.test(value.id)) return;
    ids.add(value.id);
  });
  return ids;
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectRefErrors(document, errors) {
  const ids = collectIdSet(document);

  walk(document, (value, path, key, parent) => {
    if (parent === null || key === null) return;

    // transitions[].to / transitions[].from are handled exclusively by VS-STATE-001

    if (typeof key === "string" && key.endsWith("Ref") && typeof value === "string") {
      if (value.length === 0) return;
      if (!ids.has(value)) {
        errors.push({
          code: "VS-REF-001",
          severity: "error",
          message: `Unresolved reference "${value}"`,
          path: pointerOrRoot(path),
        });
      }
      return;
    }

    if (typeof key === "string" && key.endsWith("Refs") && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item !== "string" || item.length === 0) continue;
        if (!ids.has(item)) {
          errors.push({
            code: "VS-REF-001",
            severity: "error",
            message: `Unresolved reference "${item}"`,
            path: pointerOrRoot(`${path}/${i}`),
          });
        }
      }
      return;
    }

    if (key === "sequence" && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        if (typeof item !== "string" || item.length === 0) continue;
        if (!ids.has(item)) {
          errors.push({
            code: "VS-REF-001",
            severity: "error",
            message: `Unresolved reference "${item}"`,
            path: pointerOrRoot(`${path}/${i}`),
          });
        }
      }
    }
  });
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectTokenErrors(document, errors) {
  const tokens =
    document.tokens !== null && typeof document.tokens === "object" && !Array.isArray(document.tokens)
      ? document.tokens
      : null;
  const tokenKeys = tokens ? new Set(Object.keys(tokens)) : new Set();

  // VS-TOKEN-002 unresolved brace refs
  walk(document, (value, path) => {
    if (typeof value !== "string") return;
    const match = TOKEN_REF_PATTERN.exec(value);
    if (!match) return;
    const name = match[1];
    if (!tokenKeys.has(name)) {
      errors.push({
        code: "VS-TOKEN-002",
        severity: "error",
        message: `Unresolved token reference "{${name}}"`,
        path: pointerOrRoot(path),
      });
    }
  });

  // VS-TOKEN-001 cycles
  if (!tokens) return;

  /** @type {Map<string, Set<string>>} */
  const graph = new Map();
  for (const key of Object.keys(tokens)) {
    /** @type {Set<string>} */
    const targets = new Set();
    walk(tokens[key], (value) => {
      if (typeof value !== "string") return;
      const match = TOKEN_REF_PATTERN.exec(value);
      if (match) targets.add(match[1]);
    });
    graph.set(key, targets);
  }

  for (const cycle of findCycles(graph)) {
    const key = cycle[0];
    errors.push({
      code: "VS-TOKEN-001",
      severity: "error",
      message: `Token alias cycle involving "${cycle.join('" -> "')}"`,
      path: `/tokens/${escapePointer(key)}`,
    });
  }

  for (const [key, token] of Object.entries(tokens)) {
    if (!token || typeof token !== "object") continue;
    const ownType = token.type || token.$type;
    const raw = token.value !== undefined ? token.value : token.$value;
    if (typeof raw === "string") {
      const match = TOKEN_REF_PATTERN.exec(raw);
      if (match && tokens[match[1]] && ownType) {
        const targetType = tokens[match[1]].type || tokens[match[1]].$type;
        if (targetType && targetType !== ownType) {
          errors.push({
            code: "VS-TOKEN-003",
            severity: "error",
            message: `Token "${key}" (${ownType}) aliases "${match[1]}" (${targetType})`,
            path: `/tokens/${escapePointer(key)}`,
          });
        }
      }
    } else if (ownType === "color" && (typeof raw === "number" || typeof raw === "boolean")) {
      errors.push({
        code: "VS-TOKEN-003",
        severity: "error",
        message: `Token "${key}" is a color and cannot use a ${typeof raw} value`,
        path: `/tokens/${escapePointer(key)}`,
      });
    }
  }
}

/**
 * @param {Map<string, Set<string>>} graph
 * @returns {string[][]}
 */
function findCycles(graph) {
  /** @type {string[][]} */
  const cycles = [];
  /** @type {Set<string>} */
  const visited = new Set();
  /** @type {Set<string>} */
  const stackSet = new Set();
  /** @type {string[]} */
  const stack = [];
  /** @type {Set<string>} */
  const reported = new Set();

  /**
   * @param {string} node
   */
  function dfs(node) {
    if (stackSet.has(node)) {
      const idx = stack.indexOf(node);
      const cycle = stack.slice(idx);
      if (!cycle.some((n) => reported.has(n))) {
        cycles.push(cycle);
        for (const n of cycle) reported.add(n);
      }
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stackSet.add(node);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      dfs(next);
    }
    stack.pop();
    stackSet.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) dfs(node);
  }
  return cycles;
}

/**
 * @param {unknown} value
 * @param {number} fps
 * @returns {number | null}
 */
function parseTime(value, fps) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (value && typeof value === "object" && !Array.isArray(value) && typeof value.value === "number" && typeof value.unit === "string") {
    if (value.unit === "ms") return value.value / 1000;
    if (value.unit === "s") return value.value;
    if (value.unit === "f") return value.value / fps;
    return null;
  }
  if (typeof value !== "string") return null;
  const match = TIME_STRING_PATTERN.exec(value);
  if (!match) return null;
  const amount = Number(value.slice(0, -match[1].length));
  if (!Number.isFinite(amount)) return null;
  const unit = match[1];
  if (unit === "ms") return amount / 1000;
  if (unit === "s") return amount;
  if (unit === "f") return amount / fps;
  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isTimeValue(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return true;
  if (typeof value === "string" && TIME_STRING_PATTERN.test(value)) return true;
  return false;
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectTimeErrors(document, errors) {
  const timelines = Array.isArray(document.timelines) ? document.timelines : [];

  for (let ti = 0; ti < timelines.length; ti++) {
    const timeline = timelines[ti];
    if (timeline === null || typeof timeline !== "object" || Array.isArray(timeline)) continue;
    const fps = typeof timeline.fps === "number" && timeline.fps > 0 ? timeline.fps : 24;
    const timelineDuration = parseTime(timeline.duration, fps);
    const tracks = Array.isArray(timeline.tracks) ? timeline.tracks : [];

    for (let tri = 0; tri < tracks.length; tri++) {
      const track = tracks[tri];
      if (track === null || typeof track !== "object" || Array.isArray(track)) continue;
      const clips = Array.isArray(track.clips) ? track.clips : [];

      /** @type {Array<{ start: number, end: number, path: string }>} */
      const intervals = [];

      for (let ci = 0; ci < clips.length; ci++) {
        const clip = clips[ci];
        if (clip === null || typeof clip !== "object" || Array.isArray(clip)) continue;
        const start = parseTime(clip.start, fps);
        const duration = parseTime(clip.duration, fps);
        if (start === null || duration === null) continue;
        const end = start + duration;
        const clipPath = `/timelines/${ti}/tracks/${tri}/clips/${ci}`;

        if (timelineDuration !== null && end > timelineDuration + 1e-6) {
          errors.push({
            code: "VS-TIME-001",
            severity: "error",
            message: `Clip extends past timeline duration`,
            path: clipPath,
          });
        }
        intervals.push({ start, end, path: clipPath });
      }

      intervals.sort((a, b) => a.start - b.start || a.end - b.end);
      for (let i = 1; i < intervals.length; i++) {
        const prev = intervals[i - 1];
        const curr = intervals[i];
        if (curr.start < prev.end - 1e-6) {
          errors.push({
            code: "VS-TIME-001",
            severity: "error",
            message: `Overlapping clips on the same track`,
            path: curr.path,
          });
        }
      }
    }
  }

  // Caption-like start/end and presence/temporal from/to
  walk(document, (value, path) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;

    if ("start" in value && "end" in value) {
      const start = parseTime(value.start, 24);
      const end = parseTime(value.end, 24);
      if (start !== null && end !== null && end < start - 1e-6) {
        errors.push({
          code: "VS-TIME-001",
          severity: "error",
          message: `Interval end is before start`,
          path: pointerOrRoot(path),
        });
      }
    }

    // Presence/temporal: both from and to are times, parent has no property field
    if ("from" in value && "to" in value && !("property" in value)) {
      if (isTimeValue(value.from) && isTimeValue(value.to)) {
        const from = parseTime(value.from, 24);
        const to = parseTime(value.to, 24);
        if (from !== null && to !== null && to < from - 1e-6) {
          errors.push({
            code: "VS-TIME-001",
            severity: "error",
            message: `Interval end is before start`,
            path: pointerOrRoot(path),
          });
        }
      }
    }
  });
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectGraphErrors(document, errors) {
  /** @type {Map<string, string>} */
  const idPaths = new Map();
  /** @type {Map<string, Set<string>>} */
  const partsGraph = new Map();
  /** @type {Map<string, Set<string>>} */
  const componentGraph = new Map();
  /** @type {Map<string, Set<string>>} */
  const instanceGraph = new Map();
  /** @type {Map<string, Set<string>>} */
  const jointGraph = new Map();

  walk(document, (value, path) => {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return;
    if (typeof value.id === "string" && ID_PATTERN.test(value.id) && !idPaths.has(value.id)) {
      idPaths.set(value.id, pointerOrRoot(path));
    }

    if (typeof value.id === "string" && Array.isArray(value.parts)) {
      const targets = partsGraph.get(value.id) || new Set();
      for (const part of value.parts) {
        if (typeof part === "string" && part.length > 0) targets.add(part);
      }
      partsGraph.set(value.id, targets);
    }

    if (typeof value.id === "string" && Array.isArray(value.children)) {
      const targets = componentGraph.get(value.id) || new Set();
      for (const child of value.children) {
        if (
          child !== null &&
          typeof child === "object" &&
          !Array.isArray(child) &&
          typeof child.componentRef === "string" &&
          child.componentRef.length > 0
        ) {
          targets.add(child.componentRef);
        }
      }
      if (targets.size > 0) componentGraph.set(value.id, targets);
    }

    if (typeof value.id === "string" && typeof value.instanceOf === "string" && value.instanceOf.length > 0) {
      const targets = instanceGraph.get(value.id) || new Set();
      targets.add(value.instanceOf);
      instanceGraph.set(value.id, targets);
    }

    if (typeof value.id === "string" && typeof value.parentRef === "string" && value.parentRef.length > 0) {
      const targets = jointGraph.get(value.id) || new Set();
      targets.add(value.parentRef);
      jointGraph.set(value.id, targets);
    }
  });

  for (const graph of [partsGraph, componentGraph, instanceGraph, jointGraph]) {
    for (const cycle of findCycles(graph)) {
      const node = cycle[0];
      errors.push({
        code: "VS-GRAPH-001",
        severity: "error",
        message: `Graph cycle involving "${cycle.join('" -> "')}"`,
        path: idPaths.get(node) || "/",
      });
    }
  }
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectStateErrors(document, errors) {
  /** @type {Set<string>} */
  const stateIds = new Set();

  walk(document, (value, path, key, parent) => {
    // Collect state object ids from arrays named "states"
    if (key === "states" && Array.isArray(value)) {
      for (const item of value) {
        if (
          item !== null &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          typeof item.id === "string" &&
          ID_PATTERN.test(item.id)
        ) {
          stateIds.add(item.id);
        }
      }
    }
  });

  // Also top-level states (already covered when walking with key "states")

  walk(document, (value, path, key, parent) => {
    if (key !== "transitions" || !Array.isArray(value)) return;
    for (let i = 0; i < value.length; i++) {
      const t = value[i];
      if (t === null || typeof t !== "object" || Array.isArray(t)) continue;
      if (typeof t.to === "string" && t.to.length > 0 && !stateIds.has(t.to)) {
        errors.push({
          code: "VS-STATE-001",
          severity: "error",
          message: `Transition target "${t.to}" is not a declared state`,
          path: pointerOrRoot(`${path}/${i}/to`),
        });
      }
      if (typeof t.from === "string" && t.from.length > 0 && !stateIds.has(t.from)) {
        errors.push({
          code: "VS-STATE-001",
          severity: "error",
          message: `Transition source "${t.from}" is not a declared state`,
          path: pointerOrRoot(`${path}/${i}/from`),
        });
      }
    }
  });
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectMotionErrors(document, errors) {
  const motions = Array.isArray(document.motion) ? document.motion : [];
  for (let i = 0; i < motions.length; i++) {
    const motion = motions[i];
    if (!motion || typeof motion !== "object") continue;
    if (motion.essential !== true && !motion.reducedMotion) {
      errors.push({
        code: "VS-MOTION-001",
        severity: "error",
        message: "Non-essential motion must declare reducedMotion",
        path: `/motion/${i}`,
      });
    }
    const tracks = Array.isArray(motion.tracks) ? motion.tracks : [];
    for (let t = 0; t < tracks.length; t++) {
      const frames = tracks[t]?.keyframes;
      if (!Array.isArray(frames)) continue;
      let previous = -Infinity;
      for (let k = 0; k < frames.length; k++) {
        const offset = frames[k]?.offset;
        if (typeof offset !== "number") continue;
        if (offset + 1e-9 < previous) {
          errors.push({
            code: "VS-MOTION-002",
            severity: "error",
            message: "Keyframe offsets must be non-decreasing",
            path: `/motion/${i}/tracks/${t}/keyframes/${k}/offset`,
          });
        }
        previous = offset;
      }
    }
  }
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectFlowErrors(document, errors) {
  const flows = Array.isArray(document.flows) ? document.flows : [];
  for (let i = 0; i < flows.length; i++) {
    const flow = flows[i];
    if (!flow || typeof flow !== "object") continue;
    const ids = new Set((Array.isArray(flow.states) ? flow.states : []).map((state) => state?.id).filter((id) => typeof id === "string"));
    if (typeof flow.initial === "string" && !ids.has(flow.initial)) {
      errors.push({
        code: "VS-FLOW-001",
        severity: "error",
        message: `Flow initial state "${flow.initial}" is not declared on this flow`,
        path: `/flows/${i}/initial`,
      });
    }
    const transitions = Array.isArray(flow.transitions) ? flow.transitions : [];
    for (let t = 0; t < transitions.length; t++) {
      for (const side of ["from", "to"]) {
        const id = transitions[t]?.[side];
        if (typeof id === "string" && !ids.has(id)) {
          errors.push({
            code: "VS-FLOW-001",
            severity: "error",
            message: `Flow transition ${side} "${id}" is not declared on this flow`,
            path: `/flows/${i}/transitions/${t}/${side}`,
          });
        }
      }
    }
  }
}

/**
 * @param {object} document
 * @param {string} pointer
 */
function pointerExists(document, pointer) {
  if (pointer === "/" || pointer === "") return true;
  if (!pointer.startsWith("/")) return false;
  const parts = pointer.slice(1).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  let current = document;
  for (const part of parts) {
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) return false;
      current = current[index];
    } else if (current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else return false;
  }
  return true;
}

/**
 * @param {object} document
 * @param {Array<{ code: string, severity: 'error', message: string, path: string }>} errors
 */
function collectProvenanceErrors(document, errors) {
  const rows = Array.isArray(document.provenance) ? document.provenance : [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row.path !== "string") continue;
    if (!pointerExists(document, row.path)) {
      errors.push({
        code: "VS-PROV-001",
        severity: "error",
        message: `Provenance path "${row.path}" does not exist in the document`,
        path: `/provenance/${i}/path`,
      });
    }
  }
}
