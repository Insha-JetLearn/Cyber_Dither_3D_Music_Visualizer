import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FastForward,
  FolderOpen,
  ListMusic,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Upload,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { TrackMetadata } from '../types/visualizer';

interface BottomPlayerProps {
  currentTrack: TrackMetadata | null;
  playlist: TrackMetadata[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  warpSpeed: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSelectTrack: (index: number) => void;
  onSeek: (time: number) => void;
  onSetVolume: (vol: number) => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleWarp: () => void;
  onFileUpload: (file: File) => void;
}

export const BottomPlayer: React.FC<BottomPlayerProps> = ({
  currentTrack,
  playlist,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  warpSpeed,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  onSelectTrack,
  onSeek,
  onSetVolume,
  onSetPlaybackRate,
  onToggleWarp,
  onFileUpload,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onSetVolume(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onSetVolume(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[96vw] max-w-[940px] pointer-events-auto transition-all duration-300 ${
        isCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Tab Bar */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded-t-md bg-[#080d1a]/90 hover:bg-cyan-950/80 text-[10px] font-tech text-cyan-300 border-t border-x border-cyan-500/30 transition-all shadow-[0_-2px_10px_rgba(0,0,0,0.5)]"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>SHOW DOCK [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>CINEMA MODE [H]</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Dock Container */}
      <div className="cyber-panel rounded-2xl p-2.5 sm:p-3.5 border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8)] space-y-2.5">
        {/* Track Timeline Scrub Bar */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-mono text-cyan-300 w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min="0"
              max={duration || 60}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full cursor-pointer h-1.5"
            />
          </div>
          <span className="text-[10px] font-mono text-gray-400 w-9">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls Layout: 3 Columns (Track Info, Playback, Actions & Warp) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Track Information & Playlist Button */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto min-w-0">
            <div className="relative">
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                title="Open Track Library"
                className="p-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all flex items-center justify-center"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              {/* Playlist Popup Menu */}
              {showPlaylist && (
                <div className="absolute bottom-12 left-0 w-72 max-h-64 overflow-y-auto rounded-xl bg-[#080d1a]/95 border border-cyan-500/40 p-2 shadow-2xl z-50 space-y-1">
                  <div className="text-[10px] font-tech text-gray-400 px-2 py-1 uppercase tracking-wider flex justify-between">
                    <span>CYBER MUSIC LIBRARY</span>
                    <span>{playlist.length} TRACKS</span>
                  </div>
                  {playlist.map((t, idx) => {
                    const isSelected = currentTrack?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSelectTrack(idx);
                          setShowPlaylist(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'text-gray-300 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-rajdhani font-semibold truncate">{t.title}</div>
                          <div className="text-[10px] text-gray-400 truncate">{t.artist}</div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          {formatTime(t.duration)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-rajdhani font-bold text-xs sm:text-sm text-gray-100 truncate flex items-center gap-1.5">
                <span className="truncate">{currentTrack?.title || 'Cyber Synth Track'}</span>
                {currentTrack?.isCustom && (
                  <span className="px-1 py-0.2 text-[9px] font-tech rounded bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    LOCAL
                  </span>
                )}
              </div>
              <div className="text-[10px] font-tech text-cyan-400/80 truncate">
                {currentTrack?.artist || 'Procedural Audio Engine'}
              </div>
            </div>
          </div>

          {/* Center: Main Playback Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Prev Track */}
            <button
              onClick={onPrevTrack}
              title="Previous Track"
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Play / Pause (Hero Glowing Button) */}
            <button
              onClick={onTogglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center border border-cyan-300/60 shadow-[0_0_16px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNextTrack}
              title="Next Track"
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-cyan-300 hover:bg-white/5 transition-all"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/10">
              <button
                onClick={handleMuteToggle}
                className="text-gray-400 hover:text-cyan-300 transition-colors p-1"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-pink-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setIsMuted(false);
                  onSetVolume(parseFloat(e.target.value));
                }}
                className="w-16 h-1 cursor-pointer"
                title="Volume"
              />
            </div>
          </div>

          {/* Right: Actions, Upload & WARP SPEED BUTTON */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-gray-300 border border-white/10 transition-all flex items-center gap-1"
                title="Playback Speed"
              >
                <span>{playbackRate}x</span>
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-[#080d1a]/95 border border-cyan-500/30 rounded-lg p-1 z-50 shadow-xl space-y-0.5">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onSetPlaybackRate(s);
                        setShowSpeedMenu(false);
                      }}
                      className={`block w-full text-left px-2 py-0.5 text-xs font-mono rounded ${
                        playbackRate === s
                          ? 'bg-cyan-500/30 text-cyan-300'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Your Own Music Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="audio/mp3,audio/wav,audio/ogg,audio/flac,audio/aac,audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-300 border border-white/15 hover:border-cyan-500/30 text-xs font-rajdhani font-semibold transition-all"
              title="Upload MP3, WAV, OGG audio files"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">UPLOAD AUDIO</span>
            </button>

            {/* WARP SPEED BUTTON (Prominent Cyberpunk CTA) */}
            <button
              onClick={onToggleWarp}
              title="Toggle Warp Speed Hyperspace"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-orbitron font-extrabold text-xs tracking-wider uppercase transition-all duration-300 ${
                warpSpeed
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-2 border-pink-400 shadow-[0_0_20px_rgba(255,0,127,0.8)] scale-105'
                  : 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-pink-300 border border-pink-500/40 hover:border-pink-400 hover:shadow-[0_0_14px_rgba(255,0,127,0.5)]'
              }`}
            >
              <Zap
                className={`w-4 h-4 ${
                  warpSpeed ? 'text-yellow-300 fill-yellow-300 animate-bounce' : 'text-pink-400'
                }`}
              />
              <span>WARP SPEED</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
