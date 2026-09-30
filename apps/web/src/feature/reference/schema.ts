/** Link a cross-module $ref to its reference page anchor. */
export function refTarget(schema: any) {
  const ref = schema?.$ref;
  if (typeof ref !== "string") return null;
  const match = ref.match(/modules\/([a-z0-9-]+)\.schema\.json#\/\$defs\/([A-Za-z0-9_-]+)/);
  if (!match) return null;
  return { module: match[1], name: match[2], href: `/reference/${match[1]}/#${match[2]}` };
}

function enumLabel(values: any[]) {
  const text = values.map((value) => JSON.stringify(value)).join(" | ");
  if (text.length <= 220) return text;
  return `${values
    .slice(0, 8)
    .map((value) => JSON.stringify(value))
    .join(" | ")} | … (${values.length})`;
}

/** Format a JSON Schema fragment as a short type label, including enum values. */
export function formatSchemaType(schema: any): string {
  if (!schema || typeof schema !== "object") return "-";
  if (schema.$ref) return refTarget(schema)?.name || "ref";
  if (schema.const !== undefined) return `const ${JSON.stringify(schema.const)}`;
  if (Array.isArray(schema.enum)) return enumLabel(schema.enum);
  if (schema.type) {
    const t = Array.isArray(schema.type) ? schema.type.join(" | ") : schema.type;
    if (schema.type === "array" && schema.items) return `${t}<${formatSchemaType(schema.items)}>`;
    return t;
  }
  if (schema.anyOf) return schema.anyOf.map(formatSchemaType).join(" | ");
  if (schema.oneOf) return schema.oneOf.map(formatSchemaType).join(" | ");
  if (schema.allOf) return schema.allOf.map(formatSchemaType).join(" & ");
  if (schema.properties) return "object";
  return "-";
}

function constraintText(schema: any): string {
  if (!schema || typeof schema !== "object") return "";
  const bits = [];
  if (schema.minimum !== undefined) bits.push(`min ${schema.minimum}`);
  if (schema.maximum !== undefined) bits.push(`max ${schema.maximum}`);
  if (schema.exclusiveMinimum !== undefined) bits.push(`> ${schema.exclusiveMinimum}`);
  if (schema.exclusiveMaximum !== undefined) bits.push(`< ${schema.exclusiveMaximum}`);
  if (schema.minLength !== undefined) bits.push(`minLength ${schema.minLength}`);
  if (schema.minItems !== undefined) bits.push(`minItems ${schema.minItems}`);
  if (schema.pattern) bits.push(`pattern ${schema.pattern}`);
  for (const key of ["anyOf", "oneOf", "items"]) {
    const branch = schema[key];
    if (Array.isArray(branch)) bits.push(...branch.map(constraintText).filter(Boolean));
    else if (branch && key === "items") {
      const nested = constraintText(branch);
      if (nested) bits.push(nested);
    }
  }
  return [...new Set(bits)].join(" · ");
}

const FACT_KEYS = [
  ["format", "format"],
  ["pattern", "pattern"],
  ["contentMediaType", "media type"],
  ["contentEncoding", "encoding"],
  ["minimum", "minimum"],
  ["maximum", "maximum"],
  ["exclusiveMinimum", "exclusive minimum"],
  ["exclusiveMaximum", "exclusive maximum"],
  ["multipleOf", "multiple of"],
  ["minLength", "min length"],
  ["maxLength", "max length"],
  ["minItems", "min items"],
  ["maxItems", "max items"],
  ["minProperties", "min properties"],
  ["maxProperties", "max properties"],
  ["uniqueItems", "unique items"],
  ["minContains", "min contains"],
  ["maxContains", "max contains"],
];

/** Structured view of a schema node, including nested properties and combinators. */
export function describeNode(schema: any, depth = 0): any {
  if (!schema || typeof schema !== "object" || depth > 8) {
    return {
      summary: formatSchemaType(schema),
      description: "",
      facts: [],
      enumValues: [],
      children: [],
      href: "",
      plain: [],
    };
  }

  const target = refTarget(schema);
  const facts = [];
  if (schema.type) {
    facts.push([
      "type",
      Array.isArray(schema.type) ? schema.type.join(" | ") : String(schema.type),
    ]);
  }
  if (schema.const !== undefined) facts.push(["const", JSON.stringify(schema.const)]);
  if (schema.default !== undefined) facts.push(["default", JSON.stringify(schema.default)]);
  if (schema.deprecated) facts.push(["deprecated", "yes"]);
  if (schema.readOnly) facts.push(["read only", "yes"]);
  if (schema.writeOnly) facts.push(["write only", "yes"]);
  if (schema.additionalProperties === false) facts.push(["additional properties", "forbidden"]);
  else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    facts.push(["additional properties", formatSchemaType(schema.additionalProperties)]);
  }
  for (const [key, label] of FACT_KEYS) {
    if (schema[key] !== undefined) facts.push([label, String(schema[key])]);
  }
  if (schema.$comment) facts.push(["comment", String(schema.$comment)]);
  if (Array.isArray(schema.examples) && schema.examples.length) {
    facts.push(["examples", schema.examples.map((value: any) => JSON.stringify(value)).join(", ")]);
  }

  const children = [];
  const required = new Set(schema.required || []);
  if (schema.properties && typeof schema.properties === "object") {
    for (const [name, child] of Object.entries(schema.properties)) {
      children.push({
        name,
        kind: "property",
        required: required.has(name),
        node: describeNode(child, depth + 1),
      });
    }
  }
  if (schema.items) {
    const items = Array.isArray(schema.items) ? schema.items : [schema.items];
    items.forEach((child: any, index: number) => {
      children.push({
        name: items.length > 1 ? `items[${index}]` : "items",
        kind: "items",
        required: false,
        node: describeNode(child, depth + 1),
      });
    });
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    children.push({
      name: "additionalProperties",
      kind: "additional",
      required: false,
      node: describeNode(schema.additionalProperties, depth + 1),
    });
  }
  for (const key of ["anyOf", "oneOf", "allOf"]) {
    if (!Array.isArray(schema[key])) continue;
    schema[key].forEach((child, index) => {
      children.push({
        name: `${key} ${index + 1}`,
        kind: key,
        required: false,
        node: describeNode(child, depth + 1),
      });
    });
  }
  if (schema.not) {
    children.push({
      name: "not",
      kind: "not",
      required: false,
      node: describeNode(schema.not, depth + 1),
    });
  }
  if (schema.if) {
    children.push({
      name: "if",
      kind: "if",
      required: false,
      node: describeNode(schema.if, depth + 1),
    });
  }
  if (schema.then) {
    children.push({
      name: "then",
      kind: "then",
      required: false,
      node: describeNode(schema.then, depth + 1),
    });
  }
  if (schema.else) {
    children.push({
      name: "else",
      kind: "else",
      required: false,
      node: describeNode(schema.else, depth + 1),
    });
  }

  return {
    summary: formatSchemaType(schema),
    description: schema.description || "",
    facts,
    enumValues: Array.isArray(schema.enum)
      ? schema.enum.map((value: any) => JSON.stringify(value))
      : [],
    children,
    href: target?.href || "",
    plain: plainSentences(schema),
  };
}

function listNames(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** Sentences a reader can follow without knowing JSON Schema keywords. */
export function plainSentences(schema: any) {
  if (!schema || typeof schema !== "object") return [];
  const lines = [];
  const props =
    schema.properties && typeof schema.properties === "object"
      ? Object.keys(schema.properties)
      : [];
  const required = Array.isArray(schema.required) ? schema.required : [];
  const optional = props.filter((name) => !required.includes(name));

  if (schema.$ref) {
    const target = refTarget(schema);
    lines.push(
      target
        ? `This is not a new shape. It reuses ${target.name} from the ${target.module} module. Open that definition for the fields you can write.`
        : "This reuses another definition in the schema.",
    );
  }

  if (Array.isArray(schema.enum)) {
    lines.push(
      `Pick one of the ${schema.enum.length} listed values. Any other value is invalid. The list is closed on purpose so tools agree on the same words.`,
    );
  } else if (schema.const !== undefined) {
    lines.push(`The only allowed value is ${JSON.stringify(schema.const)}.`);
  } else if (
    schema.type === "string" ||
    (Array.isArray(schema.type) && schema.type.includes("string") && !schema.properties)
  ) {
    lines.push("Write a text value.");
  } else if (schema.type === "number" || schema.type === "integer") {
    lines.push(
      schema.type === "integer" ? "Write a whole number." : "Write a number. Decimals are allowed.",
    );
  } else if (schema.type === "boolean") {
    lines.push("Write true or false.");
  } else if (schema.type === "array" || schema.items) {
    lines.push("Write a list. Each item follows the shape described under items.");
  } else if (props.length) {
    lines.push(
      schema.additionalProperties === false
        ? "Write an object. Only the fields named below are allowed. Unknown fields are rejected so a typo cannot hide inside the document."
        : "Write an object. The fields below are the ones this definition names.",
    );
  }

  if (Array.isArray(schema.anyOf)) {
    lines.push(
      `More than one shape is accepted. Use exactly one of the ${schema.anyOf.length} alternatives below. They are different ways to say the same kind of value.`,
    );
  }
  if (Array.isArray(schema.oneOf)) {
    lines.push(
      `Use exactly one of the ${schema.oneOf.length} alternatives below. The alternatives are mutually exclusive.`,
    );
  }
  if (Array.isArray(schema.allOf)) {
    lines.push(
      "Every alternative below applies at the same time. The value has to satisfy all of them.",
    );
  }

  if (required.length) {
    lines.push(`You must include ${listNames(required.map((name: string) => `\`${name}\``))}.`);
  }
  if (optional.length && optional.length <= 12) {
    lines.push(
      `You may omit ${listNames(optional.map((name: string) => `\`${name}\``))}. Leave a field out when you have nothing to say. Do not invent a placeholder.`,
    );
  } else if (optional.length > 12) {
    lines.push(
      `${optional.length} other fields are optional. Include one only when you have a real value for it.`,
    );
  }

  if (schema.pattern) {
    lines.push(
      `The text must match the pattern \`${schema.pattern}\`. That pattern is the contract for which characters are allowed.`,
    );
  }
  if (schema.format) {
    lines.push(
      `The text should be a ${schema.format}. Validators that understand this format will reject values that do not look like one.`,
    );
  }
  if (schema.minLength === 1 && schema.maxLength === undefined) {
    lines.push("An empty string is not allowed.");
  } else {
    if (schema.minLength !== undefined)
      lines.push(
        `The text must be at least ${schema.minLength} character${schema.minLength === 1 ? "" : "s"}.`,
      );
    if (schema.maxLength !== undefined)
      lines.push(`The text must be at most ${schema.maxLength} characters.`);
  }
  if (schema.minimum !== undefined && schema.maximum !== undefined) {
    lines.push(
      `The number must sit between ${schema.minimum} and ${schema.maximum}, including both ends.`,
    );
  } else if (schema.minimum !== undefined) {
    lines.push(`The number must be at least ${schema.minimum}.`);
  } else if (schema.maximum !== undefined) {
    lines.push(`The number must be at most ${schema.maximum}.`);
  }
  if (schema.minItems !== undefined)
    lines.push(
      `The list needs at least ${schema.minItems} item${schema.minItems === 1 ? "" : "s"}.`,
    );
  if (schema.maxItems !== undefined)
    lines.push(`The list allows at most ${schema.maxItems} items.`);
  if (schema.uniqueItems)
    lines.push("Each item in the list must be different. Duplicates are invalid.");
  if (schema.default !== undefined) {
    lines.push(`If you omit this value, readers should assume ${JSON.stringify(schema.default)}.`);
  }
  return lines;
}

/** Smallest JSON value that illustrates the required shape. */
export function minimalExample(schema: any, depth = 0): any {
  if (!schema || typeof schema !== "object" || depth > 5) return null;
  if (schema.const !== undefined) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  if (schema.$ref) {
    const target = refTarget(schema);
    return target ? { $ref: `${target.module}#${target.name}` } : { $ref: schema.$ref };
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length)
    return minimalExample(schema.anyOf[0], depth + 1);
  if (Array.isArray(schema.oneOf) && schema.oneOf.length)
    return minimalExample(schema.oneOf[0], depth + 1);
  if (schema.type === "array" || schema.items) {
    const count = schema.minItems || 0;
    const item = minimalExample(schema.items, depth + 1);
    return Array.from({ length: count }, () => item);
  }
  const type = Array.isArray(schema.type)
    ? schema.type.find((item: string) => item !== "null")
    : schema.type;
  if (type === "string" || (!type && !schema.properties)) {
    if (type !== "string" && type) return null;
    if (schema.format === "uri" || schema.format === "uri-reference")
      return "https://example.com/resource";
    if (schema.minLength) return "example";
    return "";
  }
  if (type === "integer") return schema.minimum ?? 0;
  if (type === "number") return schema.minimum ?? 0;
  if (type === "boolean") return true;
  if (type === "object" || schema.properties) {
    const obj: Record<string, any> = {};
    const required = schema.required || [];
    const names = required.length ? required : Object.keys(schema.properties || {}).slice(0, 4);
    for (const name of names) {
      if (schema.properties?.[name]) obj[name] = minimalExample(schema.properties[name], depth + 1);
    }
    return obj;
  }
  return null;
}

/** Collect property rows from an object schema definition. */
export function propertyRows(def: any) {
  if (!def || typeof def !== "object") return [];
  const properties = def.properties || {};
  const required = new Set(def.required || []);
  return Object.entries(properties).map(([name, schema]: [string, any]) => ({
    name,
    type: formatSchemaType(schema),
    required: required.has(name),
    description: schema?.description || "",
    constraints: constraintText(schema),
    href: refTarget(schema)?.href || refTarget(schema?.items)?.href || "",
  }));
}
