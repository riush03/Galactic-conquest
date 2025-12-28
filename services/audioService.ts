
class SpaceAudio {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private rumbleOsc: OscillatorNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Main Engine Hum
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A
    
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    
    this.engineOsc.start();

    // Deep Rumble
    this.rumbleOsc = this.ctx.createOscillator();
    this.rumbleOsc.type = 'sine';
    this.rumbleOsc.frequency.setValueAtTime(30, this.ctx.currentTime);
    const rumbleGain = this.ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);
    this.rumbleOsc.start();
  }

  setEngine(intensity: number) {
    if (!this.ctx || !this.engineGain) return;
    const targetGain = 0.05 + (intensity * 0.15);
    const targetFreq = 55 + (intensity * 40);
    
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    this.engineOsc?.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
  }

  playWarp() {
    if (!this.ctx) return;
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(100, this.ctx.currentTime);
    sweep.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 1);
    sweepGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    sweep.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweep.start();
    sweep.stop(this.ctx.currentTime + 2);
  }
}

export const spaceAudio = new SpaceAudio();
