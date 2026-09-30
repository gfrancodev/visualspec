import type { en } from "./locales/en";

export type Locale = "en" | "pt-BR" | "es";

export type Messages = typeof en;

/** Dot-separated paths to string leaves in the message tree. */
export type MessageKey = LeafPaths<Messages>;

type LeafPaths<T, Prefix extends string = ""> = T extends string
  ? Prefix extends ""
    ? never
    : Prefix
  : T extends readonly unknown[]
    ? never
    : {
        [K in keyof T & string]: T[K] extends string
          ? Prefix extends ""
            ? K
            : `${Prefix}.${K}`
          : T[K] extends Record<string, unknown>
            ? LeafPaths<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
            : never;
      }[keyof T & string];

export type SiteNavId =
  | "reference"
  | "schemas"
  | "components"
  | "ecosystem"
  | "rfcs"
  | "contributing";
