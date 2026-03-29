export type PublicModelEntry = {
  id: string;
  label: string;
  /** Filename inside `public/models/` */
  path: string;
};

export type ModelsManifest = {
  models: PublicModelEntry[];
};

/** Used if `fetch("/models/manifest.json")` fails. Keep in sync with `public/models/`. */
const FALLBACK_MANIFEST: ModelsManifest = {
  models: [{ id: 'adventurer', label: 'Adventurer', path: 'Adventurer.glb' }],
};

export function modelUrl(entry: PublicModelEntry): string {
  const clean = entry.path.replace(/^\/+/, '');
  const encoded = clean.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `/models/${encoded}`;
}

export async function fetchModelsManifest(): Promise<PublicModelEntry[]> {
  try {
    const res = await fetch('/models/manifest.json');
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as ModelsManifest;
    if (!Array.isArray(data.models)) return FALLBACK_MANIFEST.models;
    return data.models.filter((m) => m?.path && typeof m.path === 'string');
  } catch {
    return FALLBACK_MANIFEST.models;
  }
}
