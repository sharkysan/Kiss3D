import React, { useEffect, useRef } from 'react';
import {
  AbstractMesh,
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  SceneLoader,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

import { CosplaySet, PoseType } from '../types';

interface BabylonSceneProps {
  customModelUrl?: string | null;
  set: CosplaySet;
  skinColor: string;
  pose: PoseType;
  scenePreset: 'studio' | 'jungle' | 'tomb';
}

function hexToColor3(hex: string): Color3 {
  const cleaned = hex.replace('#', '').trim();
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  return new Color3(r, g, b);
}

function disposeNodeDeep(node: TransformNode) {
  node.getChildTransformNodes(true).forEach((n) => n.dispose(false, true));
  node.getChildMeshes(true).forEach((m) => m.dispose(false, true));
  node.dispose(false, true);
}

function buildAvatar(scene: Scene, set: CosplaySet, skinColor: string, pose: PoseType): TransformNode {
  const root = new TransformNode('avatarRoot', scene);

  const skinMat = new StandardMaterial('skinMat', scene);
  skinMat.diffuseColor = hexToColor3(skinColor);

  const primaryMat = new StandardMaterial('primaryMat', scene);
  primaryMat.diffuseColor = hexToColor3(set.primaryColor);

  const secondaryMat = new StandardMaterial('secondaryMat', scene);
  secondaryMat.diffuseColor = hexToColor3(set.secondaryColor);

  const accentMat = new StandardMaterial('accentMat', scene);
  accentMat.diffuseColor = hexToColor3(set.accentColor);
  accentMat.emissiveColor = hexToColor3(set.accentColor).scale(0.4);

  const hairMat = new StandardMaterial('hairMat', scene);
  hairMat.diffuseColor = hexToColor3('#3d2b1f');
  hairMat.specularColor = Color3.Black();

  // Basic pose (approximate original)
  const limbRotations: Record<PoseType, any> = {
    idle: {
      leftArm: new Vector3(0, 0, 0.15),
      rightArm: new Vector3(0, 0, -0.15),
      leftLeg: new Vector3(0, 0, 0),
      rightLeg: new Vector3(0, 0, 0),
      head: new Vector3(0, 0, 0),
    },
    ready: {
      leftArm: new Vector3(0.5, 0, 0.4),
      rightArm: new Vector3(-0.2, 0, -0.6),
      leftLeg: new Vector3(0.2, 0, -0.1),
      rightLeg: new Vector3(-0.2, 0, 0.1),
      head: new Vector3(0.1, 0, 0),
    },
    survivor: {
      leftArm: new Vector3(0.8, 0.5, 0.2),
      rightArm: new Vector3(0.8, -0.5, -0.2),
      leftLeg: new Vector3(0.1, 0, 0.05),
      rightLeg: new Vector3(0, 0, -0.05),
      head: new Vector3(0.1, 0.2, 0.1),
    },
  };
  const currentPose = limbRotations[pose] ?? limbRotations.idle;

  // Head group
  const headPivot = new TransformNode('headPivot', scene);
  headPivot.parent = root;
  headPivot.position = new Vector3(0, 1.7, 0);
  headPivot.rotation = currentPose.head;

  const head = MeshBuilder.CreateSphere('head', { diameter: 0.32, segments: 24 }, scene);
  head.parent = headPivot;
  head.material = skinMat;

  const hair = MeshBuilder.CreateSphere('hair', { diameter: 0.38, segments: 24 }, scene);
  hair.parent = headPivot;
  hair.position = new Vector3(0, 0.05, -0.05);
  hair.scaling = new Vector3(1, 1.1, 1.15);
  hair.material = hairMat;

  // Neck
  const neck = MeshBuilder.CreateCylinder('neck', { height: 0.12, diameterTop: 0.07, diameterBottom: 0.09, tessellation: 24 }, scene);
  neck.parent = root;
  neck.position = new Vector3(0, 1.55, 0);
  neck.material = skinMat;

  // Torso
  const torso = MeshBuilder.CreateCylinder('torso', { height: 0.7, diameterTop: 0.5, diameterBottom: 0.44, tessellation: 24 }, scene);
  torso.parent = root;
  torso.position = new Vector3(0, 1.1, 0);
  torso.material = secondaryMat;

  const hips = MeshBuilder.CreateSphere('hips', { diameter: 0.56, segments: 24 }, scene);
  hips.parent = root;
  hips.position = new Vector3(0, 0.85, 0);
  hips.scaling = new Vector3(1, 0.85, 1.1);
  hips.material = primaryMat;

  // Arms
  const leftArmPivot = new TransformNode('leftArmPivot', scene);
  leftArmPivot.parent = root;
  leftArmPivot.position = new Vector3(-0.3, 1.45, 0);
  leftArmPivot.rotation = currentPose.leftArm;

  const leftUpperArm = MeshBuilder.CreateCylinder('leftUpperArm', { height: 0.4, diameterTop: 0.09, diameterBottom: 0.07, tessellation: 18 }, scene);
  leftUpperArm.parent = leftArmPivot;
  leftUpperArm.position = new Vector3(0, -0.2, 0);
  leftUpperArm.material = skinMat;

  const leftLowerArm = MeshBuilder.CreateCylinder('leftLowerArm', { height: 0.4, diameterTop: 0.07, diameterBottom: 0.06, tessellation: 18 }, scene);
  leftLowerArm.parent = leftArmPivot;
  leftLowerArm.position = new Vector3(0, -0.6, 0);
  leftLowerArm.material = skinMat;

  const rightArmPivot = new TransformNode('rightArmPivot', scene);
  rightArmPivot.parent = root;
  rightArmPivot.position = new Vector3(0.3, 1.45, 0);
  rightArmPivot.rotation = currentPose.rightArm;

  const rightUpperArm = MeshBuilder.CreateCylinder('rightUpperArm', { height: 0.4, diameterTop: 0.09, diameterBottom: 0.07, tessellation: 18 }, scene);
  rightUpperArm.parent = rightArmPivot;
  rightUpperArm.position = new Vector3(0, -0.2, 0);
  rightUpperArm.material = skinMat;

  const rightLowerArm = MeshBuilder.CreateCylinder('rightLowerArm', { height: 0.4, diameterTop: 0.07, diameterBottom: 0.06, tessellation: 18 }, scene);
  rightLowerArm.parent = rightArmPivot;
  rightLowerArm.position = new Vector3(0, -0.6, 0);
  rightLowerArm.material = skinMat;

  // Legs
  const leftLegPivot = new TransformNode('leftLegPivot', scene);
  leftLegPivot.parent = root;
  leftLegPivot.position = new Vector3(-0.15, 0.8, 0);
  leftLegPivot.rotation = currentPose.leftLeg;

  const leftThigh = MeshBuilder.CreateCylinder('leftThigh', { height: 0.5, diameterTop: 0.22, diameterBottom: 0.18, tessellation: 18 }, scene);
  leftThigh.parent = leftLegPivot;
  leftThigh.position = new Vector3(0, -0.25, 0);
  leftThigh.material = skinMat;

  const leftShin = MeshBuilder.CreateCylinder('leftShin', { height: 0.55, diameterTop: 0.16, diameterBottom: 0.12, tessellation: 18 }, scene);
  leftShin.parent = leftLegPivot;
  leftShin.position = new Vector3(0, -0.78, 0);
  leftShin.material = skinMat;

  const rightLegPivot = new TransformNode('rightLegPivot', scene);
  rightLegPivot.parent = root;
  rightLegPivot.position = new Vector3(0.15, 0.8, 0);
  rightLegPivot.rotation = currentPose.rightLeg;

  const rightThigh = MeshBuilder.CreateCylinder('rightThigh', { height: 0.5, diameterTop: 0.22, diameterBottom: 0.18, tessellation: 18 }, scene);
  rightThigh.parent = rightLegPivot;
  rightThigh.position = new Vector3(0, -0.25, 0);
  rightThigh.material = skinMat;

  const rightShin = MeshBuilder.CreateCylinder('rightShin', { height: 0.55, diameterTop: 0.16, diameterBottom: 0.12, tessellation: 18 }, scene);
  rightShin.parent = rightLegPivot;
  rightShin.position = new Vector3(0, -0.78, 0);
  rightShin.material = skinMat;

  // Set-specific accent (simple)
  if (set.type === 'magical') {
    const staff = MeshBuilder.CreateCylinder('staff', { height: 1.5, diameter: 0.04, tessellation: 12 }, scene);
    staff.parent = root;
    staff.position = new Vector3(0.65, 1.1, 0.2);
    staff.rotation = new Vector3(0, 0, Math.PI / 6);
    staff.material = accentMat;
  }

  return root;
}

async function loadModel(scene: Scene, url: string) {
  const result = await SceneLoader.ImportMeshAsync(null, '', url, scene);

  // Start first animation group if present
  if (scene.animationGroups.length > 0) {
    scene.animationGroups[0].start(true);
  }

  const meshes = result.meshes.filter((m): m is AbstractMesh => (m as AbstractMesh).getBoundingInfo !== undefined);
  const root = new TransformNode('customModelRoot', scene);
  meshes.forEach((m) => {
    if (m.parent == null) m.parent = root;
  });

  // Fit model to ~2 units height and sit on ground
  const { min, max } = root.getHierarchyBoundingVectors(true);
  const size = max.subtract(min);
  const height = Math.max(size.y, 1e-6);
  const scale = 2 / height;
  root.scaling = new Vector3(scale, scale, scale);

  // After scaling, recompute bounds
  const b2 = root.getHierarchyBoundingVectors(true);
  const center = b2.min.add(b2.max).scale(0.5);
  root.position = new Vector3(-center.x, -b2.min.y, -center.z);

  return root;
}

export const BabylonScene: React.FC<BabylonSceneProps> = ({
  customModelUrl = null,
  set,
  skinColor,
  pose,
  scenePreset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const contentRootRef = useRef<TransformNode | null>(null);
  const shadowGenRef = useRef<ShadowGenerator | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new Scene(engine);
    sceneRef.current = scene;
    scene.clearColor.set(0, 0, 0, 1);

    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 4, new Vector3(0, 1.2, 0), scene);
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 6;
    camera.lowerBetaLimit = Math.PI / 4;
    camera.upperBetaLimit = Math.PI / 1.5;
    camera.attachControl(canvas, true);

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;

    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.position = new Vector3(10, 10, 10);
    dir.intensity = 1.0;

    const shadowGen = new ShadowGenerator(1024, dir);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 16;
    shadowGenRef.current = shadowGen;

    const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10, subdivisions: 2 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -0.2;
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;

    // Scene preset tweaks (very lightweight)
    if (scenePreset === 'jungle') {
      hemi.diffuse = new Color3(0.85, 1.0, 0.85);
      groundMat.diffuseColor = new Color3(0.03, 0.05, 0.03);
    } else if (scenePreset === 'tomb') {
      hemi.intensity = 0.35;
      hemi.diffuse = new Color3(0.8, 0.8, 1.0);
      groundMat.diffuseColor = new Color3(0.03, 0.03, 0.05);
    }

    // Float/bob effect for avatar/model root
    let t0 = performance.now();
    scene.onBeforeRenderObservable.add(() => {
      const node = contentRootRef.current;
      if (!node) return;
      const t = (performance.now() - t0) / 1000;
      node.position.y = Math.sin(t) * 0.03;
    });

    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      scene.dispose();
      engine.dispose();
      shadowGenRef.current = null;
      contentRootRef.current = null;
      sceneRef.current = null;
      engineRef.current = null;
    };
  }, [scenePreset]);

  useEffect(() => {
    const scene = sceneRef.current;
    const shadowGen = shadowGenRef.current;
    if (!scene || !shadowGen) return;

    const prev = contentRootRef.current;
    if (prev) {
      shadowGen.getShadowMap()?.renderList?.splice(0);
      disposeNodeDeep(prev);
      contentRootRef.current = null;
    }

    let cancelled = false;

    const attachShadows = (root: TransformNode) => {
      root.getChildMeshes(true).forEach((m) => shadowGen.addShadowCaster(m, true));
    };

    (async () => {
      try {
        const root = customModelUrl
          ? await loadModel(scene, customModelUrl)
          : buildAvatar(scene, set, skinColor, pose);

        if (cancelled) {
          root.dispose(false, true);
          return;
        }

        contentRootRef.current = root;
        attachShadows(root);
      } catch (e) {
        // If model load fails, fall back to avatar so the scene is never empty
        const fallback = buildAvatar(scene, set, skinColor, pose);
        if (cancelled) {
          fallback.dispose(false, true);
          return;
        }
        contentRootRef.current = fallback;
        attachShadows(fallback);
        // eslint-disable-next-line no-console
        console.error('BabylonScene content load failed:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customModelUrl, set, skinColor, pose]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

