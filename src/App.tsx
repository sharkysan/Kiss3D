import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Shield, Zap, Palette, Info, ChevronRight, Camera } from 'lucide-react';
import { Avatar } from './components/Avatar';
import { CustomModel } from './components/CustomModel';
import { GoogleDrivePicker } from './components/GoogleDrivePicker';
import { COSPLAY_SETS, CosplaySet, POSES, PoseType } from './types';

export default function App() {
  const [currentSet, setCurrentSet] = useState<CosplaySet>(COSPLAY_SETS.find(s => s.id === 'tomb-explorer') || COSPLAY_SETS[0]);
  const [currentPose, setCurrentPose] = useState<PoseType>('idle');
  const [currentScene, setCurrentScene] = useState<'studio' | 'jungle' | 'tomb'>('studio');
  const [showInfo, setShowInfo] = useState(false);
  const [customColor, setCustomColor] = useState<string | null>(null);
  const [skinTone, setSkinTone] = useState<string>("#f5d0c0");
  const [isFlashing, setIsFlashing] = useState(false);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);

  const activeSet = customColor ? { ...currentSet, primaryColor: customColor } : currentSet;

  const takePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
  };

  return (
    <div className="relative h-screen w-screen font-sans overflow-hidden bg-[#050505]">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 1.5, 4]} fov={45} />
          <Suspense fallback={null}>
            {customModelUrl ? (
              <CustomModel url={customModelUrl} />
            ) : (
              <Avatar set={activeSet} skinColor={skinTone} pose={currentPose} />
            )}
            {currentScene === 'studio' && <Environment preset="city" />}
            {currentScene === 'jungle' && <Environment preset="forest" />}
            {currentScene === 'tomb' && <Environment preset="night" />}
            <ContactShadows 
              position={[0, -0.2, 0]} 
              opacity={0.4} 
              scale={10} 
              blur={2} 
              far={10} 
              resolution={256} 
              color="#000000" 
            />
          </Suspense>
          <OrbitControls 
            enablePan={false} 
            minDistance={2} 
            maxDistance={6} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5} 
          />
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        </Canvas>
      </div>

      {/* UI Overlay */}
      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        {/* Header */}
        <header className="p-8 flex justify-between items-start">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="pointer-events-auto"
          >
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
              Cosplay<span className="text-white/20">3D</span>
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest mt-2 text-white/50">
              Virtual Dressing Studio v1.0
            </p>
          </motion.div>

          <div className="flex gap-4 pointer-events-auto">
            <GoogleDrivePicker onFileSelect={setCustomModelUrl} />
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={takePhoto}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-colors pointer-events-auto"
            >
              <Camera size={20} />
            </button>
          </div>
        </header>

        {/* Color Customizer */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute right-8 top-32 pointer-events-auto flex flex-col gap-4"
        >
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Custom Model</span>
            </div>
            {customModelUrl ? (
              <button
                onClick={() => setCustomModelUrl(null)}
                className="w-full px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Clear Model
              </button>
            ) : (
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/20 text-center py-2">
                No Custom Model
              </div>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Pose</span>
            </div>
            <div className="flex flex-col gap-2">
              {POSES.map((pose) => (
                <button
                  key={pose.id}
                  onClick={() => setCurrentPose(pose.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${currentPose === pose.id ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {pose.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Scene</span>
            </div>
            <div className="flex flex-col gap-2">
              {['studio', 'jungle', 'tomb'].map((scene) => (
                <button
                  key={scene}
                  onClick={() => setCurrentScene(scene as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-widest transition-all ${currentScene === scene ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                >
                  {scene}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Palette size={14} className="text-white/40" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Custom Color</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff4500', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => setCustomColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${customColor === color ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <button
                onClick={() => setCustomColor(null)}
                className="col-span-2 text-[10px] font-mono uppercase mt-2 text-white/40 hover:text-white transition-colors"
              >
                Reset Outfit
              </button>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Skin Tone</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['#f5d0c0', '#e0ac69', '#8d5524', '#c68642', '#ffdbac'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSkinTone(tone)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${skinTone === tone ? 'border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content Area (Empty for 3D) */}
        <div className="flex-1" />

        {/* Footer / Controls */}
        <footer className="p-8 flex flex-col md:flex-row justify-between items-end gap-8">
          {/* Set Info */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSet.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="max-w-md pointer-events-auto"
            >
              <div className="flex items-center gap-3 mb-2">
                {currentSet.type === 'magical' && <Sparkles className="text-pink-400" />}
                {currentSet.type === 'cyber' && <Zap className="text-cyan-400" />}
                {currentSet.type === 'fantasy' && <Shield className="text-blue-400" />}
                <span className="text-xs font-mono uppercase tracking-widest text-white/40">Active Set</span>
              </div>
              <h2 className="text-4xl font-bold uppercase tracking-tight mb-2">{currentSet.name}</h2>
              <p className="text-white/60 text-sm leading-relaxed">{currentSet.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Selector */}
          <div className="flex gap-4 pointer-events-auto">
            {COSPLAY_SETS.map((set) => (
              <button
                key={set.id}
                onClick={() => setCurrentSet(set)}
                className={`
                  group relative w-24 h-32 overflow-hidden transition-all duration-500
                  ${currentSet.id === set.id ? 'w-48' : 'hover:w-32'}
                `}
              >
                <div 
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundColor: set.primaryColor }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-tighter font-bold text-black mix-blend-overlay">
                      {set.id.split('-')[0]}
                    </span>
                    <ChevronRight size={16} className={`text-black transition-transform ${currentSet.id === set.id ? 'rotate-90' : ''}`} />
                  </div>
                  <div className={`h-1 bg-black/40 mt-2 transition-all duration-500 ${currentSet.id === set.id ? 'w-full' : 'w-0'}`} />
                </div>

                {currentSet.id === set.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute top-0 left-0 w-full h-1 bg-white"
                  />
                )}
              </button>
            ))}
          </div>
        </footer>
      </div>

      {/* Info Modal */}
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
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-4xl font-bold uppercase mb-6">About the Studio</h3>
              <div className="space-y-6 text-white/60 leading-relaxed">
                <p>
                  Welcome to Cosplay3D, the ultimate virtual dressing room. Explore our curated collection of high-fidelity 
                  cosplay outfits, designed for the modern digital avatar.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-white uppercase font-bold text-sm mb-2">Controls</h4>
                    <ul className="text-xs space-y-2 font-mono">
                      <li>• LEFT CLICK: Rotate View</li>
                      <li>• SCROLL: Zoom In/Out</li>
                      <li>• SELECT: Switch Outfits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white uppercase font-bold text-sm mb-2">Features</h4>
                    <ul className="text-xs space-y-2 font-mono">
                      <li>• Real-time 3D Rendering</li>
                      <li>• Dynamic Lighting</li>
                      <li>• Set-specific Accessories</li>
                    </ul>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="mt-12 w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
              >
                Close Studio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Accents */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      {/* Camera Flash */}
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

