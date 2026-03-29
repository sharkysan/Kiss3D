/**
 * Lists glTF mesh + node names for every .glb / .gltf in public/models.
 * Run: npx tsx scripts/list-mesh-names.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelsDir = path.join(__dirname, '..', 'public', 'models');

type GltfMesh = { name?: string; primitives?: unknown[] };
type GltfNode = { name?: string; mesh?: number };

function extractGltfFromGlb(buffer: Buffer): Record<string, unknown> {
  if (buffer.length < 20) throw new Error('file too small');
  const magic = buffer.readUInt32LE(0);
  if (magic !== 0x46546c67) throw new Error('not GLB (expected magic "glTF")');
  const version = buffer.readUInt32LE(4);
  if (version < 2) throw new Error(`unsupported GLB version ${version}`);

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + chunkLength;
    if (chunkType === 0x4e4f534a) {
      const json = JSON.parse(buffer.subarray(start, end).toString('utf8')) as Record<string, unknown>;
      return json;
    }
    offset = end;
  }
  throw new Error('no JSON chunk in GLB');
}

function analyzeGltf(gltf: Record<string, unknown>, title: string) {
  const meshes = (gltf.meshes as GltfMesh[] | undefined) ?? [];
  const nodes = (gltf.nodes as GltfNode[] | undefined) ?? [];

  console.log(`\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`);
  console.log('Meshes (asset.meshes — often unnamed; primitives = submeshes):');
  meshes.forEach((m, i) => {
    const nPrim = m.primitives?.length ?? 0;
    console.log(`  [${i}] "${m.name ?? '(no name)'}"  primitives: ${nPrim}`);
  });

  console.log('\nNodes with mesh (best labels for “what is this part” in many exports):');
  const withMesh = nodes
    .map((n, i) => ({ i, n }))
    .filter(({ n }) => n.mesh !== undefined);
  if (withMesh.length === 0) {
    console.log('  (none)');
  } else {
    for (const { i, n } of withMesh) {
      const mi = n.mesh as number;
      const meshName = meshes[mi]?.name;
      console.log(
        `  node[${i}] "${n.name ?? '(no name)'}" -> mesh[${mi}]` +
          (meshName ? ` meshName="${meshName}"` : ''),
      );
    }
  }
}

function processFile(absPath: string) {
  const base = path.basename(absPath);
  if (base.endsWith('.glb')) {
    const buf = fs.readFileSync(absPath);
    const gltf = extractGltfFromGlb(buf);
    analyzeGltf(gltf, base);
    return;
  }
  if (base.endsWith('.gltf')) {
    const raw = fs.readFileSync(absPath, 'utf8');
    const gltf = JSON.parse(raw) as Record<string, unknown>;
    analyzeGltf(gltf, base);
    return;
  }
}

function main() {
  if (!fs.existsSync(modelsDir)) {
    console.error('Missing folder:', modelsDir);
    process.exit(1);
  }
  const files = fs
    .readdirSync(modelsDir)
    .filter((f) => f.endsWith('.glb') || f.endsWith('.gltf'))
    .sort((a, b) => a.localeCompare(b));
  if (files.length === 0) {
    console.log('No .glb or .gltf in', modelsDir);
    return;
  }
  for (const f of files) {
    try {
      processFile(path.join(modelsDir, f));
    } catch (e) {
      console.error(`\n${f}: ERROR`, e);
    }
  }
  console.log('\n');
}

main();
