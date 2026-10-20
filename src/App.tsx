/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { BottomPlayer } from './components/BottomPlayer';
import { DropZoneOverlay } from './components/DropZoneOverlay';
import { HolographicHUD } from './components/HolographicHUD';
import { SettingsModal } from './components/SettingsModal';
import { TopNav } from './components/TopNav';
import { VoiceControlModal } from './components/VoiceControlModal';
import { DEFAULT_SETTINGS, GENRE_PRESETS } from './constants/presets';
import {
  AudioAnalysisData,
  GenrePreset,
  TrackMetadata,
  VisualizerMode,
  VisualizerSettings,
} from './types/visualizer';
import { VisualizerScene } from './visualizer/VisualizerScene';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<VisualizerScene | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  // App State
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [currentMode, setCurrentMode] = useState<VisualizerMode>('galaxy');
  const [currentGenre, setCurrentGenre] = useState<GenrePreset>('dance');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | null>(null);
  const [playlist, setPlaylist] = useState<TrackMetadata[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.85);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // HUD & Telemetry State
  const [fps, setFps] = useState(60);
  const [particleCount, setParticleCount] = useState(8000);
  const [audioData, setAudioData] = useState<AudioAnalysisData>({
    frequencyData: new Uint8Array(64),
    waveformData: new Uint8Array(64).fill(128),
    bass: 0,
    mid: 0,
    treble: 0,
    volume: 0,
    isBeat: false,
    beatIntensity: 0,
    spectrumBands: new Array(16).fill(0),
    rawEnergy: 0,
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initialize Audio Engine & Visualizer Scene
  useEffect(() => {
    const audio = new AudioEngine();
    audioEngineRef.current = audio;

    setPlaylist(audio.getPlaylist());
    const initTrack = audio.getCurrentTrack();
    setCurrentTrack(initTrack);
    if (initTrack) {
      setDuration(initTrack.duration);
    }

    const unsubTrack = audio.onTrackChange((trk) => {
      setCurrentTrack(trk);
      setDuration(trk.duration);
      setPlaylist(audio.getPlaylist());
      showToast(`Now Playing: ${trk.title}`);
    });

    const unsubPlay = audio.onPlayStateChange((playing) => {
      setIsPlaying(playing);
    });

    const unsubError = audio.onError((err) => {
      showToast(`⚠️ ${err}`);
    });

    // Mount 3D Scene
    let visualizer: VisualizerScene | null = null;
    if (mountRef.current) {
      try {
        visualizer = new VisualizerScene(mountRef.current, DEFAULT_SETTINGS);
        visualizerRef.current = visualizer;
      } catch (e) {
        console.error('Failed to initialize WebGL Visualizer:', e);
      }
    }

    // Audio Analysis Synchronization Loop (60 FPS)
    let syncAnimId: number;
    let lastTimeUpdate = 0;

    const syncLoop = () => {
      syncAnimId = requestAnimationFrame(syncLoop);

      const analysis = audio.analyze();
      if (visualizer) {
        visualizer.updateAudioData(analysis);
        setFps(visualizer.getFps());
        setParticleCount(visualizer.getParticleCount());
      }

      setAudioData(analysis);

      // Throttle time scrub bar update to ~10Hz
      const now = performance.now();
      if (now - lastTimeUpdate > 100) {
        lastTimeUpdate = now;
        setCurrentTime(audio.getCurrentTime());
      }
    };
    syncAnimId = requestAnimationFrame(syncLoop);

    return () => {
      cancelAnimationFrame(syncAnimId);
      unsubTrack();
      unsubPlay();
      unsubError();
      if (visualizer) {
        visualizer.dispose();
      }
    };
  }, []);

  // 2. Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyW') {
        e.preventDefault();
        handleToggleWarp();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleResetCamera();
      } else if (e.key === '1') {
        handleSelectMode('galaxy');
      } else if (e.key === '2') {
        handleSelectMode('tunnel');
      } else if (e.key === '3') {
        handleSelectMode('wave');
      } else if (e.key === '4') {
        handleSelectMode('spectrum');
      } else if (e.key === '5') {
        handleSelectMode('starfield');
      } else if (e.key === '6') {
        handleSelectMode('reactor');
      } else if (e.code === 'ArrowRight') {
        audioEngineRef.current?.nextTrack();
      } else if (e.code === 'ArrowLeft') {
        audioEngineRef.current?.prevTrack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.warpSpeed]);

  // Handlers
  const handleTogglePlay = async () => {
    if (!audioEngineRef.current) return;
    await audioEngineRef.current.togglePlay();
  };

  const handlePrevTrack = async () => {
    await audioEngineRef.current?.prevTrack();
  };

  const handleNextTrack = async () => {
    await audioEngineRef.current?.nextTrack();
  };

  const handleSelectTrack = async (index: number) => {
    await audioEngineRef.current?.selectTrack(index);
  };

  const handleSeek = (time: number) => {
    audioEngineRef.current?.seek(time);
    setCurrentTime(time);
  };

  const handleSetVolume = (vol: number) => {
    setVolume(vol);
    audioEngineRef.current?.setVolume(vol);
  };

  const handleSetPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    audioEngineRef.current?.setPlaybackRate(rate);
    showToast(`Speed: ${rate}x`);
  };

  const handleToggleWarp = () => {
    const nextWarp = !settings.warpSpeed;
    const newSettings = { ...settings, warpSpeed: nextWarp };
    setSettings(newSettings);
    visualizerRef.current?.updateSettings({ warpSpeed: nextWarp });
    showToast(nextWarp ? '⚡ WARP SPEED ENGAGED' : 'Warp speed disengaged');
  };

  const handleSelectMode = (mode: VisualizerMode) => {
    setCurrentMode(mode);
    visualizerRef.current?.setMode(mode);
    showToast(`Visualizer: ${mode.toUpperCase()}`);
  };

  const handleSelectGenre = (genre: GenrePreset) => {
    setCurrentGenre(genre);
    const preset = GENRE_PRESETS[genre];
    if (preset) {
      const newSettings: VisualizerSettings = {
        ...settings,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
        particleShape: preset.particleShape,
        speed: preset.speed,
        audioSensitivity: preset.audioSensitivity,
        bloomIntensity: preset.bloomIntensity,
        ditherIntensity: preset.ditherIntensity,
        ditherScale: preset.ditherScale,
        scanlines: preset.scanlines,
        chromaticAberration: preset.chromaticAberration,
      };
      setSettings(newSettings);
      visualizerRef.current?.updateSettings(newSettings);
      showToast(`Genre preset: ${preset.name.toUpperCase()}`);
    }
  };

  const handleUpdateSettings = (partial: Partial<VisualizerSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    visualizerRef.current?.updateSettings(partial);
  };

  const handleToggleMic = async () => {
    if (!audioEngineRef.current) return;
    const active = await audioEngineRef.current.toggleMicrophone();
    setIsMicActive(active);
    showToast(active ? '🎙️ Microphone Input Connected' : 'Microphone Disconnected');
  };

  const handleFileUpload = async (file: File) => {
    if (!audioEngineRef.current) return;
    try {
      showToast(`Loading: ${file.name}...`);
      await audioEngineRef.current.loadUserAudioFile(file);
      showToast(`Loaded: ${file.name}`);
    } catch {
      showToast(`Failed to load audio file: ${file.name}`);
    }
  };

  const handleResetCamera = () => {
    visualizerRef.current?.resetCamera();
    showToast('Camera View Reset');
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030308] text-white">
      {/* 1. Dedicated WebGL Canvas Container (Isolated outside HUD overlays per Three.js directives) */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top Navigation Bar */}
      <TopNav
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        currentGenre={currentGenre}
        onSelectGenre={handleSelectGenre}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        isVoiceControlActive={isVoiceModalOpen}
        onToggleVoiceControl={() => setIsVoiceModalOpen(!isVoiceModalOpen)}
        onResetCamera={handleResetCamera}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
      />

      {/* 3. Holographic HUD Monitor (Real-time telemetry, live meters, particle count, FPS) */}
      <HolographicHUD
        audioData={audioData}
        fps={fps}
        particleCount={particleCount}
        currentMode={currentMode}
        warpSpeed={settings.warpSpeed}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isMicActive={isMicActive}
      />

      {/* 4. Sleek Collapsible Bottom Player Dock (Zero Viewport Occlusion) */}
      <BottomPlayer
        currentTrack={currentTrack}
        playlist={playlist}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        playbackRate={playbackRate}
        warpSpeed={settings.warpSpeed}
        onTogglePlay={handleTogglePlay}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onSelectTrack={handleSelectTrack}
        onSeek={handleSeek}
        onSetVolume={handleSetVolume}
        onSetPlaybackRate={handleSetPlaybackRate}
        onToggleWarp={handleToggleWarp}
        onFileUpload={handleFileUpload}
      />

      {/* 5. Customization & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* 6. Voice Control Modal */}
      <VoiceControlModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onCommand={showToast}
        onSelectMode={handleSelectMode}
        onSelectGenre={handleSelectGenre}
        onTogglePlay={handleTogglePlay}
        onToggleWarp={handleToggleWarp}
        onResetCamera={handleResetCamera}
      />

      {/* 7. Drag and Drop Audio File Overlay */}
      <DropZoneOverlay onFileDropped={handleFileUpload} />

      {/* 8. Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3.5 py-2 rounded-xl bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-tech text-xs tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
