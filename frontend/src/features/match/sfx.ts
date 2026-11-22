let AC: AudioContext | null = null;
let mute = false;

export function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!AC) {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      AC = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (AC.state === 'suspended') {
    void AC.resume();
  }
  return AC;
}

export function setMute(muted: boolean) {
  mute = muted;
}

export function isMuted(): boolean {
  return mute;
}

export function noise(t0: number, dur: number, f0: number, f1: number, vol: number) {
  const a = ac();
  if (!a || mute) return;
  const n = (a.sampleRate * dur) | 0;
  const b = a.createBuffer(1, n, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource();
  s.buffer = b;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.Q.value = 1.2;
  const t = a.currentTime + t0;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  g.gain.value = vol;
  s.connect(f);
  f.connect(g);
  g.connect(a.destination);
  s.start(t);
}

export function tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, t0 = 0) {
  const a = ac();
  if (!a || mute) return;
  const o = a.createOscillator();
  const g = a.createGain();
  const t = a.currentTime + t0;
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sfx = {
  playGo() {
    noise(0, 0.3, 900, 4200, 0.45);
  },
  playEnd() {
    tone(170, 55, 0.14, 'sine', 0.55);
    noise(0, 0.06, 3000, 1500, 0.5);
  },
  drawGo() {
    noise(0, 0.14, 2800, 1500, 0.3);
  },
  drawEnd() {
    noise(0, 0.05, 2000, 1000, 0.25);
  },
  uno() {
    tone(660, 660, 0.12, 'triangle', 0.3);
    tone(880, 880, 0.18, 'triangle', 0.3, 0.12);
  },
  meow() {
    tone(660, 660, 0.12, 'triangle', 0.3);
    tone(880, 880, 0.18, 'triangle', 0.3, 0.12);
  },
  buzz() {
    tone(130, 90, 0.3, 'sawtooth', 0.18);
  },
  skip() {
    tone(520, 180, 0.22, 'square', 0.12);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => ac(), { once: true });
}
