import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Camera } from 'lucide-react';
import { BabylonScene } from './components/BabylonScene';
import {
  BODY_SLOTS,
  CHARACTER_RIGS,
  defaultCompositeParts,
  type BodySlot,
} from './characterParts';
import { fetchModelsManifest, type PublicModelEntry } from './modelManifest';

const SLOT_LABEL: Record<BodySlot, string> = {
  body: 'Body (skeleton)',
  head: 'Head',
  legs: 'Legs',
  feet: 'Feet',
};

const SCENE_PRESETS = [
  { id: 'studio', label: 'Studio' },
  { id: 'jungle', label: 'Jungle' },
  { id: 'tomb', label: 'Tomb' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'neon', label: 'Neon' },
  { id: 'arctic', label: 'Arctic' },
] as const;

type ScenePreset = (typeof SCENE_PRESETS)[number]['id'];

export default function App() {
  const [currentScene, setCurrentScene] = useState<ScenePreset>('studio');
  const [showInfo, setShowInfo] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [publicModels, setPublicModels] = useState<PublicModelEntry[]>([]);
  const [parts, setParts] = useState(defaultCompositeParts);

  useEffect(() => {
    let cancelled = false;
    void fetchModelsManifest().then((list) => {
      if (!cancelled) setPublicModels(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rigModels = publicModels.filter((m) => CHARACTER_RIGS[m.id]);

  const setPart = (slot: BodySlot, id: string) => {
    setParts((p) => ({ ...p, [slot]: id }));
  };

  const takePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
  };

  return (
    <div className="relative h-screen w-screen font-sans overflow-hidden bg-[#050505] text-white">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <BabylonScene parts={parts} scenePreset={currentScene} />
        </Suspense>
      </div>

      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        <header className="p-4 md:p-8 flex justify-between items-start">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pointer-events-auto bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
              Kiss<span className="text-white/20">3D</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest mt-2 text-white/50">
              Character viewer v1.0
            </p>
          </motion.div>

          <div className="flex gap-3 pointer-events-auto bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl p-2">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="w-11 h-11 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
              <Info size={20} />
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="w-11 h-11 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors pointer-events-auto"
            >
              <Camera size={20} />
            </button>
          </div>
        </header>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-4 md:right-8 top-24 md:top-32 bottom-4 md:bottom-8 pointer-events-auto w-[min(360px,calc(100vw-2rem))] bg-black/45 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 overflow-hidden"
        >
          <div className="overflow-y-auto pr-1 space-y-4">
            {BODY_SLOTS.map((slot) => (
              <div key={slot} className="border border-white/10 rounded-xl p-3 bg-black/20">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/45">
                    {SLOT_LABEL[slot]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {rigModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPart(slot, m.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all text-left truncate ${parts[slot] === m.id ? 'bg-white text-black' : 'bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80'}`}
                      title={m.label}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="border border-white/10 rounded-xl p-3 bg-black/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/45">Scene Preset</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SCENE_PRESETS.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => setCurrentScene(scene.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${currentScene === scene.id ? 'bg-white text-black' : 'bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/80'}`}
                  >
                    {scene.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex-1" />
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-12 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-4xl font-bold uppercase mb-6">About Kiss3D</h3>
              <div className="space-y-6 text-white/60 leading-relaxed">
                <p>
                  Mix and match <strong className="text-white/90">body, head, legs, and feet</strong> from different
                  bundled characters. The <strong className="text-white/90">body</strong> choice loads that
                  character&apos;s skeleton; other slots retarget skinned meshes onto it (same Mixamo-style rig).
                </p>
                <p className="text-sm">
                  Models live in <span className="font-mono text-white/80">public/models</span>; mesh names are defined
                  in <span className="font-mono text-white/80">src/characterParts.ts</span>.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-white uppercase font-bold text-sm mb-2">Controls</h4>
                    <ul className="text-xs space-y-2 font-mono">
                      <li>• LEFT CLICK: Rotate view</li>
                      <li>• SCROLL: Zoom in/out</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white uppercase font-bold text-sm mb-2">Features</h4>
                    <ul className="text-xs space-y-2 font-mono">
                      <li>• Part swap (glTF)</li>
                      <li>• Scene presets</li>
                      <li>• Static bind pose</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="mt-12 w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
