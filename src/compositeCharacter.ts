import {
  AbstractMesh,
  Mesh,
  type Scene,
  SceneLoader,
  type Skeleton,
  type Node,
  TransformNode,
  Vector3,
  VertexBuffer,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

import {
  type BodySlot,
  type CharacterRig,
  BODY_SLOTS,
  CHARACTER_RIGS,
  rigFileUrl,
} from './characterParts';

function disposeAnimations(scene: Scene) {
  scene.animationGroups.slice().forEach((g) => {
    g.stop();
    g.dispose();
  });
}

function parseAssetUrl(url: string) {
  const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
  const pathname = decodeURIComponent(u.pathname);
  const ix = pathname.lastIndexOf('/');
  const sceneFilename = pathname.slice(ix + 1);
  return {
    rootUrl: u.origin + pathname.slice(0, ix + 1),
    sceneFilename,
    pluginExtension: sceneFilename.endsWith('.glp') ? ('.gltf' as const) : undefined,
  };
}

async function importGltf(scene: Scene, url: string) {
  const { rootUrl, sceneFilename, pluginExtension } = parseAssetUrl(url);
  await SceneLoader.ImportMeshAsync(null, rootUrl, sceneFilename, scene, undefined, pluginExtension);
  disposeAnimations(scene);
}

function getTopAncestor(node: Node): Node {
  let n: Node = node;
  while (n.parent) n = n.parent;
  return n;
}

/**
 * Collect Mesh instances for a glTF mesh by base name.
 * Multi-primitive glTF meshes produce children named `baseName_primitive0`, etc.
 * Single-primitive meshes produce one Mesh named `baseName`.
 */
function collectPartMeshes(allMeshes: Iterable<AbstractMesh>, baseName: string): Mesh[] {
  const out: Mesh[] = [];
  for (const m of allMeshes) {
    if (!(m instanceof Mesh)) continue;
    if (m.name === baseName || m.name.startsWith(`${baseName}_primitive`)) {
      out.push(m);
    }
  }
  return out;
}

function findHostSkeleton(meshes: Mesh[]): Skeleton | null {
  for (const m of meshes) {
    if (m.skeleton) return m.skeleton;
  }
  return null;
}

function hideExtrasFromRig(scene: Scene, rig: CharacterRig, meshes: Iterable<AbstractMesh>) {
  const extra = new Set(rig.extras ?? []);
  for (const m of meshes) {
    const base = m.name.replace(/_primitive\d+$/, '');
    if (extra.has(m.name) || extra.has(base)) {
      m.setEnabled(false);
    }
    const tn = m.parent;
    if (tn instanceof TransformNode && extra.has(tn.name)) {
      tn.setEnabled(false);
    }
  }
  for (const ex of extra) {
    scene.getTransformNodeByName(ex)?.setEnabled(false);
  }
}

/**
 * Skinned-mesh retargeting: swap skeleton reference and move meshes
 * into the host armature's coordinate space.
 *
 * glTF skinned meshes are NOT children of bones — vertex deformation is
 * done by the GPU using bone indices/weights.  We just need the mesh in
 * the same coordinate space as the host skeleton.
 *
 * Returns the donor skeleton (for cleanup) or null.
 */
function retargetPartToHost(
  partMeshes: Mesh[],
  meshBaseName: string,
  hostSkeleton: Skeleton,
  hostArmatureRoot: Node,
): Skeleton | null {
  if (partMeshes.length === 0) return null;

  let donorSkeleton: Skeleton | null = null;
  for (const m of partMeshes) {
    if (!donorSkeleton && m.skeleton && m.skeleton !== hostSkeleton) {
      donorSkeleton = m.skeleton;
    }
    const hasSkinningData =
      m.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) &&
      m.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind);
    m.skeleton = hasSkinningData ? hostSkeleton : null;
  }

  // Multi-primitive glTF meshes share a TransformNode wrapper named after the mesh.
  // We reparent the wrapper so the children stay together.
  // Single-primitive meshes have no wrapper — reparent the mesh directly.
  const sharedParent = partMeshes[0].parent;
  const hasWrapper =
    sharedParent instanceof TransformNode &&
    sharedParent.name === meshBaseName &&
    partMeshes.every((m) => m.parent === sharedParent);

  if (hasWrapper && hostArmatureRoot instanceof TransformNode) {
    sharedParent.parent = hostArmatureRoot;
  } else if (hostArmatureRoot instanceof TransformNode) {
    for (const m of partMeshes) {
      m.parent = hostArmatureRoot;
    }
  }

  for (const m of partMeshes) {
    m.refreshBoundingInfo(true, true);
  }

  return donorSkeleton;
}

/** Remove a body-slot's meshes (and their wrapper TransformNode) from the scene. */
function disposePartFromScene(scene: Scene, baseName: string) {
  const partMeshes = collectPartMeshes(scene.meshes, baseName);
  const tn = scene.getTransformNodeByName(baseName);
  if (tn && partMeshes.length > 0 && partMeshes.every((m) => m.parent === tn)) {
    tn.dispose(false, false);
    return;
  }
  for (const m of partMeshes) {
    m.dispose(false, false);
  }
}

/** Safely dispose a donor import root if it's not part of the host hierarchy. */
function disposeDonorRoot(donorRoot: Node | null, hostArmatureRoot: Node) {
  if (
    donorRoot &&
    donorRoot !== hostArmatureRoot &&
    !hostArmatureRoot.isDescendantOf(donorRoot) &&
    !donorRoot.isDisposed()
  ) {
    // false = recurse into remaining children; false = don't dispose materials/textures
    donorRoot.dispose(false, false);
  }
}

const bboxPredicate = (m: AbstractMesh) => m.isEnabled(false) && m.isVisible;

function normalizeCompositeRoot(compositeRoot: TransformNode) {
  const { min, max } = compositeRoot.getHierarchyBoundingVectors(true, bboxPredicate);
  const size = max.subtract(min);
  const height = Math.max(size.y, 1e-4);
  const scale = Math.min(4, Math.max(0.02, 2 / height));
  compositeRoot.scaling = new Vector3(scale, scale, scale);

  const b2 = compositeRoot.getHierarchyBoundingVectors(true, bboxPredicate);
  const center = b2.min.add(b2.max).scale(0.5);
  compositeRoot.position = new Vector3(-center.x, -b2.min.y, -center.z);
}

function normalizeUnderComposite(scene: Scene, attachRoot: Node): TransformNode {
  const compositeRoot = new TransformNode('compositeRoot', scene);
  const top = getTopAncestor(attachRoot);
  top.parent = compositeRoot;
  normalizeCompositeRoot(compositeRoot);
  return compositeRoot;
}

/** One GLB only: used when all slots pick the same character (default). */
export async function loadFullBodyCharacter(scene: Scene, bodyId: string): Promise<TransformNode> {
  const bodyRig = CHARACTER_RIGS[bodyId];
  if (!bodyRig) throw new Error(`Unknown character: ${bodyId}`);
  const bodyUrl = rigFileUrl(bodyId);
  if (!bodyUrl) throw new Error(`No URL for ${bodyId}`);

  await importGltf(scene, bodyUrl);
  hideExtrasFromRig(scene, bodyRig, scene.meshes);

  const bodyMeshes = collectPartMeshes(scene.meshes, bodyRig.slots.body);
  if (bodyMeshes.length === 0) {
    throw new Error(`No body meshes "${bodyRig.slots.body}" in ${bodyId}`);
  }

  return normalizeUnderComposite(scene, bodyMeshes[0]);
}

export async function loadCompositeCharacter(
  scene: Scene,
  parts: Record<BodySlot, string>,
): Promise<TransformNode> {
  const bodyId = parts.body;
  const bodyRig = CHARACTER_RIGS[bodyId];
  if (!bodyRig) throw new Error(`Unknown body character: ${bodyId}`);

  if (BODY_SLOTS.every((s) => parts[s] === bodyId)) {
    return loadFullBodyCharacter(scene, bodyId);
  }

  const bodyUrl = rigFileUrl(bodyId);
  if (!bodyUrl) throw new Error(`No URL for ${bodyId}`);

  await importGltf(scene, bodyUrl);
  hideExtrasFromRig(scene, bodyRig, scene.meshes);

  const bodyMeshName = bodyRig.slots.body;
  const bodyPartMeshes = collectPartMeshes(scene.meshes, bodyMeshName);
  if (bodyPartMeshes.length === 0) {
    throw new Error(`No body meshes "${bodyMeshName}" in ${bodyId}`);
  }

  const hostArmatureRoot = getTopAncestor(bodyPartMeshes[0]);
  const compositeRoot = new TransformNode('compositeRoot', scene);
  hostArmatureRoot.parent = compositeRoot;

  for (const slot of BODY_SLOTS) {
    if (slot === 'body') continue;

    const srcId = parts[slot];
    const srcRig = CHARACTER_RIGS[srcId];
    if (!srcRig || srcId === bodyId) continue;

    const url = rigFileUrl(srcId);
    if (!url) continue;

    const meshBaseName = srcRig.slots[slot];

    // Snapshot mesh count before import so we can isolate new meshes
    const countBefore = scene.meshes.length;
    const skelCountBefore = scene.skeletons.length;
    await importGltf(scene, url);
    const newMeshes = scene.meshes.slice(countBefore);
    const newSkeletons = scene.skeletons.slice(skelCountBefore);

    hideExtrasFromRig(scene, srcRig, newMeshes);

    const donorImportRoot = newMeshes.length > 0 ? getTopAncestor(newMeshes[0]) : null;
    if (donorImportRoot && donorImportRoot !== compositeRoot && donorImportRoot.parent !== compositeRoot) {
      donorImportRoot.parent = compositeRoot;
    }

    const targetMeshes = collectPartMeshes(newMeshes, meshBaseName);
    if (targetMeshes.length === 0) {
      disposeDonorRoot(donorImportRoot, hostArmatureRoot);
      for (const sk of newSkeletons) sk.dispose();
      continue;
    }

    // Keep only the selected donor slot visible.
    for (const donorSlot of BODY_SLOTS) {
      const donorBase = srcRig.slots[donorSlot];
      const donorPartMeshes = collectPartMeshes(newMeshes, donorBase);
      const shouldEnable = donorSlot === slot;
      for (const m of donorPartMeshes) {
        m.setEnabled(shouldEnable);
      }
    }

    // Remove original host slot so donor slot becomes visible.
    disposePartFromScene(scene, bodyRig.slots[slot]);

  }

  normalizeCompositeRoot(compositeRoot);

  return compositeRoot;
}

/** World-space bounds for framing the camera. */
export function getCompositeFrameVectors(root: TransformNode) {
  const { min, max } = root.getHierarchyBoundingVectors(true, bboxPredicate);
  const center = min.add(max).scale(0.5);
  const ext = max.subtract(min).scale(0.5);
  return { center, ext, min, max };
}
