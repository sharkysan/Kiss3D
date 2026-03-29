import {
  AbstractMesh,
  Mesh,
  Quaternion,
  type Scene,
  SceneLoader,
  type Skeleton,
  type Node,
  TransformNode,
  Vector3,
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

function collectPartMeshes(allMeshes: Iterable<AbstractMesh>, baseName: string): Mesh[] {
  const out: Mesh[] = [];
  for (const m of allMeshes) {
    if (!(m instanceof Mesh)) continue;
    if (!m.skeleton) continue;
    if (m.name === baseName || m.name.startsWith(`${baseName}_primitive`)) {
      out.push(m);
    }
  }
  return out;
}

function findHostSkeleton(meshes: Mesh[]): Mesh['skeleton'] | null {
  for (const m of meshes) {
    if (m.skeleton) return m.skeleton;
  }
  return null;
}

function findTransformNamedUnderRoot(root: Node, name: string): TransformNode | null {
  if (root instanceof TransformNode && root.name === name) {
    return root;
  }
  const found = root.getDescendants(false, (n): n is TransformNode => n instanceof TransformNode && n.name === name);
  return found[0] ?? null;
}

/**
 * Bone-driven node for the *host* character only (never nodes from a 2nd imported glTF).
 * Order: linked bone node → search under host armature root by name.
 */
function getHostBoneTransform(
  hostSkeleton: Skeleton,
  boneName: string | undefined,
  hostArmatureRoot: Node,
): TransformNode | null {
  if (!boneName) return null;
  const bone = hostSkeleton.bones.find((b) => b.name === boneName);
  if (!bone) return null;
  const linked = bone.getTransformNode();
  if (linked) return linked;
  return findTransformNamedUnderRoot(hostArmatureRoot, boneName);
}

const hostSkeletonBoneNameSet = (s: Skeleton) => new Set(s.bones.map((b) => b.name));

/** Nearest ancestor whose name matches a host skeleton bone (handles extra nodes between mesh and joint). */
function findNearestHostBoneName(start: Node | null | undefined, hostSkeleton: Skeleton): string | undefined {
  if (!start) return undefined;
  const names = hostSkeletonBoneNameSet(hostSkeleton);
  let n: Node | null = start;
  while (n) {
    if (names.has(n.name)) return n.name;
    n = n.parent;
  }
  return undefined;
}

/** Bind-pose style offset under glTF/Mixamo: identity local on the bone node. */
function resetLocalUnderBone(node: TransformNode) {
  node.position.copyFromFloats(0, 0, 0);
  node.scaling.copyFromFloats(1, 1, 1);
  node.rotationQuaternion = Quaternion.Identity();
}

function resetMeshLocalUnderBone(mesh: Mesh) {
  mesh.position.copyFromFloats(0, 0, 0);
  mesh.scaling.copyFromFloats(1, 1, 1);
  mesh.rotationQuaternion = Quaternion.Identity();
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

function retargetPartToHost(partMeshes: Mesh[], hostSkeleton: Skeleton, hostArmatureRoot: Node) {
  if (partMeshes.length === 0) return;

  const sharedParent = partMeshes[0].parent;
  const allShareParent = partMeshes.every((m) => m.parent === sharedParent);

  if (allShareParent && sharedParent instanceof TransformNode) {
    const boneName =
      findNearestHostBoneName(sharedParent, hostSkeleton) ??
      findNearestHostBoneName(partMeshes[0].parent, hostSkeleton);
    for (const m of partMeshes) {
      m.skeleton = hostSkeleton;
    }
    const hostBoneTn = getHostBoneTransform(hostSkeleton, boneName, hostArmatureRoot);
    if (hostBoneTn && sharedParent.parent !== hostBoneTn) {
      sharedParent.parent = hostBoneTn;
      resetLocalUnderBone(sharedParent);
    }
    for (const m of partMeshes) {
      m.refreshBoundingInfo(true, true);
    }
    return;
  }

  for (const m of partMeshes) {
    m.skeleton = hostSkeleton;
    const boneName = findNearestHostBoneName(m.parent, hostSkeleton);
    const hostBoneTn = getHostBoneTransform(hostSkeleton, boneName, hostArmatureRoot);
    if (hostBoneTn && m.parent !== hostBoneTn) {
      m.parent = hostBoneTn;
      resetMeshLocalUnderBone(m);
    }
    m.refreshBoundingInfo(true, true);
  }
}

function disposePartFromScene(scene: Scene, baseName: string) {
  const partMeshes = collectPartMeshes(scene.meshes, baseName);
  const tn = scene.getTransformNodeByName(baseName);
  if (tn && partMeshes.length > 0 && partMeshes.every((m) => m.parent === tn)) {
    tn.dispose(false, true);
    return;
  }
  for (const m of partMeshes) {
    m.dispose(false, true);
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
    throw new Error(`No skinned body meshes "${bodyRig.slots.body}" in ${bodyId}`);
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
  const hostSkeleton = findHostSkeleton(bodyPartMeshes);
  if (!hostSkeleton) {
    throw new Error(`Could not find skinned body meshes for "${bodyMeshName}" in ${bodyId}`);
  }

  for (const slot of BODY_SLOTS) {
    if (slot === 'body') continue;
    const srcId = parts[slot];
    if (!CHARACTER_RIGS[srcId] || srcId === bodyId) continue;
    disposePartFromScene(scene, bodyRig.slots[slot]);
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
    const countBefore = scene.meshes.length;
    await importGltf(scene, url);
    const newMeshes = scene.meshes.slice(countBefore);

    const targetMeshes = collectPartMeshes(newMeshes, meshBaseName);
    const donorImportRoot = newMeshes.length > 0 ? getTopAncestor(newMeshes[0]) : null;

    for (const m of newMeshes) {
      if (targetMeshes.includes(m as Mesh)) continue;
      m.dispose(false, true);
    }

    retargetPartToHost(targetMeshes, hostSkeleton, hostArmatureRoot);
    for (const m of targetMeshes) {
      m.setEnabled(true);
    }

    if (
      donorImportRoot &&
      donorImportRoot !== hostArmatureRoot &&
      !hostArmatureRoot.isDescendantOf(donorImportRoot) &&
      !donorImportRoot.isDisposed()
    ) {
      donorImportRoot.dispose(true, true);
    }
  }

  hostSkeleton.computeAbsoluteMatrices(true);
  normalizeCompositeRoot(compositeRoot);

  return compositeRoot;
}

/** World-space bounds center and half-extents for framing the camera (after normalizeCompositeRoot). */
export function getCompositeFrameVectors(root: TransformNode) {
  const { min, max } = root.getHierarchyBoundingVectors(true, bboxPredicate);
  const center = min.add(max).scale(0.5);
  const ext = max.subtract(min).scale(0.5);
  return { center, ext, min, max };
}
