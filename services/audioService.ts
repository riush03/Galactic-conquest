
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

    // 2. Synthesized Crickets
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
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(4500 + Math.random() * 500, now);
      g.gain.setValueAtTime(0, now);
      for(let i=0; i<3; i++) {
        g.gain.exponentialRampToValueAtTime(0.1, now + i*0.05 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + i*0.05 + 0.04);
      }
      osc.connect(g);
      g.connect(this.cricketGain);
      osc.start(now);
      osc.stop(now + 0.2);
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

  playLaser() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  }

  playWhoosh() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.4);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    noise.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    noise.start();
  }

  playSuccess() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; 
    frequencies.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      g.gain.setValueAtTime(0, now + i * 0.08);
      g.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });
  }

  playExplosion() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.5, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) output[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noise.connect(g);
    g.connect(this.ctx.destination);
    noise.start();
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
