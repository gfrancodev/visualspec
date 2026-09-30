export function resolveMessagePath(tree: Record<string, unknown>, path: string): unknown {
  let current: unknown = tree;
  for (const segment of path.split(".")) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function formatMessage(
  value: unknown,
  params?: Record<string, string | number>,
): string | null {
  if (typeof value !== "string") return null;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) => {
    const replacement = params[name];
    return replacement !== undefined ? String(replacement) : `{${name}}`;
  });
}
