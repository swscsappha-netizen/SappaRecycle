// Web Audio API Sound Synthesizer for Raspberry Pi Touchscreen Kiosk

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SoundEngine = {
  muted: false,

  setMuted(mute: boolean) {
    this.muted = mute;
  },

  // Keypad touch beep
  playBeep() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context silently handled
    }
  },

  // Delete / backspace sound
  playDelete() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // Ignore
    }
  },

  // Success coin chime (PET / CAN accepted)
  playChime() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [987.77, 1318.51, 1975.53]; // B5, E6, B6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + i * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Ignore
    }
  },

  // Warning Buzz for foreign object / rejection
  playBuzz() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(140, ctx.currentTime);
      osc2.frequency.setValueAtTime(148, ctx.currentTime); // Beating dissonance

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch {
      // Ignore
    }
  },

  // Victory fanfare on completion
  playFanfare() {
    if (this.muted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Chord arpeggio: C5, E5, G5, C6 triumph
      const chords = [
        { freq: 523.25, time: 0.0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.12 }, // G5
        { freq: 1046.5, time: 0.36, dur: 0.55 }, // C6
      ];

      chords.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Ignore
    }
  }
};
