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

export default function App() {
  const [currentScene, setCurrentScene] = useState<'studio' | 'jungle' | 'tomb'>('studio');
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
    <div className="relative h-screen w-screen font-sans overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <BabylonScene parts={parts} scenePreset={currentScene} />
        </Suspense>
      </div>

      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        <header className="p-8 flex justify-between items-start">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pointer-events-auto"
          >
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Kiss<span className="text-white/20">3D</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest mt-2 text-white/50">
              Character viewer v1.0
            </p>
          </motion.div>

          <div className="flex gap-4 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
              <Info size={20} />
            </button>
            <button
              type="button"
              onClick={takePhoto}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors pointer-events-auto"
            >
              <Camera size={20} />
            </button>
          </div>
        </header>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-8 top-32 pointer-events-auto flex flex-col gap-4 max-w-[220px]"
        >
          {BODY_SLOTS.map((slot) => (
            <div
              key={slot}
              className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                  {SLOT_LABEL[slot]}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                {rigModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPart(slot, m.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all text-left ${parts[slot] === m.id ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Scene</span>
            </div>
            <div className="flex flex-col gap-2">
              {['studio', 'jungle', 'tomb'].map((scene) => (
                <button
                  key={scene}
                  type="button"
                  onClick={() => setCurrentScene(scene as 'studio' | 'jungle' | 'tomb')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${currentScene === scene ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {scene}
                </button>
              ))}
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
