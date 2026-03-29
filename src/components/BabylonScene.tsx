import React, { useEffect, useRef } from 'react';
import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  ImageProcessingConfiguration,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

import type { BodySlot } from '../characterParts';
import { defaultCompositeParts } from '../characterParts';
import {
  getCompositeFrameVectors,
  loadCompositeCharacter,
  loadFullBodyCharacter,
} from '../compositeCharacter';

interface BabylonSceneProps {
  parts: Record<BodySlot, string>;
  scenePreset: 'studio' | 'jungle' | 'tomb' | 'sunset' | 'neon' | 'arctic';
}

function disposeNodeDeep(node: TransformNode) {
  node.getChildTransformNodes(true).forEach((n) => n.dispose(false, true));
  node.getChildMeshes(true).forEach((m) => m.dispose(false, true));
  node.dispose(false, true);
}

function frameCameraOnCharacter(camera: ArcRotateCamera, root: TransformNode) {
  const { center, ext } = getCompositeFrameVectors(root);
  camera.setTarget(center);
  const half = Math.max(ext.x, ext.y, ext.z, 0.35);
  const fitRadius = half * 2.75;
  camera.radius = Math.min(Math.max(fitRadius, 2.4), 14);
  camera.lowerRadiusLimit = Math.min(1.6, camera.radius * 0.4);
  camera.upperRadiusLimit = Math.max(16, camera.radius * 2.8);
}

export const BabylonScene: React.FC<BabylonSceneProps> = ({ parts, scenePreset }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contentRootRef = useRef<TransformNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true }, true);
    const scene = new Scene(engine);
    scene.clearColor.set(0.01, 0.01, 0.02, 1);
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    scene.imageProcessingConfiguration.exposure = 1.05;
    scene.imageProcessingConfiguration.contrast = 1.08;

    const camera = new ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 4, Vector3.Zero(), scene);
    camera.lowerBetaLimit = Math.PI / 6;
    camera.upperBetaLimit = Math.PI / 2.15;
    camera.attachControl(canvas, true);

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;

    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), scene);
    dir.position = new Vector3(10, 10, 10);
    dir.intensity = 1.0;

    const shadowGen = new ShadowGenerator(2048, dir);
    shadowGen.usePercentageCloserFiltering = true;
    shadowGen.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    shadowGen.bias = 0.0003;
    shadowGen.normalBias = 0.015;

    const ground = MeshBuilder.CreateGround('ground', { width: 10, height: 10, subdivisions: 2 }, scene);
    ground.receiveShadows = true;
    ground.position.y = -0.2;
    const groundMat = new StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new Color3(0.02, 0.02, 0.02);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;

    if (scenePreset === 'jungle') {
      scene.clearColor.set(0.015, 0.03, 0.02, 1);
      hemi.intensity = 0.75;
      hemi.diffuse = new Color3(0.82, 1.0, 0.86);
      dir.intensity = 0.95;
      groundMat.diffuseColor = new Color3(0.03, 0.06, 0.04);
    } else if (scenePreset === 'tomb') {
      scene.clearColor.set(0.01, 0.015, 0.03, 1);
      hemi.intensity = 0.35;
      hemi.diffuse = new Color3(0.78, 0.8, 1.0);
      dir.intensity = 0.85;
      groundMat.diffuseColor = new Color3(0.03, 0.03, 0.05);
    } else if (scenePreset === 'sunset') {
      scene.clearColor.set(0.09, 0.03, 0.015, 1);
      hemi.intensity = 0.7;
      hemi.diffuse = new Color3(1.0, 0.7, 0.55);
      dir.intensity = 1.15;
      dir.direction = new Vector3(-0.4, -1.0, -0.25);
      groundMat.diffuseColor = new Color3(0.11, 0.05, 0.03);
    } else if (scenePreset === 'neon') {
      scene.clearColor.set(0.005, 0.005, 0.02, 1);
      hemi.intensity = 0.9;
      hemi.diffuse = new Color3(0.65, 0.8, 1.0);
      hemi.groundColor = new Color3(1.0, 0.25, 0.8);
      dir.intensity = 0.7;
      groundMat.diffuseColor = new Color3(0.02, 0.02, 0.06);
    } else if (scenePreset === 'arctic') {
      scene.clearColor.set(0.02, 0.045, 0.08, 1);
      hemi.intensity = 0.9;
      hemi.diffuse = new Color3(0.86, 0.94, 1.0);
      hemi.groundColor = new Color3(0.5, 0.62, 0.75);
      dir.intensity = 1.05;
      groundMat.diffuseColor = new Color3(0.11, 0.14, 0.18);
    }

    let t0 = performance.now();
    let bobBaseY = 0;
    scene.onBeforeRenderObservable.add(() => {
      const node = contentRootRef.current;
      if (!node || node.isDisposed()) return;
      const t = (performance.now() - t0) / 1000;
      node.position.y = bobBaseY + Math.sin(t) * 0.03;
    });

    const attachShadows = (root: TransformNode) => {
      shadowGen.getShadowMap()?.renderList?.splice(0);
      const textureKeys = [
        'albedoTexture',
        'baseTexture',
        'diffuseTexture',
        'metallicTexture',
        'bumpTexture',
        'normalTexture',
        'ambientTexture',
        'emissiveTexture',
        'opacityTexture',
      ];
      root.getChildMeshes(true).forEach((m) => {
        shadowGen.addShadowCaster(m, true);
        const mat = m.material;
        if (mat && typeof mat === 'object') {
          const matRecord = mat as unknown as Record<string, unknown>;
          for (const key of textureKeys) {
            const tex = matRecord[key];
            if (tex && typeof tex === 'object' && 'anisotropicFilteringLevel' in tex) {
              (tex as { anisotropicFilteringLevel: number }).anisotropicFilteringLevel = 8;
            }
          }
        }
      });
    };

    void (async () => {
      try {
        const root = await loadCompositeCharacter(scene, parts);
        if (cancelled) {
          root.dispose(false, true);
          return;
        }
        contentRootRef.current = root;
        bobBaseY = root.position.y;
        frameCameraOnCharacter(camera, root);
        attachShadows(root);
      } catch (e) {
        console.error('Composite load failed, trying full-body fallback:', e);
        try {
          const root = await loadFullBodyCharacter(scene, defaultCompositeParts().body);
          if (cancelled) {
            root.dispose(false, true);
            return;
          }
          contentRootRef.current = root;
          bobBaseY = root.position.y;
          frameCameraOnCharacter(camera, root);
          attachShadows(root);
        } catch (e2) {
          console.error('Full-body fallback failed:', e2);
        }
      }
    })();

    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      contentRootRef.current = null;
      window.removeEventListener('resize', onResize);
      scene.dispose();
      engine.dispose();
    };
  }, [parts, scenePreset]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};
