/**
 * Audio Synthesizer for Photobooth sound effects via Web Audio API.
 * High fidelity synthesized sound with zero external audio assets.
 */

class PhotoboothAudio {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Countdown tick beep
   * @param isFinal true on the last tick (higher pitch)
   */
  playCountdownBeep(isFinal: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 750, ctx.currentTime);
      if (isFinal) {
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isFinal ? 0.22 : 0.12));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (isFinal ? 0.25 : 0.15));
    } catch {
      // Audio playback silently suppressed if autoplay not allowed yet
    }
  }

  /**
   * Realistic mechanical camera shutter sound:
   * 1. Mirror slap up (low thump)
   * 2. High-speed shutter curtain click
   * 3. Motor drive rewind whirr
   */
  playShutterSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Shutter mirror slap
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);

      // 2. High snap noise (curtain release)
      const bufferSize = ctx.sampleRate * 0.07;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now + 0.02);
      filter.Q.setValueAtTime(2.5, now + 0.02);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start(now + 0.02);
      whiteNoise.stop(now + 0.09);

      // 3. Film advance motor gear tick
      setTimeout(() => {
        try {
          if (!this.ctx) return;
          const t = this.ctx.currentTime;
          const motorOsc = this.ctx.createOscillator();
          const motorGain = this.ctx.createGain();
          motorOsc.type = 'sawtooth';
          motorOsc.frequency.setValueAtTime(520, t);
          motorOsc.frequency.linearRampToValueAtTime(260, t + 0.12);

          motorGain.gain.setValueAtTime(0.08, t);
          motorGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

          motorOsc.connect(motorGain);
          motorGain.connect(this.ctx.destination);
          motorOsc.start(t);
          motorOsc.stop(t + 0.15);
        } catch {
          // ignore
        }
      }, 120);

    } catch {
      // Audio playback silently suppressed
    }
  }

  /**
   * Print job spooler mechanical feed sound
   */
  playPrinterSpool() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      osc.frequency.setValueAtTime(1100, now + 0.2);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }
}

export const soundManager = new PhotoboothAudio();
