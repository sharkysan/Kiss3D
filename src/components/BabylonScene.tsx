import React, { useEffect, useRef } from 'react';
import {
  ArcRotateCamera,
  Color3,
  DirectionalLight,
  Engine,
  HemisphericLight,
  ImageProcessingConfiguration,
  MeshBuilder,
  type Node,
  Scene,
  SceneLoader,
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

function makeMat(
  scene: Scene,
  name: string,
  diffuse: Color3,
  specular: Color3 = new Color3(0.08, 0.08, 0.08),
  emissive: Color3 = Color3.Black(),
) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = diffuse;
  mat.specularColor = specular;
  mat.emissiveColor = emissive;
  return mat;
}

function styleBackgroundMesh(shadowGen: ShadowGenerator, mesh: { isPickable: boolean; receiveShadows: boolean }) {
  mesh.isPickable = false;
  mesh.receiveShadows = true;
  shadowGen.addShadowCaster(mesh as never, false);
}

function getTopAncestor(node: Node): Node {
  let n: Node = node;
  while (n.parent) n = n.parent;
  return n;
}

function parseAssetUrl(url: string) {
  const u = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
  const pathname = decodeURIComponent(u.pathname);
  const ix = pathname.lastIndexOf('/');
  const sceneFilename = pathname.slice(ix + 1);
  return {
    rootUrl: u.origin + pathname.slice(0, ix + 1),
    sceneFilename,
  };
}

type InternetPropConfig = {
  url: string;
  scale: number;
  position: Vector3;
  rotationY?: number;
};

const INTERNET_PRESET_PROP: Record<BabylonSceneProps['scenePreset'], InternetPropConfig> = {
  studio: {
    url: 'https://assets.babylonjs.com/meshes/shaderBall.glb',
    scale: 1.4,
    position: new Vector3(0, -0.18, 5.8),
  },
  jungle: {
    url: 'https://assets.babylonjs.com/meshes/village.glb',
    scale: 0.62,
    position: new Vector3(0, -0.18, 6.6),
  },
  tomb: {
    url: 'https://assets.babylonjs.com/meshes/graveYardPack/coffin/coffin.glb',
    scale: 2.8,
    position: new Vector3(0, -0.18, 5.6),
  },
  sunset: {
    url: 'https://assets.babylonjs.com/meshes/pirateFort/cannon.glb',
    scale: 2.0,
    position: new Vector3(0, -0.18, 5.9),
    rotationY: Math.PI * 0.08,
  },
  neon: {
    url: 'https://assets.babylonjs.com/meshes/TrailMeshSpell/spellDisk.glb',
    scale: 1.1,
    position: new Vector3(0, 0.2, 5.7),
  },
  arctic: {
    url: 'https://assets.babylonjs.com/meshes/Demos/Snow_Man_Scene/snowMan.glb',
    scale: 1.05,
    position: new Vector3(0, -0.18, 6.0),
  },
};

async function loadInternetBackgroundProp(
  scene: Scene,
  preset: BabylonSceneProps['scenePreset'],
  shadowGen: ShadowGenerator,
  parentRoot: TransformNode,
) {
  const config = INTERNET_PRESET_PROP[preset];
  if (!config) return;

  try {
    const countBefore = scene.meshes.length;
    const { rootUrl, sceneFilename } = parseAssetUrl(config.url);
    await SceneLoader.ImportMeshAsync(null, rootUrl, sceneFilename, scene);
    const importedMeshes = scene.meshes.slice(countBefore);
    if (importedMeshes.length === 0) return;

    const importRoot = getTopAncestor(importedMeshes[0]);
    const propRoot = new TransformNode(`internetProp_${preset}`, scene);
    propRoot.parent = parentRoot;
    propRoot.position.copyFrom(config.position);
    propRoot.scaling.copyFromFloats(config.scale, config.scale, config.scale);
    if (config.rotationY) {
      propRoot.rotation.y = config.rotationY;
    }

    importRoot.parent = propRoot;
    importedMeshes.forEach((m) => styleBackgroundMesh(shadowGen, m));
  } catch (err) {
    console.warn(`Background internet prop failed for preset "${preset}":`, err);
  }
}

function createBackgroundProps(scene: Scene, scenePreset: BabylonSceneProps['scenePreset'], shadowGen: ShadowGenerator) {
  const root = new TransformNode('backgroundProps', scene);

  const place = (x: number, z: number) => new Vector3(x, -0.2, z);

  if (scenePreset === 'studio') {
    const panelMat = makeMat(scene, 'studioPanelMat', new Color3(0.06, 0.06, 0.08), Color3.Black());
    for (const [i, x] of [-5.2, 5.2].entries()) {
      const panel = MeshBuilder.CreateBox(`studioPanel${i}`, { width: 1.2, height: 3.4, depth: 0.16 }, scene);
      panel.position = place(x, -1.1);
      panel.position.y = 1.4;
      panel.material = panelMat;
      panel.parent = root;
      styleBackgroundMesh(shadowGen, panel);
    }
  } else if (scenePreset === 'jungle') {
    const trunkMat = makeMat(scene, 'jungleTrunkMat', new Color3(0.18, 0.1, 0.05), Color3.Black());
    const leafMat = makeMat(scene, 'jungleLeafMat', new Color3(0.08, 0.28, 0.12), Color3.Black());
    const rockMat = makeMat(scene, 'jungleRockMat', new Color3(0.07, 0.1, 0.08), Color3.Black());
    const treePos: Array<[number, number]> = [
      [-5.6, -1.2],
      [5.3, -0.9],
      [-4.8, 2.8],
      [4.6, 3.4],
    ];
    treePos.forEach(([x, z], i) => {
      const trunk = MeshBuilder.CreateCylinder(`jungleTrunk${i}`, { diameter: 0.36, height: 2.0 }, scene);
      trunk.position = place(x, z);
      trunk.position.y = 0.8;
      trunk.material = trunkMat;
      trunk.parent = root;
      styleBackgroundMesh(shadowGen, trunk);

      const crown = MeshBuilder.CreateSphere(`jungleCrown${i}`, { diameter: 1.6 }, scene);
      crown.position = place(x, z);
      crown.position.y = 2.0;
      crown.material = leafMat;
      crown.parent = root;
      styleBackgroundMesh(shadowGen, crown);
    });
    for (const [i, x] of [-3.1, 2.7].entries()) {
      const rock = MeshBuilder.CreateBox(`jungleRock${i}`, { width: 1.1, height: 0.55, depth: 0.9 }, scene);
      rock.position = place(x, 4.6);
      rock.position.y = 0.08;
      rock.material = rockMat;
      rock.parent = root;
      styleBackgroundMesh(shadowGen, rock);
    }
  } else if (scenePreset === 'tomb') {
    const columnMat = makeMat(scene, 'tombColumnMat', new Color3(0.14, 0.14, 0.17), Color3.Black());
    const glyphMat = makeMat(scene, 'tombGlyphMat', new Color3(0.1, 0.1, 0.14), Color3.Black(), new Color3(0.08, 0.12, 0.22));
    const colPos: Array<[number, number]> = [
      [-4.6, -0.8],
      [4.6, -0.8],
      [-4.2, 3.1],
      [4.2, 3.1],
    ];
    colPos.forEach(([x, z], i) => {
      const col = MeshBuilder.CreateCylinder(`tombColumn${i}`, { diameter: 0.52, height: 2.6, tessellation: 8 }, scene);
      col.position = place(x, z);
      col.position.y = 1.1;
      col.material = columnMat;
      col.parent = root;
      styleBackgroundMesh(shadowGen, col);
    });
    const glyph = MeshBuilder.CreateTorus('tombGlyph', { diameter: 2.2, thickness: 0.12, tessellation: 24 }, scene);
    glyph.position = place(0, 5.4);
    glyph.position.y = 1.2;
    glyph.rotation.x = Math.PI / 2.2;
    glyph.material = glyphMat;
    glyph.parent = root;
    styleBackgroundMesh(shadowGen, glyph);
  } else if (scenePreset === 'sunset') {
    const spireMat = makeMat(scene, 'sunsetSpireMat', new Color3(0.22, 0.1, 0.06), Color3.Black());
    const duneMat = makeMat(scene, 'sunsetDuneMat', new Color3(0.18, 0.09, 0.05), Color3.Black());
    const spirePos: Array<[number, number, number]> = [
      [-5.0, 0.8, 2.2],
      [5.2, 1.0, 2.5],
      [0.0, 6.3, 1.7],
    ];
    spirePos.forEach(([x, z, h], i) => {
      const spire = MeshBuilder.CreateCylinder(`sunsetSpire${i}`, { diameterTop: 0.15, diameterBottom: 0.95, height: h }, scene);
      spire.position = place(x, z);
      spire.position.y = h * 0.45;
      spire.material = spireMat;
      spire.parent = root;
      styleBackgroundMesh(shadowGen, spire);
    });
    const dune = MeshBuilder.CreateSphere('sunsetDune', { diameterX: 9.5, diameterY: 1.2, diameterZ: 4.5, segments: 18 }, scene);
    dune.position = place(0, 6.4);
    dune.position.y = -0.02;
    dune.material = duneMat;
    dune.parent = root;
    styleBackgroundMesh(shadowGen, dune);
  } else if (scenePreset === 'neon') {
    const pillarMat = makeMat(scene, 'neonPillarMat', new Color3(0.03, 0.03, 0.08), Color3.Black(), new Color3(0.15, 0.04, 0.25));
    const ringMat = makeMat(scene, 'neonRingMat', new Color3(0.02, 0.02, 0.07), Color3.Black(), new Color3(0.0, 0.45, 0.65));
    const pillarPos: Array<[number, number]> = [
      [-5.2, 0.4],
      [5.2, 0.4],
      [-3.8, 4.3],
      [3.8, 4.3],
    ];
    pillarPos.forEach(([x, z], i) => {
      const pillar = MeshBuilder.CreateCylinder(`neonPillar${i}`, { diameter: 0.28, height: 3.2, tessellation: 12 }, scene);
      pillar.position = place(x, z);
      pillar.position.y = 1.4;
      pillar.material = pillarMat;
      pillar.parent = root;
      styleBackgroundMesh(shadowGen, pillar);
    });
    const ring = MeshBuilder.CreateTorus('neonRing', { diameter: 6.4, thickness: 0.1, tessellation: 56 }, scene);
    ring.position = place(0, 4.9);
    ring.position.y = 1.1;
    ring.rotation.x = Math.PI / 2;
    ring.material = ringMat;
    ring.parent = root;
    styleBackgroundMesh(shadowGen, ring);
  } else if (scenePreset === 'arctic') {
    const iceMat = makeMat(scene, 'arcticIceMat', new Color3(0.5, 0.72, 0.88), Color3.Black(), new Color3(0.05, 0.1, 0.14));
    const chunkMat = makeMat(scene, 'arcticChunkMat', new Color3(0.36, 0.5, 0.6), Color3.Black());
    const crystalPos: Array<[number, number, number]> = [
      [-5.0, -0.8, 2.3],
      [5.2, -0.6, 2.0],
      [-3.5, 4.8, 1.6],
      [3.7, 5.0, 1.8],
      [0.0, 6.4, 2.4],
    ];
    crystalPos.forEach(([x, z, h], i) => {
      const crystal = MeshBuilder.CreateCylinder(`arcticCrystal${i}`, { diameterTop: 0.05, diameterBottom: 0.6, height: h, tessellation: 6 }, scene);
      crystal.position = place(x, z);
      crystal.position.y = h * 0.42;
      crystal.material = iceMat;
      crystal.parent = root;
      styleBackgroundMesh(shadowGen, crystal);
    });
    const chunk = MeshBuilder.CreateBox('arcticChunk', { width: 1.8, height: 0.35, depth: 1.1 }, scene);
    chunk.position = place(-1.8, 5.6);
    chunk.position.y = -0.03;
    chunk.material = chunkMat;
    chunk.parent = root;
    styleBackgroundMesh(shadowGen, chunk);
  }

  return root;
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

    const backgroundRoot = createBackgroundProps(scene, scenePreset, shadowGen);
    void loadInternetBackgroundProp(scene, scenePreset, shadowGen, backgroundRoot);

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
