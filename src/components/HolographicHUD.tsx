import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, Cpu, Flame, Volume2, Zap } from 'lucide-react';
import { AudioAnalysisData, TrackMetadata, VisualizerMode } from '../types/visualizer';

interface HolographicHUDProps {
  audioData: AudioAnalysisData;
  fps: number;
  particleCount: number;
  currentMode: VisualizerMode;
  warpSpeed: boolean;
  currentTrack: TrackMetadata | null;
  isPlaying: boolean;
  isMicActive: boolean;
}

export const HolographicHUD: React.FC<HolographicHUDProps> = ({
  audioData,
  fps,
  particleCount,
  currentMode,
  warpSpeed,
  currentTrack,
  isPlaying,
  isMicActive,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Normalize percentages
  const bassPct = Math.round(Math.min(100, audioData.bass * 100));
  const midPct = Math.round(Math.min(100, audioData.mid * 100));
  const treblePct = Math.round(Math.min(100, audioData.treble * 100));
  const volPct = Math.round(Math.min(100, audioData.volume * 100));

  return (
    <aside
      className={`fixed top-14 left-3 z-30 pointer-events-auto transition-all duration-300 ${
        isCollapsed ? 'w-auto' : 'w-72 sm:w-80'
      }`}
    >
      <div className="cyber-panel rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.7)]">
        {/* HUD Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-cyan-950/40 border-b border-cyan-500/20">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-orbitron text-[11px] font-bold tracking-wider text-cyan-300">
              HUD MONITOR
            </span>
            {warpSpeed && (
              <span className="px-1.5 py-0.2 text-[9px] font-tech font-bold tracking-wider rounded bg-pink-500/30 text-pink-300 border border-pink-400/50 animate-pulse">
                WARP ON
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-tech text-[10px] px-1.5 py-0.5 rounded ${
                fps >= 50
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : fps >= 30
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {fps} FPS
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-cyan-300 p-0.5"
              title={isCollapsed ? 'Expand HUD' : 'Collapse HUD'}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-3 space-y-3 text-xs">
            {/* Live Track info */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
              <div className="min-w-0 flex-1 pr-2">
                <div className="text-[10px] font-tech text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  {isMicActive ? 'REALTIME INPUT' : isPlaying ? 'PLAYING AUDIO' : 'PAUSED'}
                </div>
                <div className="font-rajdhani font-bold text-sm text-gray-100 truncate">
                  {isMicActive ? 'Microphone Stream' : currentTrack?.title || 'No Track'}
                </div>
                <div className="text-[10px] font-tech text-gray-400 truncate">
                  {isMicActive ? 'System Audio Capture' : currentTrack?.artist || 'Idle Engine'}
                </div>
              </div>
              <div
                className={`p-1.5 rounded-lg border ${
                  audioData.isBeat
                    ? 'bg-pink-500/30 border-pink-400 text-pink-300 shadow-[0_0_12px_rgba(255,0,127,0.6)]'
                    : 'bg-white/5 border-white/10 text-gray-400'
                } transition-all duration-75`}
                title="Beat Detector"
              >
                <Flame className="w-4 h-4" />
              </div>
            </div>

            {/* Audio Analysis: Frequency spectrum mini visualizer */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-tech text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-cyan-400" /> SPECTRUM FFT (16 BANDS)
                </span>
                <span className="text-cyan-400 font-mono">{volPct}% LEVEL</span>
              </div>
              <div className="h-10 flex items-end gap-1 px-1 py-1 rounded bg-black/60 border border-cyan-500/20">
                {audioData.spectrumBands.map((val, idx) => {
                  const h = Math.max(8, Math.min(100, Math.round(val * 100)));
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-cyan-500 via-pink-500 to-purple-400 rounded-xs transition-all duration-75 shadow-[0_0_4px_rgba(0,240,255,0.4)]"
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bass, Mids, Treble meters */}
            <div className="space-y-1.5">
              {/* Bass */}
              <div>
                <div className="flex justify-between text-[10px] font-tech text-gray-300">
                  <span className="text-pink-400 font-bold">BASS (20-250Hz)</span>
                  <span className="font-mono">{bassPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/60 overflow-hidden border border-pink-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-75 shadow-[0_0_6px_rgba(255,0,127,0.6)]"
                    style={{ width: `${bassPct}%` }}
                  />
                </div>
              </div>

              {/* Mids */}
              <div>
                <div className="flex justify-between text-[10px] font-tech text-gray-300">
                  <span className="text-cyan-400 font-bold">MIDS (250-2500Hz)</span>
                  <span className="font-mono">{midPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/60 overflow-hidden border border-cyan-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                    style={{ width: `${midPct}%` }}
                  />
                </div>
              </div>

              {/* Treble */}
              <div>
                <div className="flex justify-between text-[10px] font-tech text-gray-300">
                  <span className="text-purple-400 font-bold">TREBLE (2.5k-16kHz)</span>
                  <span className="font-mono">{treblePct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/60 overflow-hidden border border-purple-500/20">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-75 shadow-[0_0_6px_rgba(168,85,247,0.6)]"
                    style={{ width: `${treblePct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance telemetry */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-tech text-gray-400">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>PARTICLES:</span>
                <span className="text-cyan-300 font-bold">{particleCount.toLocaleString()}</span>
              </div>
              <div>
                <span className="uppercase text-gray-400 mr-1">MODE:</span>
                <span className="text-pink-400 font-bold uppercase">{currentMode}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
