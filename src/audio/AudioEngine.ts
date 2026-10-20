import { AudioAnalysisData, GenrePreset, TrackMetadata } from '../types/visualizer';
import { generateSynthTrack } from './SynthGenerator';

export const BUILT_IN_TRACKS: TrackMetadata[] = [
  {
    id: 'neon-horizon',
    title: 'Neon Horizon',
    artist: 'CyberSynth · Cyberpunk Synthwave',
    duration: 48,
    genre: 'dance',
  },
  {
    id: 'glitch-protocol',
    title: 'Glitch Protocol',
    artist: 'NeuroByte · Industrial Electro',
    duration: 44,
    genre: 'industrial',
  },
  {
    id: 'tokyo-rain',
    title: 'Tokyo Midnight Rain',
    artist: 'Aethel · Lo-Fi Cyber Dreams',
    duration: 52,
    genre: 'lofi',
  },
  {
    id: 'electric-pulse',
    title: 'Electric Pulse',
    artist: 'Vortex · Future Bass Glow',
    duration: 46,
    genre: 'pop',
  },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;

  // Track & Buffer cache
  private bufferCache = new Map<string, AudioBuffer>();
  private currentTrackIndex = 0;
  private playlist: TrackMetadata[] = [...BUILT_IN_TRACKS];

  // Playback state
  private isPlaying = false;
  private isMicActive = false;
  private startTime = 0;
  private pauseOffset = 0;
  private volume = 0.85;
  private playbackRate = 1.0;

  // Analysis buffers
  private freqArray: Uint8Array | null = null;
  private timeArray: Uint8Array | null = null;

  // Beat detection & smoothing
  private beatHistory: number[] = [];
  private beatHistoryMax = 30;
  private lastBeatTime = 0;
  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private smoothVol = 0;

  // Callbacks
  private onTrackChangeCallbacks: ((track: TrackMetadata) => void)[] = [];
  private onPlayStateChangeCallbacks: ((isPlaying: boolean) => void)[] = [];
  private onErrorCallbacks: ((msg: string) => void)[] = [];

  constructor() {
    // Lazy AudioContext creation to honor browser autoplay policies
  }

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;
      this.freqArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (!this.gainNode) {
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
      this.analyser.connect(this.gainNode);
    }
    return this.ctx;
  }

  public async getOrGenerateBuffer(track: TrackMetadata): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(track.id);
    if (cached) return cached;

    const ctx = this.initContext();
    const buf = await generateSynthTrack(track.id, ctx.sampleRate);
    this.bufferCache.set(track.id, buf);
    track.duration = buf.duration;
    return buf;
  }

  public async play(): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (this.isMicActive) {
      this.isPlaying = true;
      this.notifyPlayState();
      return;
    }

    const currentTrack = this.getCurrentTrack();
    if (!currentTrack) return;

    try {
      const buffer = await this.getOrGenerateBuffer(currentTrack);
      this.stopSource();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(this.playbackRate, ctx.currentTime);
      source.loop = true;
      source.connect(this.analyser!);

      const offset = this.pauseOffset % buffer.duration;
      source.start(0, offset);

      this.sourceNode = source;
      this.startTime = ctx.currentTime - (offset / this.playbackRate);
      this.isPlaying = true;
      this.notifyPlayState();
    } catch (err) {
      console.error('Failed to play audio:', err);
      this.notifyError('Audio playback failed to initialize.');
    }
  }

  public pause(): void {
    if (this.isPlaying && this.ctx && this.sourceNode) {
      const current = this.getCurrentTime();
      this.pauseOffset = current;
      this.stopSource();
    }
    this.isPlaying = false;
    this.notifyPlayState();
  }

  public async togglePlay(): Promise<void> {
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  public seek(targetSeconds: number): void {
    const currentTrack = this.getCurrentTrack();
    if (!currentTrack) return;
    const duration = currentTrack.duration || 1;
    const clamped = Math.max(0, Math.min(targetSeconds, duration));
    this.pauseOffset = clamped;

    if (this.isPlaying) {
      this.play();
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(3.0, rate));
    if (this.sourceNode && this.ctx) {
      this.sourceNode.playbackRate.setValueAtTime(this.playbackRate, this.ctx.currentTime);
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public async selectTrack(index: number): Promise<void> {
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    this.pauseOffset = 0;
    this.notifyTrackChange();
    if (this.isPlaying) {
      await this.play();
    }
  }

  public async nextTrack(): Promise<void> {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    await this.selectTrack(nextIdx);
  }

  public async prevTrack(): Promise<void> {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    await this.selectTrack(prevIdx);
  }

  public getCurrentTrack(): TrackMetadata | null {
    return this.playlist[this.currentTrackIndex] || null;
  }

  public getPlaylist(): TrackMetadata[] {
    return [...this.playlist];
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.pauseOffset;
    }
    const track = this.getCurrentTrack();
    const duration = track?.duration || 60;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    return elapsed % duration;
  }

  public getDuration(): number {
    const track = this.getCurrentTrack();
    return track?.duration || 60;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Load user audio file (MP3, WAV, OGG, FLAC)
   */
  public async loadUserAudioFile(file: File): Promise<TrackMetadata> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      const trackId = `custom-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const newTrack: TrackMetadata = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'User Upload · Local Audio',
        duration: decodedBuffer.duration,
        genre: 'custom',
        isCustom: true,
      };

      this.bufferCache.set(trackId, decodedBuffer);
      this.playlist.unshift(newTrack);
      this.currentTrackIndex = 0;
      this.pauseOffset = 0;

      this.notifyTrackChange();
      await this.play();
      return newTrack;
    } catch (err) {
      console.error('Failed to decode user audio file:', err);
      this.notifyError('Could not decode audio file. Please check that it is a valid MP3, WAV, or OGG file.');
      throw err;
    }
  }

  /**
   * Microphone Input
   */
  public async toggleMicrophone(): Promise<boolean> {
    if (this.isMicActive) {
      this.stopMicrophone();
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const ctx = this.initContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      this.stopSource();
      this.micStream = stream;
      this.micSourceNode = ctx.createMediaStreamSource(stream);
      // Connect to analyser, but NOT to destination so we avoid feedback loops!
      this.micSourceNode.connect(this.analyser!);
      this.isMicActive = true;
      this.isPlaying = true;
      this.notifyPlayState();
      return true;
    } catch (err) {
      console.error('Microphone access denied or unavailable:', err);
      this.notifyError('Microphone access was denied or is not supported.');
      this.isMicActive = false;
      return false;
    }
  }

  public stopMicrophone(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.isMicActive = false;
    this.notifyPlayState();
  }

  private stopSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignored if already stopped
      }
      this.sourceNode = null;
    }
  }

  /**
   * Extract real-time frequency and waveform data
   */
  public analyze(): AudioAnalysisData {
    if (!this.analyser || !this.freqArray || !this.timeArray) {
      // Idle dummy data
      return {
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
      };
    }

    this.analyser.getByteFrequencyData(this.freqArray as any);
    this.analyser.getByteTimeDomainData(this.timeArray as any);

    const binCount = this.analyser.frequencyBinCount;

    // Bass: ~20Hz to 250Hz (bins 1 to 14)
    let bassSum = 0;
    const bassBins = Math.min(16, binCount);
    for (let i = 1; i < bassBins; i++) {
      bassSum += this.freqArray[i];
    }
    const currentBass = (bassSum / (bassBins - 1)) / 255;

    // Mid: ~250Hz to 2500Hz (bins 16 to 120)
    let midSum = 0;
    const midStart = 16;
    const midEnd = Math.min(128, binCount);
    for (let i = midStart; i < midEnd; i++) {
      midSum += this.freqArray[i];
    }
    const currentMid = (midSum / (midEnd - midStart)) / 255;

    // Treble: ~2500Hz to 16000Hz (bins 128 to 700)
    let trebleSum = 0;
    const trebleStart = 128;
    const trebleEnd = Math.min(680, binCount);
    for (let i = trebleStart; i < trebleEnd; i++) {
      trebleSum += this.freqArray[i];
    }
    const currentTreble = (trebleSum / (trebleEnd - trebleStart)) / 255;

    // Volume calculation from time domain
    let volSum = 0;
    for (let i = 0; i < this.timeArray.length; i++) {
      const val = (this.timeArray[i] - 128) / 128;
      volSum += val * val;
    }
    const currentVol = Math.sqrt(volSum / this.timeArray.length);

    // Exponential smoothing
    this.smoothBass = this.smoothBass * 0.7 + currentBass * 0.3;
    this.smoothMid = this.smoothMid * 0.75 + currentMid * 0.25;
    this.smoothTreble = this.smoothTreble * 0.8 + currentTreble * 0.2;
    this.smoothVol = this.smoothVol * 0.7 + currentVol * 0.3;

    // Beat detection using energy surge in bass band
    const now = performance.now();
    this.beatHistory.push(currentBass);
    if (this.beatHistory.length > this.beatHistoryMax) {
      this.beatHistory.shift();
    }

    const avgBass = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;
    const isBeat =
      currentBass > avgBass * 1.35 &&
      currentBass > 0.25 &&
      now - this.lastBeatTime > 220; // 220ms minimum between beats

    let beatIntensity = 0;
    if (isBeat) {
      this.lastBeatTime = now;
      beatIntensity = Math.min(1.0, (currentBass - avgBass) * 2.5);
    }

    // 16-band spectrum calculation (logarithmically distributed)
    const spectrumBands: number[] = new Array(16).fill(0);
    const logFactor = Math.pow(binCount, 1 / 16);
    let prevIdx = 0;
    for (let b = 0; b < 16; b++) {
      const nextIdx = Math.min(binCount, Math.floor(Math.pow(logFactor, b + 1)));
      let bSum = 0;
      let count = 0;
      for (let j = prevIdx; j < nextIdx; j++) {
        bSum += this.freqArray[j];
        count++;
      }
      spectrumBands[b] = count > 0 ? (bSum / count) / 255 : 0;
      prevIdx = nextIdx;
    }

    return {
      frequencyData: this.freqArray,
      waveformData: this.timeArray,
      bass: this.smoothBass,
      mid: this.smoothMid,
      treble: this.smoothTreble,
      volume: this.smoothVol,
      isBeat,
      beatIntensity,
      spectrumBands,
      rawEnergy: currentBass + currentMid + currentTreble,
    };
  }

  // Event subscription
  public onTrackChange(cb: (track: TrackMetadata) => void): () => void {
    this.onTrackChangeCallbacks.push(cb);
    return () => {
      this.onTrackChangeCallbacks = this.onTrackChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onPlayStateChange(cb: (isPlaying: boolean) => void): () => void {
    this.onPlayStateChangeCallbacks.push(cb);
    return () => {
      this.onPlayStateChangeCallbacks = this.onPlayStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onError(cb: (msg: string) => void): () => void {
    this.onErrorCallbacks.push(cb);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyTrackChange(): void {
    const trk = this.getCurrentTrack();
    if (trk) {
      this.onTrackChangeCallbacks.forEach((cb) => cb(trk));
    }
  }

  private notifyPlayState(): void {
    this.onPlayStateChangeCallbacks.forEach((cb) => cb(this.isPlaying));
  }

  private notifyError(msg: string): void {
    this.onErrorCallbacks.forEach((cb) => cb(msg));
  }
}
