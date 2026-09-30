export type ThemeMode = "light" | "dark" | "system";

export interface NavItem {
  label: string;
  href: string;
}

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
  category: string;
  body: string;
}

export interface ModuleLink {
  name: string;
  title: string;
}
