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
    const a = ac();
    if (!a || mute) return;
    const t = a.currentTime;

    // 1. Crisp fingertip flick transient (card snapping cleanly off fingers)
    const flick = a.createOscillator();
    const flickGain = a.createGain();
    const flickFilter = a.createBiquadFilter();
    flickFilter.type = 'bandpass';
    flickFilter.frequency.setValueAtTime(2700, t);
    flickFilter.Q.setValueAtTime(4.2, t);
    flick.type = 'triangle';
    flick.frequency.setValueAtTime(3200, t);
    flick.frequency.exponentialRampToValueAtTime(1100, t + 0.035);
    flickGain.gain.setValueAtTime(0.38, t);
    flickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);
    flick.connect(flickFilter);
    flickFilter.connect(flickGain);
    flickGain.connect(a.destination);
    flick.start(t);
    flick.stop(t + 0.04);

    // 2. Silky card glide (gentle, velvety linen whisper instead of loud harsh whoosh)
    const n = (a.sampleRate * 0.18) | 0;
    const b = a.createBuffer(1, n, a.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n);
    const s = a.createBufferSource();
    s.buffer = b;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2.4;
    f.frequency.setValueAtTime(1600, t);
    f.frequency.exponentialRampToValueAtTime(2300, t + 0.09);
    f.frequency.exponentialRampToValueAtTime(1150, t + 0.18);
    const g = a.createGain();
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    s.connect(f);
    f.connect(g);
    g.connect(a.destination);
    s.start(t);

    // 3. Subtle tactile harmonic resonance
    const pluck = a.createOscillator();
    const pluckGain = a.createGain();
    pluck.type = 'sine';
    pluck.frequency.setValueAtTime(540, t);
    pluck.frequency.exponentialRampToValueAtTime(310, t + 0.065);
    pluckGain.gain.setValueAtTime(0.14, t);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    pluck.connect(pluckGain);
    pluckGain.connect(a.destination);
    pluck.start(t);
    pluck.stop(t + 0.075);
  },
  playEnd() {
    const a = ac();
    if (!a || mute) return;
    const t = a.currentTime;

    // 1. Satisfying deck slap (card slapping firmly onto the stack)
    const slap = a.createOscillator();
    const slapGain = a.createGain();
    const slapFilter = a.createBiquadFilter();
    slapFilter.type = 'bandpass';
    slapFilter.frequency.setValueAtTime(1900, t);
    slapFilter.Q.setValueAtTime(3.8, t);
    slap.type = 'triangle';
    slap.frequency.setValueAtTime(2600, t);
    slap.frequency.exponentialRampToValueAtTime(600, t + 0.038);
    slapGain.gain.setValueAtTime(0.44, t);
    slapGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.042);
    slap.connect(slapFilter);
    slapFilter.connect(slapGain);
    slapGain.connect(a.destination);
    slap.start(t);
    slap.stop(t + 0.045);

    // 2. Crisp linen snap (paper texture click on contact)
    const n = (a.sampleRate * 0.02) | 0;
    const b = a.createBuffer(1, n, a.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource();
    s.buffer = b;
    const f = a.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.setValueAtTime(2800, t);
    const g = a.createGain();
    g.gain.setValueAtTime(0.34, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    s.connect(f);
    f.connect(g);
    g.connect(a.destination);
    s.start(t);

    // 3. Deep woody deck thump (solid felt/table body resonance)
    const thud = a.createOscillator();
    const thudGain = a.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(160, t);
    thud.frequency.exponentialRampToValueAtTime(50, t + 0.05);
    thudGain.gain.setValueAtTime(0.52, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    thud.connect(thudGain);
    thudGain.connect(a.destination);
    thud.start(t);
    thud.stop(t + 0.065);
  },
  drawGo() {
    const a = ac();
    if (!a || mute) return;
    const t = a.currentTime;

    // Crisp top-card slide from deck
    sfx.tick(0.28, 2600);
    const n = (a.sampleRate * 0.12) | 0;
    const b = a.createBuffer(1, n, a.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / n);
    const s = a.createBufferSource();
    s.buffer = b;
    const f = a.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(2200, t);
    f.Q.value = 2.0;
    const g = a.createGain();
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    s.connect(f);
    f.connect(g);
    g.connect(a.destination);
    s.start(t);
  },
  drawEnd() {
    sfx.tick(0.34, 2100);
  },
  tick(vol = 0.32, pitch = 2300) {
    const a = ac();
    if (!a || mute) return;
    const t = a.currentTime;

    // 1. Crisp high resonant transient click
    const osc = a.createOscillator();
    const gain = a.createGain();
    const filter = a.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(pitch, t);
    filter.Q.setValueAtTime(5.5, t);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, t + 0.022);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.026);

    // 2. Micro noise snap (card paper/linen texture)
    const n = (a.sampleRate * 0.012) | 0;
    const buf = a.createBuffer(1, n, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const nSource = a.createBufferSource();
    nSource.buffer = buf;
    const nFilter = a.createBiquadFilter();
    nFilter.type = 'highpass';
    nFilter.frequency.setValueAtTime(3200, t);
    const nGain = a.createGain();
    nGain.gain.setValueAtTime(vol * 0.45, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
    nSource.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(a.destination);
    nSource.start(t);

    // 3. Low tactile body thump
    const sub = a.createOscillator();
    const subGain = a.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, t);
    sub.frequency.exponentialRampToValueAtTime(45, t + 0.02);
    subGain.gain.setValueAtTime(vol * 0.55, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
    sub.connect(subGain);
    subGain.connect(a.destination);
    sub.start(t);
    sub.stop(t + 0.025);
  },
  meow(vol = 0.42) {
    const a = ac();
    if (!a || mute) return;
    const t = a.currentTime;
    const dur = 0.44;

    // Vocal tract oscillator
    const osc = a.createOscillator();
    osc.type = 'sawtooth';

    // Pitch sweep: starts ~460Hz, rises to ~820Hz, drops down to ~380Hz
    osc.frequency.setValueAtTime(460, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.14);
    osc.frequency.exponentialRampToValueAtTime(380, t + dur);

    // Subtle feline vibrato
    const vib = a.createOscillator();
    const vibGain = a.createGain();
    vib.frequency.setValueAtTime(5.8, t);
    vibGain.gain.setValueAtTime(18, t);
    vib.connect(osc.frequency);
    vib.start(t);
    vib.stop(t + dur);

    // Formant vowel filter ("m" -> "eee" -> "oww")
    const filter = a.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.4, t);
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(2150, t + 0.13);
    filter.frequency.exponentialRampToValueAtTime(620, t + dur);

    // Amplitude envelope
    const gain = a.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.05);
    gain.gain.setValueAtTime(vol, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(a.destination);

    osc.start(t);
    osc.stop(t + dur);
  },
  uno() {
    sfx.meow();
  },
  buzz() {
    tone(130, 90, 0.3, 'sawtooth', 0.18);
  },
  skip() {
    tone(520, 180, 0.22, 'square', 0.12);
    sfx.tick(0.3, 2100);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => ac(), { once: true });
}
