// Sound Effects for UNO Show 'Em No Mercy
// Loads authentic sounds with automatic Web Audio synthesizer fallback

class SoundEffects {
    constructor() {
        this.enabled = true;
        this.audioCache = {};
        this.ctx = null;
        this._loadAudioFiles();
        window.addEventListener('pointerdown', () => this._ac(), { once: true });
    }

    _ac() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    _tone(f0, f1, dur, type = 'sine', vol = 0.25, t0 = 0) {
        const a = this._ac();
        if (!a || !this.enabled) return;
        try {
            const o = a.createOscillator();
            const g = a.createGain();
            const t = a.currentTime + t0;
            o.type = type;
            o.frequency.setValueAtTime(f0, t);
            o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g);
            g.connect(a.destination);
            o.start(t);
            o.stop(t + dur);
        } catch (e) {}
    }

    _noise(t0, dur, f0, f1, vol = 0.3) {
        const a = this._ac();
        if (!a || !this.enabled) return;
        try {
            const n = Math.floor(a.sampleRate * dur);
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
            f.frequency.exponentialRampToValueAtTime(Math.max(10, f1), t + dur);
            const g = a.createGain();
            g.gain.value = vol;
            s.connect(f);
            f.connect(g);
            g.connect(a.destination);
            s.start(t);
        } catch (e) {}
    }

    _loadAudioFiles() {
        const soundNames = ["play", "draw", "eliminated", "reverse", "skip", "hover"];
        soundNames.forEach(name => {
            try {
                const audio = new Audio(`/static/sounds/${name}.mp3`);
                audio.preload = "auto";
                this.audioCache[name] = audio;
            } catch (e) {}
        });
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    _playFileOrSynth(name, synthFallback) {
        if (!this.enabled) return;
        const audio = this.audioCache[name];
        if (audio) {
            try {
                audio.currentTime = 0;
                const p = audio.play();
                if (p && p.catch) {
                    p.catch(() => { if (synthFallback) synthFallback(); });
                }
                return;
            } catch (e) {}
        }
        if (synthFallback) synthFallback();
    }

    playCard() {
        this._playFileOrSynth("play", () => {
            this._noise(0, 0.25, 900, 3800, 0.4);
            this._tone(180, 60, 0.12, 'sine', 0.45);
        });
    }

    drawCard() {
        this._playFileOrSynth("draw", () => {
            this._noise(0, 0.12, 2800, 1400, 0.3);
            this._tone(240, 480, 0.08, 'triangle', 0.25);
        });
    }

    penaltyStack() {
        this._playFileOrSynth("reverse", () => {
            this._tone(300, 700, 0.2, 'sawtooth', 0.35);
            this._tone(450, 900, 0.25, 'triangle', 0.3, 0.08);
        });
    }

    mercyKnockout() {
        this._playFileOrSynth("eliminated", () => {
            this._noise(0, 0.6, 600, 60, 0.6);
            this._tone(140, 40, 0.5, 'sawtooth', 0.5);
        });
    }

    skipTurn() {
        this._playFileOrSynth("skip", () => {
            this._tone(600, 200, 0.2, 'sine', 0.3);
        });
    }

    reverseTurn() {
        this._playFileOrSynth("reverse", () => {
            this._tone(250, 600, 0.18, 'sine', 0.35);
        });
    }

    cardHover() {
        this._playFileOrSynth("hover", () => {
            this._tone(500, 520, 0.03, 'sine', 0.08);
        });
    }

    unoShout() {
        this.playCard();
        this._tone(660, 660, 0.12, 'triangle', 0.4);
        this._tone(880, 880, 0.2, 'triangle', 0.4, 0.12);
    }

    victory() {
        this.playCard();
        this._tone(523.25, 523.25, 0.15, 'triangle', 0.35);
        this._tone(659.25, 659.25, 0.15, 'triangle', 0.35, 0.12);
        this._tone(783.99, 783.99, 0.15, 'triangle', 0.35, 0.24);
        this._tone(1046.50, 1046.50, 0.35, 'triangle', 0.45, 0.36);
    }
}

window.sounds = new SoundEffects();
