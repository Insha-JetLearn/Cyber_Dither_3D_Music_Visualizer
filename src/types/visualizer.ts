export type VisualizerMode =
  | 'galaxy'
  | 'tunnel'
  | 'wave'
  | 'spectrum'
  | 'starfield'
  | 'reactor';

export type GenrePreset = 'pop' | 'dance' | 'lofi' | 'industrial' | 'custom';

export type ParticleShape = 'circle' | 'diamond' | 'star' | 'cross';

export interface VisualizerSettings {
  primaryColor: string; // e.g. #00f0ff (cyan)
  secondaryColor: string; // e.g. #ff007f (hot pink)
  accentColor: string; // e.g. #a855f7 (violet)
  particleCount: number; // 2000 to 20000
  particleShape: ParticleShape;
  particleSize: number; // 1 to 10
  speed: number; // 0.2 to 3.0
  audioSensitivity: number; // 0.5 to 3.0
  warpSpeed: boolean;
  bloomIntensity: number; // 0.0 to 3.0
  ditherEnabled: boolean;
  ditherIntensity: number; // 0.0 to 1.0
  ditherScale: number; // 1 to 6
  scanlines: boolean;
  chromaticAberration: number; // 0.0 to 0.015
  mouseTrailEnabled: boolean;
  autoRotate: boolean;
  fov: number; // camera FOV
}

export interface AudioAnalysisData {
  frequencyData: Uint8Array;
  waveformData: Uint8Array;
  bass: number; // 0 to 1
  mid: number; // 0 to 1
  treble: number; // 0 to 1
  volume: number; // 0 to 1
  isBeat: boolean;
  beatIntensity: number; // 0 to 1
  spectrumBands: number[]; // 16 normalized bands
  rawEnergy: number;
}

export interface TrackMetadata {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  genre: GenrePreset;
  isCustom?: boolean;
  url?: string;
}

export interface PresetConfig {
  name: string;
  genre: GenrePreset;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  particleShape: ParticleShape;
  speed: number;
  audioSensitivity: number;
  bloomIntensity: number;
  ditherIntensity: number;
  ditherScale: number;
  scanlines: boolean;
  chromaticAberration: number;
  description: string;
}
