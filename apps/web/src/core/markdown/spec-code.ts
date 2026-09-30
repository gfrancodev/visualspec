/** Escape text for HTML text nodes. */
export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightJsonLine(line: string): string {
  let content = escapeHtml(line);
  content = content.replace(
    /(&quot;(?:[^&]|&(?!quot;))*&quot;)(\s*:)/g,
    '<span class="key">$1</span>$2',
  );
  content = content.replace(
    /:(\s*)(&quot;(?:[^&]|&(?!quot;))*&quot;)/g,
    ':$1<span class="value">$2</span>',
  );
  content = content.replace(
    /:(\s*)(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b)/g,
    ':$1<span class="value">$2</span>',
  );
  return `<span class="code-line">${content || " "}</span>`;
}

export function jsonToSpecCodeHtml(source: string): string {
  return String(source)
    .trimEnd()
    .split("\n")
    .map((line) => highlightJsonLine(line))
    .join("");
}

export function plainToSpecCodeHtml(source: string): string {
  return String(source)
    .trimEnd()
    .split("\n")
    .map((line) => `<span class="code-line">${escapeHtml(line) || " "}</span>`)
    .join("");
}

export function wrapSpecWindow(
  codeHtml: string,
  options: { badge?: string; caption?: string } = {},
): string {
  const badge = options.badge ?? "JSON";
  const caption = options.caption ?? "Visual Spec document";
  return `<div class="spec-window spec-window--doc"><div class="window-bar"><i></i><i></i><i></i><span>${escapeHtml(caption)}</span><b>${escapeHtml(badge)}</b></div><pre class="spec-code">${codeHtml}</pre></div>`;
}

export function formatJsonForSpecWindow(source: string): string {
  let formatted = String(source ?? "").trimEnd();
  try {
    formatted = JSON.stringify(JSON.parse(formatted), null, 2);
  } catch {
    /* keep raw text */
  }
  return wrapSpecWindow(jsonToSpecCodeHtml(formatted));
}
