import React from 'react';

export interface CosplaySet {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  type: 'magical' | 'cyber' | 'fantasy';
}

export type PoseType = 'idle' | 'ready' | 'survivor';

export interface Pose {
  id: PoseType;
  name: string;
}

export const POSES: Pose[] = [
  { id: 'idle', name: 'Standard' },
  { id: 'ready', name: 'Ready' },
  { id: 'survivor', name: 'Survivor' },
];

export const COSPLAY_SETS: CosplaySet[] = [
  {
    id: 'magical-girl',
    name: 'Magical Girl',
    description: 'A sparkling outfit for the defender of love and justice.',
    primaryColor: '#ffb7c5', // Sakura Pink
    secondaryColor: '#ffffff',
    accentColor: '#ffd700', // Gold
    type: 'magical',
  },
  {
    id: 'cyber-ninja',
    name: 'Cyber Ninja',
    description: 'Stealthy gear enhanced with high-tech neon circuits.',
    primaryColor: '#1a1a1a', // Dark Gray
    secondaryColor: '#00ffff', // Cyan
    accentColor: '#ff00ff', // Magenta
    type: 'cyber',
  },
  {
    id: 'fantasy-knight',
    name: 'Fantasy Knight',
    description: 'Heavy armor forged for the bravest of heroes.',
    primaryColor: '#c0c0c0', // Silver
    secondaryColor: '#4169e1', // Royal Blue
    accentColor: '#ffd700', // Gold
    type: 'fantasy',
  },
  {
    id: 'dark-sorcerer',
    name: 'Dark Sorcerer',
    description: 'Ancient robes imbued with shadow magic and forbidden knowledge.',
    primaryColor: '#2b1b3d', // Deep Purple
    secondaryColor: '#000000',
    accentColor: '#9400d3', // Dark Violet
    type: 'magical',
  },
  {
    id: 'space-explorer',
    name: 'Space Explorer',
    description: 'A pressurized suit designed for the farthest reaches of the galaxy.',
    primaryColor: '#ffffff', // White
    secondaryColor: '#ff4500', // Orange Red
    accentColor: '#4682b4', // Steel Blue
    type: 'cyber',
  },
  {
    id: 'tomb-explorer',
    name: 'Tomb Explorer',
    description: 'Modern survivor gear with dual holsters, tactical backpack, and athletic apparel.',
    primaryColor: '#4a3728', // Dark Brown (Shorts)
    secondaryColor: '#4682b4', // Steel Blue/Teal (Tank top)
    accentColor: '#212121', // Black (Boots/Belts)
    type: 'fantasy',
  },
];
