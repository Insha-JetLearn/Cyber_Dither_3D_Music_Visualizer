import React from 'react';
import {
  Activity,
  Box,
  Compass,
  Disc,
  Maximize2,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  Settings as SettingsIcon,
  Sparkles,
  Waves,
  Zap,
} from 'lucide-react';
import { GenrePreset, VisualizerMode, VisualizerSettings } from '../types/visualizer';

interface TopNavProps {
  currentMode: VisualizerMode;
  onSelectMode: (mode: VisualizerMode) => void;
  currentGenre: GenrePreset;
  onSelectGenre: (genre: GenrePreset) => void;
  settings: VisualizerSettings;
  onUpdateSettings: (settings: Partial<VisualizerSettings>) => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  isVoiceControlActive: boolean;
  onToggleVoiceControl: () => void;
  onResetCamera: () => void;
  onOpenSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

const MODES: { id: VisualizerMode; label: string; icon: React.ReactNode }[] = [
  { id: 'galaxy', label: 'Galaxy', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'tunnel', label: 'Tunnel', icon: <Radio className="w-3.5 h-3.5" /> },
  { id: 'wave', label: 'Wave', icon: <Waves className="w-3.5 h-3.5" /> },
  { id: 'spectrum', label: 'Spectrum', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'starfield', label: 'Starfield', icon: <Disc className="w-3.5 h-3.5" /> },
  { id: 'reactor', label: 'Reactor', icon: <Box className="w-3.5 h-3.5" /> },
];

const GENRES: { id: GenrePreset; label: string; color: string }[] = [
  { id: 'pop', label: 'POP', color: 'hover:text-pink-400' },
  { id: 'dance', label: 'DANCE', color: 'hover:text-cyan-400' },
  { id: 'lofi', label: 'LO-FI', color: 'hover:text-purple-300' },
  { id: 'industrial', label: 'INDUSTRIAL', color: 'hover:text-amber-400' },
];

export const TopNav: React.FC<TopNavProps> = ({
  currentMode,
  onSelectMode,
  currentGenre,
  onSelectGenre,
  settings,
  onUpdateSettings,
  isMicActive,
  onToggleMic,
  isVoiceControlActive,
  onToggleVoiceControl,
  onResetCamera,
  onOpenSettings,
  onToggleFullscreen,
  isFullscreen,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 py-2 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-[#030308]/90 via-[#030308]/60 to-transparent">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-orbitron font-extrabold text-sm md:text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 neon-glow-cyan">
              CYBER-DITHER
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-tech uppercase tracking-wider rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              3D VISUALIZER
            </span>
          </div>
          <p className="text-[10px] font-tech text-gray-400 tracking-wider hidden md:block">
            NEON SYNTHESIS · AUDIO-REACTIVE
          </p>
        </div>
      </div>

      {/* Center: Visualizer Mode Selector */}
      <div className="hidden lg:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-[#080d1a]/80 border border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        {MODES.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-rajdhani font-semibold tracking-wider uppercase transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Genre Preset Quick Switch */}
      <div className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0c0f1d]/70 border border-white/10">
        <span className="text-[10px] font-tech text-gray-400 tracking-wider mr-1">GENRE:</span>
        {GENRES.map((g) => {
          const isActive = currentGenre === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelectGenre(g.id)}
              className={`px-2 py-0.5 text-[11px] font-orbitron font-medium rounded transition-all ${
                isActive
                  ? 'bg-pink-500/25 text-pink-300 border border-pink-400/50 shadow-[0_0_8px_rgba(255,0,127,0.4)]'
                  : `text-gray-400 ${g.color} hover:bg-white/5 border border-transparent`
              }`}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile Mode dropdown */}
        <div className="lg:hidden">
          <select
            value={currentMode}
            onChange={(e) => onSelectMode(e.target.value as VisualizerMode)}
            className="px-2 py-1 text-xs font-rajdhani font-semibold bg-gray-900/90 text-cyan-300 border border-cyan-500/30 rounded-lg outline-none"
          >
            {MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} Mode
              </option>
            ))}
          </select>
        </div>

        {/* Microphone Mode */}
        <button
          onClick={onToggleMic}
          title={isMicActive ? 'Disable Microphone Input' : 'Enable Real-time Mic Input'}
          className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-tech font-medium transition-all ${
            isMicActive
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:border-cyan-500/30'
          }`}
        >
          {isMicActive ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isMicActive ? 'LIVE MIC' : 'MIC'}</span>
        </button>

        {/* Voice Control Toggle */}
        <button
          onClick={onToggleVoiceControl}
          title={isVoiceControlActive ? 'Voice Controls Active' : 'Enable Voice Commands'}
          className={`px-2 py-1.5 rounded-lg text-xs font-tech transition-all flex items-center gap-1 ${
            isVoiceControlActive
              ? 'bg-purple-500/30 text-purple-300 border border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
              : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:border-purple-500/30'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">VOICE</span>
        </button>

        {/* Auto Orbit */}
        <button
          onClick={() => onUpdateSettings({ autoRotate: !settings.autoRotate })}
          title={settings.autoRotate ? 'Stop Camera Auto-Orbit' : 'Start Camera Auto-Orbit'}
          className={`p-1.5 rounded-lg text-xs transition-all ${
            settings.autoRotate
              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
              : 'bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:border-cyan-500/30'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={onResetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:border-cyan-500/30 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-gray-200 border border-white/10 hover:border-cyan-500/30 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Customization & Settings"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/25 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="font-tech text-xs hidden md:inline">CONFIG</span>
        </button>
      </div>
    </header>
  );
};
