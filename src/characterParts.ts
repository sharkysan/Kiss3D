/** Body regions that can be swapped between bundled Mixamo-style rigs (shared skeleton). */

export type BodySlot = 'body' | 'head' | 'legs' | 'feet';

export type CharacterRig = {
  /** File in `public/models/` */
  file: string;
  slots: Record<BodySlot, string>;
  /** Meshes to hide when compositing (weapons, etc.) */
  extras?: string[];
};

/**
 * Keys must match `id` in `public/models/manifest.json`.
 * Names come from `npm run list-meshes`.
 */
export const CHARACTER_RIGS: Record<string, CharacterRig> = {
  adventurer: {
    file: 'Adventurer.glb',
    slots: {
      body: 'Adventurer_Body',
      head: 'Adventurer_Head',
      legs: 'Adventurer_Legs',
      feet: 'Adventurer_Feet',
    },
  },
  medieval: {
    file: 'Medieval.glb',
    slots: {
      body: 'Medieval_Body',
      head: 'Medieval_Head',
      legs: 'Medieval_Legs',
      feet: 'Medieval_Feet',
    },
    extras: ['Sword'],
  },
  punk: {
    file: 'Punk.glb',
    slots: {
      body: 'Punk_Body',
      head: 'Punk_Head',
      legs: 'Punk_Legs',
      feet: 'Punk_Feet',
    },
  },
  'sci-fi': {
    file: 'Sci Fi Character.glb',
    slots: {
      body: 'SciFi_Body',
      head: 'SciFi_Head',
      legs: 'SciFi_Legs',
      feet: 'SciFi_Feet',
    },
    extras: ['Pistol'],
  },
  soldier: {
    file: 'Soldier.glb',
    slots: {
      body: 'Soldier_Body',
      head: 'Soldier_Head',
      legs: 'Soldier_Legs',
      feet: 'Soldier_Feet',
    },
  },
  suit: {
    file: 'Suit.glb',
    slots: {
      body: 'Suit_Body',
      head: 'Suit_Head',
      legs: 'Suit_Legs',
      feet: 'Suit_Feet',
    },
  },
  witch: {
    file: 'Witch.glb',
    slots: {
      body: 'Witch_Body',
      head: 'Witch_Head',
      legs: 'Witch_Legs',
      feet: 'Witch_Feet',
    },
  },
  worker: {
    file: 'Worker.glb',
    slots: {
      body: 'Worker_Body',
      head: 'Worker_Head',
      legs: 'Worker_Legs',
      feet: 'Worker_Feet',
    },
  },
};

export const BODY_SLOTS: BodySlot[] = ['body', 'head', 'legs', 'feet'];

export function rigFileUrl(rigId: string): string | null {
  const rig = CHARACTER_RIGS[rigId];
  if (!rig) return null;
  const enc = rig.file.split('/').map((s) => encodeURIComponent(s)).join('/');
  return `/models/${enc}`;
}

export function defaultCompositeParts(): Record<BodySlot, string> {
  return {
    body: 'adventurer',
    head: 'adventurer',
    legs: 'adventurer',
    feet: 'adventurer',
  };
}
