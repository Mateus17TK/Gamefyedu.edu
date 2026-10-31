class SoundService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('ge_sound_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('ge_sound_muted', String(this.muted));
    } catch {
      // ignore
    }
    return this.muted;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playTone(freq: number, duration: number = 0.12, type: OscillatorType = 'sine', gainVal: number = 0.08) {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio might be blocked by browser policy until user gesture
    }
  }

  public playCorrect() {
    if (this.muted) return;
    this.playTone(523.25, 0.1, 'triangle', 0.1); // C5
    setTimeout(() => this.playTone(659.25, 0.12, 'triangle', 0.1), 80); // E5
    setTimeout(() => this.playTone(783.99, 0.18, 'triangle', 0.12), 160); // G5
  }

  public playWrong() {
    if (this.muted) return;
    this.playTone(220, 0.15, 'sawtooth', 0.06);
    setTimeout(() => this.playTone(180, 0.22, 'sawtooth', 0.06), 110);
  }

  public playCombo() {
    if (this.muted) return;
    const notes = [587.33, 739.99, 880.0, 1174.66];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.12, 'sine', 0.09), idx * 60);
    });
  }

  public playBossHit() {
    if (this.muted) return;
    this.playTone(120, 0.25, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(240, 0.15, 'triangle', 0.1), 60);
  }

  public playLevelUp() {
    if (this.muted) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.18, 'triangle', 0.12), idx * 80);
    });
  }

  public playChestOpen() {
    if (this.muted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.2, 'sine', 0.1), idx * 70);
    });
  }

  public playClick() {
    if (this.muted) return;
    this.playTone(400, 0.04, 'sine', 0.03);
  }
}

export const sound = new SoundService();
