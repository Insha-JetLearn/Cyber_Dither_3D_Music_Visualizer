import { GenrePreset, PresetConfig, VisualizerSettings } from '../types/visualizer';

export const DEFAULT_SETTINGS: VisualizerSettings = {
  primaryColor: '#00f0ff', // Electric cyan
  secondaryColor: '#ff007f', // Hot pink
  accentColor: '#8b5cf6', // Electric violet
  particleCount: 8000,
  particleShape: 'circle',
  particleSize: 3.2,
  speed: 1.0,
  audioSensitivity: 1.3,
  warpSpeed: false,
  bloomIntensity: 1.2,
  ditherEnabled: true,
  ditherIntensity: 0.55,
  ditherScale: 2.0,
  scanlines: true,
  chromaticAberration: 0.0035,
  mouseTrailEnabled: true,
  autoRotate: false,
  fov: 60,
};

export const GENRE_PRESETS: Record<GenrePreset, PresetConfig> = {
  pop: {
    name: 'Pop',
    genre: 'pop',
    primaryColor: '#ff2d92', // Bright magenta
    secondaryColor: '#00f0ff', // Vivid cyan
    accentColor: '#ffe600', // Electric yellow
    particleShape: 'star',
    speed: 1.15,
    audioSensitivity: 1.4,
    bloomIntensity: 1.4,
    ditherIntensity: 0.35,
    ditherScale: 2.0,
    scanlines: false,
    chromaticAberration: 0.002,
    description: 'Bright saturated colors, energetic starbursts, smooth rhythmic dynamics',
  },
  dance: {
    name: 'Dance',
    genre: 'dance',
    primaryColor: '#00f0ff', // Electric cyan
    secondaryColor: '#10b981', // Neon emerald
    accentColor: '#a855f7', // Ultraviolet
    particleShape: 'diamond',
    speed: 1.35,
    audioSensitivity: 1.6,
    bloomIntensity: 1.5,
    ditherIntensity: 0.45,
    ditherScale: 2.0,
    scanlines: true,
    chromaticAberration: 0.004,
    description: 'Fast-moving particles, beat-synchronised pulses, vibrant neon flashes',
  },
  lofi: {
    name: 'Lo-Fi',
    genre: 'lofi',
    primaryColor: '#c084fc', // Soft dusk lavender
    secondaryColor: '#fb923c', // Warm peach
    accentColor: '#38bdf8', // Pastel sky
    particleShape: 'circle',
    speed: 0.65,
    audioSensitivity: 1.0,
    bloomIntensity: 0.9,
    ditherIntensity: 0.65,
    ditherScale: 3.0,
    scanlines: true,
    chromaticAberration: 0.0045,
    description: 'Soft pastel neon colors, slower motion, gentle particles, calm transitions',
  },
  industrial: {
    name: 'Industrial',
    genre: 'industrial',
    primaryColor: '#ef4444', // Aggressive red
    secondaryColor: '#f59e0b', // Toxic amber
    accentColor: '#94a3b8', // Cold metallic steel
    particleShape: 'cross',
    speed: 1.5,
    audioSensitivity: 1.8,
    bloomIntensity: 1.6,
    ditherIntensity: 0.85,
    ditherScale: 2.0,
    scanlines: true,
    chromaticAberration: 0.007,
    description: 'Sharp geometric forms, aggressive movement, glitch effects, metallic colors',
  },
  custom: {
    name: 'Custom',
    genre: 'custom',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    accentColor: '#8b5cf6',
    particleShape: 'circle',
    speed: 1.0,
    audioSensitivity: 1.3,
    bloomIntensity: 1.2,
    ditherIntensity: 0.55,
    ditherScale: 2.0,
    scanlines: true,
    chromaticAberration: 0.0035,
    description: 'User-configured custom visual theme',
  },
};
