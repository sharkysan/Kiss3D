# Kiss3D

Browser-based **virtual cosplay studio**: a procedural 3D avatar with outfit presets, poses, lighting moods, and basic customization. The 3D view is powered by **Babylon.js**; the UI is **React 19**, **Vite 6**, **TypeScript**, and **Tailwind CSS v4**.

## Features

- **Outfits** — Switch between curated cosplay sets (see `src/types.ts`).
- **Poses** — Idle / ready / survivor-style poses applied to the avatar.
- **Scenes** — Studio, jungle, and tomb presets (lighting tweaks on the Babylon scene).
- **Customization** — Accent color override and skin tone swatches.
- **Camera** — Orbit controls (drag to rotate, scroll to zoom).
- **Sample glTF** — Minimal `public/models/base.gltf` (and `base.glp`, same JSON) for reference or hosting tests.

There is **no** external model host or Google Drive integration in this tree; the default experience uses the built-in avatar in `BabylonScene`.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)

## Setup

```bash
npm install
```

Optional environment file (copy from `.env.example`):

```bash
cp .env.example .env.local   # or create .env.local manually on Windows
```

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Injected at build time as `process.env.GEMINI_API_KEY` via `vite.config.ts`. The current UI does not call the Gemini API; use this when you add `@google/genai` usage. |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port **3000**, host `0.0.0.0`). |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Typecheck with `tsc --noEmit`. |
| `npm run clean` | Remove `dist/` (Unix-style `rm`; on Windows use `rmdir /s /q dist` if needed). |

## Project layout

```
src/
  App.tsx              # UI overlay + Babylon canvas
  main.tsx             # React entry
  types.ts             # Outfit / pose types
  index.css            # Global styles (Tailwind)
  components/
    BabylonScene.tsx   # Engine, camera, avatar, glTF loader hooks
public/
  models/
    base.gltf          # Tiny sample glTF
    base.glp           # Same JSON, non-standard extension (rename to .gltf for tools)
metadata.json        # App title/description metadata (e.g. for AI Studio packaging)
```

## Development notes

- **HMR**: In `vite.config.ts`, set `DISABLE_HMR=true` to turn off Hot Module Replacement (useful in constrained or agent-driven environments).
- **Babylon**: `@babylonjs/core` and `@babylonjs/loaders` support glTF/GLB if you extend the scene to load external files again.

## License

Private project (`"private": true` in `package.json`).
