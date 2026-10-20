import React from 'react';
import { Palette, RefreshCw, Sliders, Sparkles, Tv, X, Zap } from 'lucide-react';
import { DEFAULT_SETTINGS } from '../constants/presets';
import { ParticleShape, VisualizerSettings } from '../types/visualizer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualizerSettings;
  onUpdateSettings: (settings: Partial<VisualizerSettings>) => void;
}

const COLOR_SWATCHES = [
  { name: 'Cyan', hex: '#00f0ff' },
  { name: 'Pink', hex: '#ff007f' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Lime', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Red', hex: '#ef4444' },
];

const SHAPES: { id: ParticleShape; label: string }[] = [
  { id: 'circle', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'star', label: 'Star' },
  { id: 'cross', label: 'Cross' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
      <div className="cyber-panel rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-cyan-950/30">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="font-orbitron font-bold text-base text-cyan-300 tracking-wider">
              CYBER VISUALIZER CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-sm">
          {/* 1. Neon Color Palette */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-semibold text-gray-300 flex items-center gap-2 tracking-wider">
              <Palette className="w-4 h-4 text-cyan-400" />
              NEON COLOR SCHEME
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-xs font-tech text-cyan-400">PRIMARY NEON</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                    className="w-20 px-2 py-1 text-xs font-mono bg-black/60 border border-white/10 rounded text-cyan-300"
                  />
                </div>
              </div>

              {/* Secondary */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-xs font-tech text-pink-400">SECONDARY NEON</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdateSettings({ secondaryColor: e.target.value })}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => onUpdateSettings({ secondaryColor: e.target.value })}
                    className="w-20 px-2 py-1 text-xs font-mono bg-black/60 border border-white/10 rounded text-pink-300"
                  />
                </div>
              </div>

              {/* Accent */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-xs font-tech text-purple-400">ACCENT NEON</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                    className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => onUpdateSettings({ accentColor: e.target.value })}
                    className="w-20 px-2 py-1 text-xs font-mono bg-black/60 border border-white/10 rounded text-purple-300"
                  />
                </div>
              </div>
            </div>

            {/* Quick Color Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-tech text-gray-400">SWATCHES:</span>
              {COLOR_SWATCHES.map((sw) => (
                <button
                  key={sw.name}
                  onClick={() => onUpdateSettings({ primaryColor: sw.hex })}
                  className="px-2 py-0.5 rounded text-[10px] font-tech border border-white/10 flex items-center gap-1.5 hover:border-white/30"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sw.hex }}></span>
                  {sw.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Particle System Settings */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-semibold text-gray-300 flex items-center gap-2 tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              PARTICLE PROPERTIES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Particle Shape */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-xs font-tech text-gray-300">PARTICLE SPRITE SHAPE</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {SHAPES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateSettings({ particleShape: s.id })}
                      className={`px-2 py-1.5 text-xs font-rajdhani font-semibold rounded-lg transition-all ${
                        settings.particleShape === s.id
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                          : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Particle Density */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-tech text-gray-300">
                  <span>PARTICLE COUNT</span>
                  <span className="text-cyan-400 font-mono">{settings.particleCount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="16000"
                  step="500"
                  value={settings.particleCount}
                  onChange={(e) => onUpdateSettings({ particleCount: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Particle Size */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-tech text-gray-300">
                  <span>PARTICLE SIZE</span>
                  <span className="text-cyan-400 font-mono">{settings.particleSize}px</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.2"
                  value={settings.particleSize}
                  onChange={(e) => onUpdateSettings({ particleSize: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Animation Speed */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-tech text-gray-300">
                  <span>ANIMATION VELOCITY</span>
                  <span className="text-cyan-400 font-mono">{settings.speed}x</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={settings.speed}
                  onChange={(e) => onUpdateSettings({ speed: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 3. Audio Reactivity & Bloom */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-semibold text-gray-300 flex items-center gap-2 tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400" />
              AUDIO REACTIVITY & NEON GLOW
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Audio Sensitivity */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-tech text-gray-300">
                  <span>AUDIO REACTIVITY SENSITIVITY</span>
                  <span className="text-pink-400 font-mono">{settings.audioSensitivity}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={settings.audioSensitivity}
                  onChange={(e) => onUpdateSettings({ audioSensitivity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Bloom Intensity */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                <div className="flex justify-between text-xs font-tech text-gray-300">
                  <span>BLOOM GLOW RADIANCE</span>
                  <span className="text-cyan-400 font-mono">{settings.bloomIntensity}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="2.8"
                  step="0.1"
                  value={settings.bloomIntensity}
                  onChange={(e) => onUpdateSettings({ bloomIntensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 4. Retro Dither & CRT Effects */}
          <div className="space-y-3">
            <h3 className="font-orbitron text-xs font-semibold text-gray-300 flex items-center gap-2 tracking-wider">
              <Tv className="w-4 h-4 text-cyan-400" />
              RETRO DIGITAL DITHER SHADER & POST-FX
            </h3>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.ditherEnabled}
                    onChange={(e) => onUpdateSettings({ ditherEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-gray-900 border-gray-700"
                  />
                  <span className="text-xs font-tech text-gray-200">ENABLE ORDERED DITHERING</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.scanlines}
                    onChange={(e) => onUpdateSettings({ scanlines: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-gray-900 border-gray-700"
                  />
                  <span className="text-xs font-tech text-gray-200">CRT SCANLINES</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mouseTrailEnabled}
                    onChange={(e) => onUpdateSettings({ mouseTrailEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 bg-gray-900 border-gray-700"
                  />
                  <span className="text-xs font-tech text-gray-200">CURSOR SPARK TRAILS</span>
                </label>
              </div>

              {settings.ditherEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <div className="flex justify-between text-[11px] font-tech text-gray-400 mb-1">
                      <span>DITHER INTENSITY</span>
                      <span>{settings.ditherIntensity}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.ditherIntensity}
                      onChange={(e) => onUpdateSettings({ ditherIntensity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-tech text-gray-400 mb-1">
                      <span>MATRIX SCALE</span>
                      <span>{settings.ditherScale}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.5"
                      value={settings.ditherScale}
                      onChange={(e) => onUpdateSettings({ ditherScale: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-tech text-gray-400 mb-1">
                      <span>CHROMATIC ABERRATION</span>
                      <span>{(settings.chromaticAberration * 1000).toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="0.012"
                      step="0.0005"
                      value={settings.chromaticAberration}
                      onChange={(e) => onUpdateSettings({ chromaticAberration: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-cyan-500/20 bg-cyan-950/20">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-tech text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET TO DEFAULTS</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg bg-cyan-500/30 hover:bg-cyan-500/50 text-cyan-300 border border-cyan-400/50 font-rajdhani font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]"
          >
            APPLY & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
