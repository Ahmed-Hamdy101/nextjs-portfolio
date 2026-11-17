type Listener = () => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let rumbleGain: GainNode | null = null;
let murmurGain: GainNode | null = null;
let white: AudioBuffer | null = null;
let enabled = false;
let motion = 0;
let smooth = 0;
let nextBeat = 0;
let scheduler = 0;
let lastWhoosh = 0;
let lastTone = 0;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

function noiseBuffer(c: AudioContext, brown: boolean) {
    const length = c.sampleRate * 4;
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) {
            last = (last + 0.02 * w) / 1.02;
            data[i] = last * 3.5;
        } else {
            data[i] = w;
        }
    }
    return buffer;
}

function loopOf(c: AudioContext, buffer: AudioBuffer) {
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.start();
    return source;
}

/** One rail joint: a short filtered noise knock plus a low thump. */
function clack(c: AudioContext, bus: AudioNode, at: number, level: number) {
    if (!white) return;
    const src = c.createBufferSource();
    src.buffer = white;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 900 + Math.random() * 500;
    band.Q.value = 2.2;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.16 * level, at + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    src.connect(band);
    band.connect(gain);
    gain.connect(bus);
    src.start(at, Math.random() * 2);
    src.stop(at + 0.09);

    const thump = c.createOscillator();
    const tg = c.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(95, at);
    thump.frequency.exponentialRampToValueAtTime(55, at + 0.08);
    tg.gain.setValueAtTime(0, at);
    tg.gain.linearRampToValueAtTime(0.1 * level, at + 0.004);
    tg.gain.exponentialRampToValueAtTime(0.0001, at + 0.11);
    thump.connect(tg);
    tg.connect(bus);
    thump.start(at);
    thump.stop(at + 0.13);
}

/** Train ambience: engine rumble, electrical hum, faint station murmur and rail clatter that follows the train's speed. */
function build(c: AudioContext) {
    master = c.createGain();
    master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.connect(master);
    master.connect(c.destination);

    white = noiseBuffer(c, false);
    const brown = noiseBuffer(c, true);

    const rumble = c.createBiquadFilter();
    rumble.type = "lowpass";
    rumble.frequency.value = 150;
    rumble.Q.value = 0.7;
    rumbleGain = c.createGain();
    rumbleGain.gain.value = 0.2;
    loopOf(c, brown).connect(rumble);
    rumble.connect(rumbleGain);
    rumbleGain.connect(comp);

    [
        [50, 0.016],
        [100, 0.009],
        [150, 0.004],
    ].forEach(([freq, level]) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = level;
        osc.connect(g);
        g.connect(comp);
        osc.start();
    });

    const murmurBand = c.createBiquadFilter();
    murmurBand.type = "bandpass";
    murmurBand.frequency.value = 600;
    murmurBand.Q.value = 0.5;
    const murmurCut = c.createBiquadFilter();
    murmurCut.type = "lowpass";
    murmurCut.frequency.value = 1100;
    murmurGain = c.createGain();
    murmurGain.gain.value = 0.02;
    loopOf(c, white).connect(murmurBand);
    murmurBand.connect(murmurCut);
    murmurCut.connect(murmurGain);
    murmurGain.connect(comp);

    nextBeat = c.currentTime + 0.2;
    scheduler = window.setInterval(() => {
        if (!ctx || !rumbleGain || !murmurGain) return;
        const now = ctx.currentTime;
        smooth += (motion - smooth) * 0.2;

        rumbleGain.gain.setTargetAtTime(0.16 + 0.5 * smooth, now, 0.35);
        murmurGain.gain.setTargetAtTime((0.012 + Math.random() * 0.022) * (1 - smooth * 0.8), now, 0.5);

        if (nextBeat < now) nextBeat = now;
        const interval = 1 / (1.5 + 3.8 * smooth);
        while (nextBeat < now + 0.3) {
            if (smooth > 0.06) {
                const level = 0.35 + 0.65 * smooth;
                clack(ctx, comp, nextBeat, level);
                clack(ctx, comp, nextBeat + 0.085, level * 0.7);
            }
            nextBeat += interval;
        }
    }, 90);
}

function guard(cooldown: number, last: number) {
    return enabled && ctx && master && performance.now() - last >= cooldown;
}

export const sound = {
    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
    isEnabled: () => enabled,

    /** 0 = parked at the platform, 1 = running at speed. Drives rumble level and rail clatter. */
    setMotion(value: number) {
        motion = Math.min(1, Math.max(0, value));
    },

    async enable() {
        if (enabled) return;
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        if (!ctx) {
            ctx = new Ctor();
            build(ctx);
        }
        await ctx.resume();
        enabled = true;
        master?.gain.cancelScheduledValues(ctx.currentTime);
        master?.gain.setTargetAtTime(0.75, ctx.currentTime, 0.9);
        emit();
    },

    disable() {
        if (!enabled || !ctx) return;
        enabled = false;
        master?.gain.cancelScheduledValues(ctx.currentTime);
        master?.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
        const current = ctx;
        window.setTimeout(() => {
            if (!enabled) void current.suspend();
        }, 900);
        emit();
    },

    toggle() {
        return enabled ? this.disable() : this.enable();
    },

    whoosh() {
        if (!guard(900, lastWhoosh) || !ctx || !master || !white) return;
        lastWhoosh = performance.now();
        const now = ctx.currentTime;
        const src = ctx.createBufferSource();
        src.buffer = white;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.Q.value = 1.1;
        band.frequency.setValueAtTime(280, now);
        band.frequency.exponentialRampToValueAtTime(1800, now + 0.7);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        src.connect(band);
        band.connect(gain);
        gain.connect(master);
        src.start(now, Math.random() * 2);
        src.stop(now + 1);
    },

    /** Pneumatic hiss plus door warning beeps: three quick beeps when closing, a soft two-tone when opening. */
    doors(open: boolean) {
        if (!enabled || !ctx || !master || !white) return;
        const now = ctx.currentTime;

        const hiss = ctx.createBufferSource();
        hiss.buffer = white;
        const high = ctx.createBiquadFilter();
        high.type = "highpass";
        high.frequency.value = 3200;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0, now + (open ? 0.5 : 0.35));
        hg.gain.linearRampToValueAtTime(0.05, now + (open ? 0.55 : 0.4));
        hg.gain.exponentialRampToValueAtTime(0.0001, now + (open ? 1.2 : 0.9));
        hiss.connect(high);
        high.connect(hg);
        hg.connect(master);
        hiss.start(now, Math.random() * 2);
        hiss.stop(now + 1.4);

        const beeps = open ? [[1480, 0.45, 0.18], [1175, 0.68, 0.22]] : [[2093, 0, 0.12], [2093, 0.2, 0.12], [2093, 0.4, 0.12]];
        beeps.forEach(([freq, delay, length]) => {
            const osc = ctx!.createOscillator();
            const g = ctx!.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            g.gain.setValueAtTime(0, now + delay);
            g.gain.linearRampToValueAtTime(0.045, now + delay + 0.01);
            g.gain.setValueAtTime(0.045, now + delay + length);
            g.gain.exponentialRampToValueAtTime(0.0001, now + delay + length + 0.05);
            osc.connect(g);
            g.connect(master!);
            osc.start(now + delay);
            osc.stop(now + delay + length + 0.08);
        });
    },

    /** Two-note station chime for arrivals. */
    chime() {
        if (!enabled || !ctx || !master) return;
        const now = ctx.currentTime;
        [
            [659.25, 0],
            [523.25, 0.34],
        ].forEach(([freq, delay]) => {
            const osc = ctx!.createOscillator();
            const gain = ctx!.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.05, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.1);
            osc.connect(gain);
            gain.connect(master!);
            osc.start(now + delay);
            osc.stop(now + delay + 1.2);
        });
    },

    tone(freq = 880) {
        if (!guard(240, lastTone) || !ctx || !master) return;
        lastTone = performance.now();
        const now = ctx.currentTime;
        [freq, freq * 1.5].forEach((f, i) => {
            const osc = ctx!.createOscillator();
            const gain = ctx!.createGain();
            osc.type = "sine";
            osc.frequency.value = f;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(i ? 0.012 : 0.04, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
            osc.connect(gain);
            gain.connect(master!);
            osc.start(now);
            osc.stop(now + 0.65);
        });
    },
};
