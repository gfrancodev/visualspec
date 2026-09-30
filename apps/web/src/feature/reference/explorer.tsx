import { useId, useMemo, useState } from "react";
import { copyText } from "@core/components/CopyButton";

const KINDS = [
  "website",
  "image",
  "video",
  "figma",
  "pdf",
  "presentation",
  "document",
  "3d",
] as const;

const ROLES = ["source-of-truth", "preferred", "supporting", "inspiration", "avoid"] as const;

const LOCATOR_FIELDS: Record<string, Array<{ key: string; label: string; type: string }>> = {
  website: [
    { key: "cssSelector", label: "CSS selector", type: "text" },
    { key: "viewportWidth", label: "Viewport width", type: "number" },
    { key: "viewportHeight", label: "Viewport height", type: "number" },
  ],
  image: [
    { key: "x", label: "Region x", type: "number" },
    { key: "y", label: "Region y", type: "number" },
    { key: "width", label: "Region width", type: "number" },
    { key: "height", label: "Region height", type: "number" },
  ],
  video: [
    { key: "start", label: "Start (seconds)", type: "number" },
    { key: "end", label: "End (seconds)", type: "number" },
  ],
  figma: [
    { key: "fileKey", label: "File key", type: "text" },
    { key: "nodeId", label: "Node id", type: "text" },
  ],
  pdf: [{ key: "page", label: "Page", type: "number" }],
  presentation: [{ key: "slide", label: "Slide", type: "number" }],
  document: [{ key: "section", label: "Section", type: "text" }],
  "3d": [
    { key: "scene", label: "Scene", type: "text" },
    { key: "node", label: "Node", type: "text" },
    { key: "camera", label: "Camera", type: "text" },
  ],
};

function numberOrNothing(value: string | undefined) {
  if (value === "" || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function buildLocator(kind: string, fields: Record<string, string>) {
  if (kind === "website") {
    const locator: Record<string, unknown> = {};
    if (fields.cssSelector) locator.dom = { cssSelector: fields.cssSelector };
    const width = numberOrNothing(fields.viewportWidth);
    const height = numberOrNothing(fields.viewportHeight);
    if (width !== undefined && height !== undefined && width >= 0 && height >= 0) {
      locator.viewport = { width, height };
    }
    return Object.keys(locator).length ? locator : undefined;
  }
  if (kind === "image") {
    const x = numberOrNothing(fields.x);
    const y = numberOrNothing(fields.y);
    const width = numberOrNothing(fields.width);
    const height = numberOrNothing(fields.height);
    if (
      x !== undefined &&
      y !== undefined &&
      width !== undefined &&
      height !== undefined &&
      width >= 0 &&
      height >= 0
    ) {
      return { image: { region: { x, y, width, height } } };
    }
    return undefined;
  }
  if (kind === "video") {
    const video: Record<string, number> = {};
    const start = numberOrNothing(fields.start);
    const end = numberOrNothing(fields.end);
    if (start !== undefined && start >= 0) video.start = start;
    if (end !== undefined && end >= 0) video.end = end;
    return Object.keys(video).length ? { video } : undefined;
  }
  if (kind === "figma") {
    if (fields.fileKey && fields.nodeId)
      return { figma: { fileKey: fields.fileKey, nodeId: fields.nodeId } };
    return undefined;
  }
  if (kind === "pdf") {
    const page = numberOrNothing(fields.page);
    if (page !== undefined && Number.isInteger(page) && page >= 1) return { pdf: { page } };
    return undefined;
  }
  if (kind === "presentation") {
    const slide = numberOrNothing(fields.slide);
    if (slide !== undefined && Number.isInteger(slide) && slide >= 1)
      return { presentation: { slide } };
    return undefined;
  }
  if (kind === "document") {
    return fields.section ? { document: { section: fields.section } } : undefined;
  }
  if (kind === "3d") {
    const scene3d: Record<string, string> = {};
    for (const key of ["scene", "node", "camera"]) {
      if (fields[key]) scene3d[key] = fields[key];
    }
    return Object.keys(scene3d).length ? { scene3d } : undefined;
  }
  return undefined;
}

export default function ReferenceExplorer() {
  const kindId = useId();
  const roleId = useId();
  const aspectsId = useId();
  const uriId = useId();
  const [kind, setKind] = useState<string>("website");
  const [role, setRole] = useState<string>("source-of-truth");
  const [aspects, setAspects] = useState("layout, typography");
  const [uri, setUri] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  const output = useMemo(() => {
    const aspectsList = aspects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const descriptor: Record<string, unknown> = {
      id: "reference.example",
      kind,
      role,
    };
    if (aspectsList.length) descriptor.aspects = aspectsList;
    if (uri.trim()) descriptor.uri = uri.trim();
    const locator = buildLocator(kind, fields);
    if (locator) descriptor.locator = locator;
    return descriptor;
  }, [kind, role, aspects, uri, fields]);

  const pretty = JSON.stringify(output, null, 2);
  const locatorFields = LOCATOR_FIELDS[kind] || [];

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="explorer">
      <div className="callout" role="note">
        This builder constructs a descriptor. It does not fetch or verify the resource.
      </div>

      <div className="explorer-grid">
        <div>
          <div className="field">
            <label className="field-label" htmlFor={kindId}>
              Kind
            </label>
            <select
              id={kindId}
              className="input"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value);
                setFields({});
              }}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor={roleId}>
              Role
            </label>
            <select
              id={roleId}
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor={aspectsId}>
              Aspects (comma-separated)
            </label>
            <input
              id={aspectsId}
              className="input"
              value={aspects}
              onChange={(e) => setAspects(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor={uriId}>
              URI (optional)
            </label>
            <input
              id={uriId}
              className="input"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <h3 style={{ fontSize: 18, marginTop: 10 }}>Locator</h3>
          {locatorFields.map((field) => {
            const id = `${kindId}-${field.key}`;
            return (
              <div className="field" key={field.key}>
                <label className="field-label" htmlFor={id}>
                  {field.label}
                </label>
                <input
                  id={id}
                  className="input"
                  type={field.type === "number" ? "number" : "text"}
                  value={fields[field.key] ?? ""}
                  onChange={(e) => updateField(field.key, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        <div>
          <div className="field-label">Descriptor JSON</div>
          <div className="code-block">
            <button
              className="copy-button"
              type="button"
              onClick={(event) => {
                void copyText(event.currentTarget, pretty);
              }}
            >
              Copy
            </button>
            <pre>
              <code>{pretty}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
