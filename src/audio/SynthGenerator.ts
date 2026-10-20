/**
 * Cyber-Dither Procedural Electronic Music Synthesizer
 * Uses OfflineAudioContext to render high-energy cyberpunk electronic music tracks.
 * Zero external files, zero 404 risk, 100% playable, scrubbable, and responsive!
 */

// Simple helper to create noise buffer for percussion (snares, hi-hats, risers)
function createNoiseBuffer(ctx: BaseAudioContext, duration: number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Converts MIDI note to frequency
function m2f(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export async function generateSynthTrack(
  trackId: string,
  sampleRate = 44100
): Promise<AudioBuffer> {
  let bpm = 124;
  let duration = 48; // 48 seconds seamless loop
  if (trackId === 'glitch-protocol') {
    bpm = 138;
    duration = 44;
  } else if (trackId === 'tokyo-rain') {
    bpm = 84;
    duration = 52;
  } else if (trackId === 'electric-pulse') {
    bpm = 114;
    duration = 46;
  }

  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const noiseBuffer = createNoiseBuffer(offlineCtx, 1.0);

  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const totalBars = Math.floor(duration / barSec);

  // Master bus
  const masterCompressor = offlineCtx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-14, 0);
  masterCompressor.knee.setValueAtTime(10, 0);
  masterCompressor.ratio.setValueAtTime(4, 0);
  masterCompressor.attack.setValueAtTime(0.005, 0);
  masterCompressor.release.setValueAtTime(0.08, 0);
  masterCompressor.connect(offlineCtx.destination);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  masterGain.connect(masterCompressor);

  // Track generator variations
  if (trackId === 'neon-horizon') {
    // 124 BPM Cyber Synthwave / Dance
    renderNeonHorizon(offlineCtx, masterGain, noiseBuffer, beatSec, barSec, totalBars);
  } else if (trackId === 'glitch-protocol') {
    // 138 BPM Industrial Cyberpunk
    renderGlitchProtocol(offlineCtx, masterGain, noiseBuffer, beatSec, barSec, totalBars);
  } else if (trackId === 'tokyo-rain') {
    // 84 BPM Lo-Fi Chillwave
    renderTokyoRain(offlineCtx, masterGain, noiseBuffer, beatSec, barSec, totalBars);
  } else {
    // 114 BPM Future Pop
    renderElectricPulse(offlineCtx, masterGain, noiseBuffer, beatSec, barSec, totalBars);
  }

  return await offlineCtx.startRendering();
}

/**
 * 1. NEON HORIZON (Cyber Synthwave / Dance)
 */
function renderNeonHorizon(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  beatSec: number,
  barSec: number,
  totalBars: number
) {
  // Drum buss
  const drumBus = ctx.createGain();
  drumBus.gain.setValueAtTime(0.9, 0);
  drumBus.connect(dest);

  // 1. Kick Drum (4-on-the-floor)
  for (let bar = 0; bar < totalBars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      const time = bar * barSec + beat * beatSec;
      playKick(ctx, drumBus, time, 150, 42, 0.32);
    }
  }

  // 2. Snare / Clap on beats 2 and 4
  for (let bar = 0; bar < totalBars; bar++) {
    for (let beat of [1, 3]) {
      const time = bar * barSec + beat * beatSec;
      playSnare(ctx, drumBus, noiseBuf, time, 0.22);
    }
  }

  // 3. Hi-hats (16th notes with velocity groove)
  const sixteenth = beatSec / 4;
  for (let bar = 0; bar < totalBars; bar++) {
    for (let i = 0; i < 16; i++) {
      const time = bar * barSec + i * sixteenth;
      const vol = i % 2 === 0 ? 0.18 : 0.08;
      const decay = i % 4 === 2 ? 0.08 : 0.04;
      playHiHat(ctx, drumBus, noiseBuf, time, decay, vol);
    }
  }

  // 4. Bassline: Rolling 16th note synthwave bass (root notes: D, F, G, Bb)
  const bassRoots = [38, 41, 43, 34]; // D2, F2, G2, Bb1
  for (let bar = 0; bar < totalBars; bar++) {
    const root = bassRoots[bar % bassRoots.length];
    for (let i = 0; i < 16; i++) {
      const time = bar * barSec + i * sixteenth;
      // syncopated pattern
      const note = i % 4 === 0 ? root : i % 2 === 0 ? root + 12 : root;
      playSynthBass(ctx, dest, time, m2f(note), sixteenth * 0.85, 0.35, 'sawtooth');
    }
  }

  // 5. Arpeggio Synth (Cyberpunk Pluck)
  const arpNotes = [
    [62, 65, 69, 72, 74, 72, 69, 65], // Dm9
    [65, 69, 72, 76, 77, 76, 72, 69], // Fmaj7
    [67, 70, 74, 77, 79, 77, 74, 70], // Gm9
    [70, 74, 77, 81, 82, 81, 77, 74], // Bbmaj7
  ];
  for (let bar = 0; bar < totalBars; bar++) {
    const notes = arpNotes[bar % arpNotes.length];
    for (let i = 0; i < 16; i++) {
      const time = bar * barSec + i * sixteenth;
      const note = notes[i % notes.length];
      playArpNote(ctx, dest, time, m2f(note), sixteenth * 0.9, 0.22);
    }
  }

  // 6. Lead melody (Plays in bars 2, 3, 6, 7...)
  const leadPhrases = [
    { beat: 0, note: 74, dur: 1.5 },
    { beat: 1.5, note: 72, dur: 1.0 },
    { beat: 2.5, note: 69, dur: 1.5 },
    { beat: 4.0, note: 77, dur: 2.0 },
    { beat: 6.0, note: 76, dur: 2.0 },
  ];
  for (let bar = 0; bar < totalBars; bar += 2) {
    for (const phrase of leadPhrases) {
      const time = bar * barSec + phrase.beat * beatSec;
      playCyberLead(ctx, dest, time, m2f(phrase.note), phrase.dur * beatSec, 0.26);
    }
  }
}

/**
 * 2. GLITCH PROTOCOL (Industrial Cyberpunk)
 */
function renderGlitchProtocol(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  beatSec: number,
  barSec: number,
  totalBars: number
) {
  const sixteenth = beatSec / 4;

  // Heavy distorted kick with sub rumble
  for (let bar = 0; bar < totalBars; bar++) {
    for (let i = 0; i < 4; i++) {
      const time = bar * barSec + i * beatSec;
      playIndustrialKick(ctx, dest, time);
    }
  }

  // Metallic percussions and clanks
  for (let bar = 0; bar < totalBars; bar++) {
    for (let step = 0; step < 16; step++) {
      const time = bar * barSec + step * sixteenth;
      if (step === 4 || step === 12) {
        // Snare smash
        playSnare(ctx, dest, noiseBuf, time, 0.35, 0.35);
      }
      if (step % 3 === 0) {
        // Metallic hat
        playHiHat(ctx, dest, noiseBuf, time, 0.05, 0.16);
      }
    }
  }

  // Aggressive Reese / FM Bassline
  const bassNotes = [36, 36, 39, 36, 42, 41, 36, 44]; // C1 riffs
  for (let bar = 0; bar < totalBars; bar++) {
    for (let i = 0; i < 8; i++) {
      const time = bar * barSec + i * (beatSec / 2);
      const note = bassNotes[(bar * 2 + i) % bassNotes.length];
      playIndustrialBass(ctx, dest, time, m2f(note), beatSec * 0.45, 0.4);
    }
  }

  // Glitch synth stabs
  for (let bar = 0; bar < totalBars; bar++) {
    const stabTimes = [0.5, 1.75, 2.5, 3.25];
    for (const st of stabTimes) {
      const time = bar * barSec + st * beatSec;
      playGlitchStab(ctx, dest, time, m2f(60 + (bar % 4) * 3), 0.15);
    }
  }
}

/**
 * 3. TOKYO RAIN (Lo-Fi Chillwave)
 */
function renderTokyoRain(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  beatSec: number,
  barSec: number,
  totalBars: number
) {
  // Lo-Fi soft kick (boom-bap swing)
  for (let bar = 0; bar < totalBars; bar++) {
    playKick(ctx, dest, bar * barSec + 0 * beatSec, 90, 48, 0.4, 0.25);
    playKick(ctx, dest, bar * barSec + 1.65 * beatSec, 85, 45, 0.35, 0.2);
    playKick(ctx, dest, bar * barSec + 2.5 * beatSec, 80, 45, 0.3, 0.18);
  }

  // Soft rimshot / snare on beats 2 and 4
  for (let bar = 0; bar < totalBars; bar++) {
    playSnare(ctx, dest, noiseBuf, bar * barSec + 1 * beatSec, 0.16, 0.18);
    playSnare(ctx, dest, noiseBuf, bar * barSec + 3 * beatSec, 0.16, 0.18);
  }

  // Relaxed shuffled hi-hat
  const eighth = beatSec / 2;
  for (let bar = 0; bar < totalBars; bar++) {
    for (let i = 0; i < 8; i++) {
      const swing = i % 2 === 1 ? 0.05 : 0;
      const time = bar * barSec + i * eighth + swing;
      playHiHat(ctx, dest, noiseBuf, time, 0.08, 0.09);
    }
  }

  // Warm Rhodes Electric Piano Chords (maj7 / min9 chords)
  const chordProgressions = [
    [60, 64, 67, 71], // Cmaj7
    [57, 60, 64, 69], // Am9
    [62, 65, 69, 72], // Dm7
    [59, 62, 67, 71], // G6/9
  ];
  for (let bar = 0; bar < totalBars; bar++) {
    const chord = chordProgressions[bar % chordProgressions.length];
    const time = bar * barSec;
    for (const note of chord) {
      playWarmRhodes(ctx, dest, time, m2f(note), barSec * 0.9, 0.15);
    }
  }

  // Deep Sub Bass
  const subNotes = [36, 33, 38, 31];
  for (let bar = 0; bar < totalBars; bar++) {
    const note = subNotes[bar % subNotes.length];
    playWarmSub(ctx, dest, bar * barSec, m2f(note), barSec * 0.95, 0.38);
  }
}

/**
 * 4. ELECTRIC PULSE (Future Bass / Pop)
 */
function renderElectricPulse(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  beatSec: number,
  barSec: number,
  totalBars: number
) {
  // Energetic Future Pop rhythm
  for (let bar = 0; bar < totalBars; bar++) {
    // Kick
    playKick(ctx, dest, bar * barSec + 0 * beatSec, 160, 48, 0.35, 0.35);
    playKick(ctx, dest, bar * barSec + 1.5 * beatSec, 150, 48, 0.3, 0.3);
    playKick(ctx, dest, bar * barSec + 2.0 * beatSec, 160, 48, 0.35, 0.35);
    playKick(ctx, dest, bar * barSec + 3.0 * beatSec, 140, 48, 0.28, 0.25);

    // Bright Snare Clap on 2 and 4
    playSnare(ctx, dest, noiseBuf, bar * barSec + 1 * beatSec, 0.25, 0.3);
    playSnare(ctx, dest, noiseBuf, bar * barSec + 3 * beatSec, 0.25, 0.3);
  }

  // Fast bright hi-hats
  const sixteenth = beatSec / 4;
  for (let bar = 0; bar < totalBars; bar++) {
    for (let i = 0; i < 16; i++) {
      playHiHat(ctx, dest, noiseBuf, bar * barSec + i * sixteenth, 0.05, 0.12);
    }
  }

  // Supersaw chords with sidechain pumping
  const popChords = [
    [64, 68, 71, 76], // E maj
    [63, 66, 71, 75], // B maj
    [61, 64, 68, 73], // C# min
    [59, 64, 68, 71], // A maj
  ];
  for (let bar = 0; bar < totalBars; bar++) {
    const chord = popChords[bar % popChords.length];
    for (let beat = 0; beat < 4; beat++) {
      const time = bar * barSec + beat * beatSec;
      for (const note of chord) {
        playPumpingSaw(ctx, dest, time, m2f(note), beatSec * 0.85, 0.18);
      }
    }
  }

  // Punchy bass
  const bassNotes = [40, 35, 37, 33];
  for (let bar = 0; bar < totalBars; bar++) {
    const note = bassNotes[bar % bassNotes.length];
    for (let beat = 0; beat < 4; beat++) {
      playSynthBass(ctx, dest, bar * barSec + beat * beatSec, m2f(note), beatSec * 0.7, 0.3, 'triangle');
    }
  }
}

// ==================== INSTRUMENT SYNTHESIS HELPERS ====================

function playKick(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  startFreq = 160,
  endFreq = 45,
  decay = 0.32,
  volume = 0.4
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, time);
  osc.frequency.exponentialRampToValueAtTime(endFreq, time + decay);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + decay);
}

function playIndustrialKick(ctx: OfflineAudioContext, dest: AudioNode, time: number) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.28);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, time);
  filter.frequency.exponentialRampToValueAtTime(90, time + 0.3);

  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + 0.35);
}

function playSnare(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  time: number,
  duration = 0.2,
  volume = 0.25
) {
  // Noise component
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.setValueAtTime(800, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(dest);

  // Tone component (body)
  const toneOsc = ctx.createOscillator();
  const toneGain = ctx.createGain();
  toneOsc.type = 'triangle';
  toneOsc.frequency.setValueAtTime(240, time);
  toneOsc.frequency.exponentialRampToValueAtTime(110, time + 0.1);

  toneGain.gain.setValueAtTime(volume * 0.8, time);
  toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

  toneOsc.connect(toneGain);
  toneGain.connect(dest);

  noiseSource.start(time);
  noiseSource.stop(time + duration);
  toneOsc.start(time);
  toneOsc.stop(time + 0.12);
}

function playHiHat(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  noiseBuf: AudioBuffer,
  time: number,
  duration = 0.05,
  volume = 0.15
) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(7000, time);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  source.start(time);
  source.stop(time + duration);
}

function playSynthBass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.3,
  type: OscillatorType = 'sawtooth'
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);
  filter.Q.setValueAtTime(4.0, time);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playIndustrialBass(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.35
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(freq, time);
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(freq * 1.01, time); // detuned

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(350, time);
  filter.frequency.exponentialRampToValueAtTime(140, time + duration);
  filter.Q.setValueAtTime(3.5, time);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration);
  osc2.stop(time + duration);
}

function playArpNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.2
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 3.5, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + duration);
  filter.Q.setValueAtTime(5, time);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playCyberLead(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.25
) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3200, time);
  filter.Q.setValueAtTime(2, time);

  gain.gain.setValueAtTime(0.01, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.05);
  gain.gain.setValueAtTime(volume, time + duration - 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playGlitchStab(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq * 1.5, time);
  osc.frequency.exponentialRampToValueAtTime(freq, time + duration);

  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playWarmRhodes(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playWarmSub(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.35
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}

function playPumpingSaw(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  duration: number,
  volume = 0.18
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  // Sidechain ducking simulation (dip then rise)
  gain.gain.setValueAtTime(volume * 0.2, time);
  gain.gain.linearRampToValueAtTime(volume, time + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration);
}
