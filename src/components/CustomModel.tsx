import React, { useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface CustomModelProps {
  url: string;
}

export const CustomModel: React.FC<CustomModelProps> = ({ url }) => {
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    // Play the first animation if available
    if (animations.length > 0) {
      const firstAction = actions[Object.keys(actions)[0]];
      if (firstAction) {
        firstAction.play();
      }
    }

    // Auto-center and scale the model
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Scale to fit roughly 2 units height
    const scale = 2 / size.y;
    scene.scale.setScalar(scale);
    
    // Center horizontally, but keep bottom at y=0
    scene.position.x = -center.x * scale;
    scene.position.y = -box.min.y * scale;
    scene.position.z = -center.z * scale;

    // Cast shadows
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, animations, actions]);

  return <primitive object={scene} />;
};

// Preload the model if needed
// useGLTF.preload(url);
