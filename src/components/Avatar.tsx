import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshWobbleMaterial, Sphere, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { CosplaySet, PoseType } from '../types';

interface AvatarProps {
  set: CosplaySet;
  skinColor: string;
  pose: PoseType;
}

export const Avatar: React.FC<AvatarProps> = ({ set, skinColor, pose }) => {
  const groupRef = useRef<THREE.Group>(null);
  const hairColor = "#3d2b1f";

  // Pose definitions
  const limbRotations = {
    idle: {
      leftArm: [0, 0, 0.15],
      rightArm: [0, 0, -0.15],
      leftLeg: [0, 0, 0],
      rightLeg: [0, 0, 0],
      head: [0, 0, 0],
    },
    ready: {
      leftArm: [0.5, 0, 0.4],
      rightArm: [-0.2, 0, -0.6],
      leftLeg: [0.2, 0, -0.1],
      rightLeg: [-0.2, 0, 0.1],
      head: [0.1, 0, 0],
    },
    survivor: {
      leftArm: [0.8, 0.5, 0.2],
      rightArm: [0.8, -0.5, -0.2],
      leftLeg: [0.1, 0, 0.05],
      rightLeg: [0, 0, -0.05],
      head: [0.1, 0.2, 0.1],
    }
  };

  const currentPose = limbRotations[pose] || limbRotations.idle;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head & Face */}
      <group position={[0, 1.7, 0]} rotation={currentPose.head as any}>
        <Sphere args={[0.16, 32, 32]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
        
        {/* Hair - Modern Survivor Style */}
        <group position={[0, 0.05, -0.05]}>
          <Sphere args={[0.19, 32, 32]} scale={[1, 1.1, 1.15]}>
            <meshStandardMaterial color={hairColor} roughness={0.9} />
          </Sphere>
          {/* Ponytail Base */}
          <Sphere args={[0.06]} position={[0, 0.08, -0.2]}>
            <meshStandardMaterial color={hairColor} />
          </Sphere>
          {/* Long Flowing Ponytail */}
          <group position={[0, 0.08, -0.22]}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Sphere 
                key={i} 
                args={[0.07 - i * 0.01]} 
                position={[Math.sin(i * 0.4 + Date.now() * 0.0005) * 0.03, -i * 0.18, -i * 0.04]}
              >
                <meshStandardMaterial color={hairColor} />
              </Sphere>
            ))}
          </group>
        </group>

        {/* Face Details */}
        <group position={[0, 0.02, 0.14]}>
          {/* Eyebrows */}
          <Box args={[0.04, 0.005, 0.01]} position={[-0.05, 0.06, 0.01]} rotation={[0, 0, 0.1]}>
            <meshStandardMaterial color="#222" />
          </Box>
          <Box args={[0.04, 0.005, 0.01]} position={[0.05, 0.06, 0.01]} rotation={[0, 0, -0.1]}>
            <meshStandardMaterial color="#222" />
          </Box>
          {/* Eyes */}
          <Sphere args={[0.018]} position={[-0.05, 0, 0]}>
            <meshStandardMaterial color="#111" />
          </Sphere>
          <Sphere args={[0.018]} position={[0.05, 0, 0]}>
            <meshStandardMaterial color="#111" />
          </Sphere>
        </group>
        {/* Nose - More Defined */}
        <Box args={[0.015, 0.05, 0.04]} position={[0, -0.02, 0.16]} rotation={[0.2, 0, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Box>
        {/* Lips */}
        <Box args={[0.05, 0.018, 0.01]} position={[0, -0.09, 0.15]}>
          <meshStandardMaterial color="#a44" />
        </Box>
      </group>

      {/* Neck */}
      <group position={[0, 1.55, 0]}>
        <Cylinder args={[0.035, 0.045, 0.12]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        {/* Jade Necklace */}
        <Torus args={[0.05, 0.005, 16, 32]} position={[0, -0.02, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
          <meshStandardMaterial color="#111" />
        </Torus>
        <Sphere args={[0.015]} position={[0, -0.05, 0.05]}>
          <meshStandardMaterial color="#2e8b57" emissive="#1a4d30" emissiveIntensity={0.5} />
        </Sphere>
      </group>

      {/* Torso - Modern Survivor Build */}
      <group position={[0, 1.15, 0]}>
        {/* Shoulders */}
        <Box args={[0.52, 0.12, 0.22]} position={[0, 0.35, 0]}>
          <meshStandardMaterial color={set.secondaryColor} />
        </Box>
        {/* Dirt marks on shoulders */}
        <Box args={[0.05, 0.02, 0.05]} position={[-0.15, 0.42, 0.05]}>
          <meshStandardMaterial color="#3d2b1f" transparent opacity={0.4} />
        </Box>
        <Box args={[0.03, 0.01, 0.03]} position={[0.18, 0.42, -0.05]}>
          <meshStandardMaterial color="#3d2b1f" transparent opacity={0.4} />
        </Box>
        {/* Upper Chest */}
        <Cylinder args={[0.23, 0.17, 0.4, 32]} position={[0, 0.2, 0]}>
          <meshStandardMaterial color={set.secondaryColor} />
        </Cylinder>
        {/* Bust */}
        <group position={[0, 0.25, 0.13]}>
          <Sphere args={[0.1]} position={[-0.08, 0, 0]}>
            <meshStandardMaterial color={set.secondaryColor} />
          </Sphere>
          <Sphere args={[0.1]} position={[0.08, 0, 0]}>
            <meshStandardMaterial color={set.secondaryColor} />
          </Sphere>
        </group>
        {/* Backpack */}
        <Box args={[0.35, 0.4, 0.15]} position={[0, 0.15, -0.18]}>
          <meshStandardMaterial color="#333" />
        </Box>
        {/* Straps */}
        <group position={[0, 0.2, 0]}>
          <Box args={[0.05, 0.5, 0.25]} position={[-0.18, 0.1, 0]} rotation={[0, 0, 0.3]}>
            <meshStandardMaterial color="#111" />
          </Box>
          <Box args={[0.05, 0.5, 0.25]} position={[0.18, 0.1, 0]} rotation={[0, 0, -0.3]}>
            <meshStandardMaterial color="#111" />
          </Box>
        </group>
        {/* Waist */}
        <Cylinder args={[0.15, 0.22, 0.3, 32]} position={[0, -0.1, 0]}>
          <meshStandardMaterial color={set.primaryColor} />
        </Cylinder>
        {/* Hips */}
        <Sphere args={[0.28, 32, 32]} position={[0, -0.25, 0]} scale={[1, 0.85, 1.1]}>
          <meshStandardMaterial color={set.primaryColor} />
        </Sphere>
        {/* Belt & Pouches */}
        <group position={[0, -0.2, 0]}>
          <Torus args={[0.28, 0.03, 16, 32]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#111" />
          </Torus>
          <Box args={[0.1, 0.12, 0.05]} position={[0.2, 0, 0.2]}>
            <meshStandardMaterial color="#222" />
          </Box>
          <Box args={[0.08, 0.1, 0.05]} position={[-0.2, 0, 0.2]}>
            <meshStandardMaterial color="#222" />
          </Box>
        </group>
      </group>

      {/* Arms */}
      <group position={[-0.3, 1.45, 0]} rotation={currentPose.leftArm as any}>
        <Cylinder args={[0.045, 0.035, 0.4]} position={[0, -0.2, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        <Sphere args={[0.04]} position={[0, -0.4, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
        <Cylinder args={[0.035, 0.03, 0.4]} position={[0, -0.6, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        {/* Bandage on arm */}
        <Cylinder args={[0.038, 0.038, 0.1]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color="#eee" roughness={1} />
        </Cylinder>
        <Sphere args={[0.05]} position={[0, -0.8, 0]} scale={[1, 1.2, 0.8]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
      </group>
      <group position={[0.3, 1.45, 0]} rotation={currentPose.rightArm as any}>
        <Cylinder args={[0.045, 0.035, 0.4]} position={[0, -0.2, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        <Sphere args={[0.04]} position={[0, -0.4, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
        <Cylinder args={[0.035, 0.03, 0.4]} position={[0, -0.6, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        <Sphere args={[0.05]} position={[0, -0.8, 0]} scale={[1, 1.2, 0.8]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
      </group>

      {/* Legs & Holsters */}
      <group position={[-0.15, 0.8, 0]} rotation={currentPose.leftLeg as any}>
        <Cylinder args={[0.11, 0.09, 0.5]} position={[0, -0.25, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        {/* Holster Left */}
        <group position={[-0.1, -0.2, 0]} rotation={[0, 0, 0.1]}>
          <Box args={[0.08, 0.2, 0.15]}>
            <meshStandardMaterial color="#111" />
          </Box>
          <Box args={[0.12, 0.02, 0.16]} position={[0, 0.08, 0]}>
            <meshStandardMaterial color="#222" />
          </Box>
        </group>
        <Sphere args={[0.08]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
        <Cylinder args={[0.08, 0.06, 0.5]} position={[0, -0.75, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        <group position={[0, -1.1, 0.05]}>
          <Cylinder args={[0.07, 0.08, 0.3, 16]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </Cylinder>
          <Box args={[0.15, 0.1, 0.25]} position={[0, -0.1, 0.05]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </Box>
        </group>
      </group>
      <group position={[0.15, 0.8, 0]} rotation={currentPose.rightLeg as any}>
        <Cylinder args={[0.11, 0.09, 0.5]} position={[0, -0.25, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        {/* Holster Right */}
        <group position={[0.1, -0.2, 0]} rotation={[0, 0, -0.1]}>
          <Box args={[0.08, 0.2, 0.15]}>
            <meshStandardMaterial color="#111" />
          </Box>
          <Box args={[0.12, 0.02, 0.16]} position={[0, 0.08, 0]}>
            <meshStandardMaterial color="#222" />
          </Box>
        </group>
        <Sphere args={[0.08]} position={[0, -0.5, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Sphere>
        <Cylinder args={[0.08, 0.06, 0.5]} position={[0, -0.75, 0]}>
          <meshStandardMaterial color={skinColor} />
        </Cylinder>
        <group position={[0, -1.1, 0.05]}>
          <Cylinder args={[0.07, 0.08, 0.3, 16]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </Cylinder>
          <Box args={[0.15, 0.1, 0.25]} position={[0, -0.1, 0.05]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
          </Box>
        </group>
      </group>

      {/* Set Specific Accessories */}
      {set.type === 'magical' && (
        <group position={[0.6, 1.4, 0.3]}>
          <Cylinder args={[0.02, 0.02, 1.5]} rotation={[0, 0, Math.PI / 6]}>
            <meshStandardMaterial color={set.accentColor} />
          </Cylinder>
          <Sphere args={[0.15]} position={[0.4, 0.7, 0]}>
            <MeshWobbleMaterial color={set.accentColor} factor={0.5} speed={2} />
          </Sphere>
          {set.id === 'dark-sorcerer' && (
            <Torus args={[0.3, 0.01, 16, 100]} position={[-0.6, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <meshStandardMaterial color={set.accentColor} emissive={set.accentColor} emissiveIntensity={5} />
            </Torus>
          )}
        </group>
      )}

      {set.type === 'cyber' && (
        <group>
          <Torus args={[0.45, 0.02, 16, 100]} position={[0, 1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color={set.accentColor} emissive={set.accentColor} emissiveIntensity={2} />
          </Torus>
          <Box args={[0.1, 0.8, 0.05]} position={[0.7, 0.8, -0.2]} rotation={[0, 0, -Math.PI / 8]}>
            <meshStandardMaterial color="#333" />
          </Box>
          {set.id === 'space-explorer' && (
            <Sphere args={[0.42, 32, 32]} position={[0, 1.6, 0.1]}>
              <meshStandardMaterial color={set.accentColor} transparent opacity={0.3} metalness={1} roughness={0} />
            </Sphere>
          )}
        </group>
      )}

      {set.type === 'fantasy' && (
        <group>
          <Box args={[0.7, 0.2, 0.7]} position={[0, 1.3, 0]}>
            <meshStandardMaterial color={set.primaryColor} metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.1, 1.2, 0.05]} position={[0.7, 0.8, 0.2]} rotation={[0, 0, Math.PI / 10]}>
            <meshStandardMaterial color={set.primaryColor} metalness={0.9} roughness={0.1} />
          </Box>
        </group>
      )}
    </group>
  );
};
