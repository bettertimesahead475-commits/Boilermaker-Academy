import { WeldingProcess } from '../types/academy';

class WeldAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;
  private buzzOsc: OscillatorNode | null = null;
  private buzzGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private active = false;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted || !this.active ? 0 : 0.18, this.ctx.currentTime, 0.03);
    }
  }

  public startArc(process: WeldingProcess) {
    if (this.muted || this.active) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }

      const ctx = this.ctx;
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.setTargetAtTime(0.16, ctx.currentTime, 0.02);
      master.connect(ctx.destination);
      this.masterGain = master;

      // Crackle / sizzle noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const impulse = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 1.4 : 0;
        data[i] = (Math.random() * 2 - 1) * 0.45 + impulse;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = process === 'FCAW-G' || process === 'FCAW-S' ? 2100 : 1650;
      filter.Q.value = 0.85;
      this.filter = filter;

      const cGain = ctx.createGain();
      cGain.gain.value = 0.8;
      this.crackleGain = cGain;

      noise.connect(filter);
      filter.connect(cGain);
      cGain.connect(master);
      noise.start();
      this.noiseNode = noise;

      // 120 Hz transformer / arc hum
      const osc = ctx.createOscillator();
      osc.type = process === 'FCAW-G' || process === 'GMAW' ? 'sawtooth' : 'triangle';
      osc.frequency.value = process === 'FCAW-G' ? 135 : 118;

      const bGain = ctx.createGain();
      bGain.gain.value = 0.22;
      this.buzzGain = bGain;

      osc.connect(bGain);
      bGain.connect(master);
      osc.start();
      this.buzzOsc = osc;

      this.active = true;
    } catch {
      // Ignore Web Audio restriction failures silently
    }
  }

  public updateArc(stability: number, arcLengthMm: number) {
    if (!this.active || !this.ctx || !this.filter || !this.buzzOsc || !this.crackleGain) return;
    const now = this.ctx.currentTime;
    const clampedStab = Math.max(10, Math.min(100, stability));
    // Longer arc -> higher hiss & sputter
    const freq = 1350 + arcLengthMm * 280 + (100 - clampedStab) * 14;
    this.filter.frequency.setTargetAtTime(freq, now, 0.04);
    this.crackleGain.gain.setTargetAtTime(0.65 + (100 - clampedStab) * 0.008, now, 0.04);
    this.buzzOsc.frequency.setTargetAtTime(112 + (clampedStab / 100) * 28, now, 0.04);
  }

  public stopArc() {
    if (!this.active) return;
    this.active = false;
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02);
      }
      const n = this.noiseNode;
      const o = this.buzzOsc;
      window.setTimeout(() => {
        try {
          n?.stop();
          n?.disconnect();
          o?.stop();
          o?.disconnect();
        } catch {
          // ignore
        }
      }, 60);
    } catch {
      // ignore
    }
    this.noiseNode = null;
    this.buzzOsc = null;
  }

  public playChipSlagSound() {
    if (this.muted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // ignore
    }
  }
}

export const weldAudio = new WeldAudioEngine();
