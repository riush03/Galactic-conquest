
class SpaceAudio {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private cricketGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 1. Engine Hum
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
    
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // 2. Synthesized Crickets (Night Sounds)
    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    this.cricketGain.connect(this.ctx.destination);
    this.startCrickets();
  }

  private startCrickets() {
    if (!this.ctx || !this.cricketGain) return;
    
    const chirp = () => {
      if (!this.ctx || !this.cricketGain) return;
      const now = this.ctx.currentTime;
      
      // High pitched oscillator for the "chirp"
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500 + Math.random() * 500, now);
      
      // Rapid pulse pattern
      g.gain.setValueAtTime(0, now);
      for(let i=0; i<3; i++) {
        g.gain.exponentialRampToValueAtTime(0.1, now + i*0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + i*0.05 + 0.04);
      }
      
      osc.connect(g);
      g.connect(this.cricketGain);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
      // Schedule next chirp randomly
      setTimeout(chirp, 800 + Math.random() * 2000);
    };
    
    chirp();
  }

  setEngine(intensity: number) {
    if (!this.ctx || !this.engineGain) return;
    const targetGain = 0.05 + (intensity * 0.1);
    const targetFreq = 55 + (intensity * 30);
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    this.engineOsc?.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
  }

  playWarp() {
    if (!this.ctx) return;
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(100, this.ctx.currentTime);
    sweep.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 1.2);
    sweepGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    sweep.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweep.start();
    sweep.stop(this.ctx.currentTime + 2);
  }
}

export const spaceAudio = new SpaceAudio();
