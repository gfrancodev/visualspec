import { profilesPath, readJson } from "@core";

export interface ProfileEntry {
  id: string;
  title: string;
  description: string;
  uses: string[];
  modules: string[];
  example: string;
}

export function loadProfiles(): ProfileEntry[] {
  return readJson<ProfileEntry[]>(profilesPath);
}

export function getStaticPaths() {
  return loadProfiles().map((profile) => ({ params: { id: profile.id } }));
}
