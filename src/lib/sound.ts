type Listener = () => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bus: GainNode | null = null;
let rumbleGain: GainNode | null = null;
let roarGain: GainNode | null = null;
let hissGain: GainNode | null = null;
let hissBand: BiquadFilterNode | null = null;
let murmurGain: GainNode | null = null;
let white: AudioBuffer | null = null;
let enabled = false;
let motion = 0;
let smooth = 0;
let nextBeat = 0;
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

/** A decaying noise tail, so everything sounds like it is inside a tunnel. */
function tunnelImpulse(c: AudioContext) {
    const length = Math.floor(c.sampleRate * 1.9);
    const buffer = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
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

/** A filtered noise burst with an optional low body: the building block of every knock, thud and hiss below. */
function burst(c: AudioContext, out: AudioNode, at: number, opts: { freq: number; q: number; level: number; length: number; low?: number; body?: number }) {
    if (!white) return;
    const src = c.createBufferSource();
    src.buffer = white;
    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = opts.freq;
    band.Q.value = opts.q;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(opts.level, at + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + opts.length);
    src.connect(band);
    band.connect(gain);
    gain.connect(out);
    src.start(at, Math.random() * 2);
    src.stop(at + opts.length + 0.03);

    if (opts.low) {
        const body = c.createOscillator();
        const bg = c.createGain();
        body.type = "sine";
        body.frequency.setValueAtTime(opts.low, at);
        body.frequency.exponentialRampToValueAtTime(opts.low * 0.5, at + opts.length);
        bg.gain.setValueAtTime(0, at);
        bg.gain.linearRampToValueAtTime(opts.body ?? opts.level * 0.5, at + 0.008);
        bg.gain.exponentialRampToValueAtTime(0.0001, at + opts.length * 1.3);
        body.connect(bg);
        bg.connect(out);
        body.start(at);
        body.stop(at + opts.length * 1.4);
    }
}

/** One wheel set crossing a rail joint: a dull iron knock, never a click. */
function knock(c: AudioContext, out: AudioNode, at: number, level: number) {
    const pan = c.createStereoPanner();
    pan.pan.value = (Math.random() - 0.5) * 0.3;
    pan.connect(out);
    burst(c, pan, at, { freq: 240 + Math.random() * 120, q: 0.9, level: 0.5 * level, length: 0.14, low: 70, body: 0.14 * level });
}

/**
 * Metro ambience with no tones in it: a low tunnel rumble, a broad roar and rail hiss that swell with speed, wheels
 * crossing rail joints in the classic da-dum da-dum, and a very faint station murmur when parked.
 */
function build(c: AudioContext) {
    master = c.createGain();
    master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.ratio.value = 4;
    comp.connect(master);
    master.connect(c.destination);

    bus = c.createGain();
    const convolver = c.createConvolver();
    convolver.buffer = tunnelImpulse(c);
    const wet = c.createGain();
    wet.gain.value = 0.3;
    bus.connect(comp);
    bus.connect(convolver);
    convolver.connect(wet);
    wet.connect(comp);

    white = noiseBuffer(c, false);
    const brown = noiseBuffer(c, true);

    const rumble = c.createBiquadFilter();
    rumble.type = "lowpass";
    rumble.frequency.value = 120;
    rumbleGain = c.createGain();
    rumbleGain.gain.value = 0.1;
    loopOf(c, brown).connect(rumble);
    rumble.connect(rumbleGain);
    rumbleGain.connect(bus);

    const roar = c.createBiquadFilter();
    roar.type = "bandpass";
    roar.frequency.value = 300;
    roar.Q.value = 0.4;
    roarGain = c.createGain();
    roarGain.gain.value = 0;
    loopOf(c, brown).connect(roar);
    roar.connect(roarGain);
    roarGain.connect(bus);

    hissBand = c.createBiquadFilter();
    hissBand.type = "bandpass";
    hissBand.frequency.value = 2000;
    hissBand.Q.value = 0.5;
    hissGain = c.createGain();
    hissGain.gain.value = 0;
    loopOf(c, white).connect(hissBand);
    hissBand.connect(hissGain);
    hissGain.connect(bus);

    const murmurBand = c.createBiquadFilter();
    murmurBand.type = "bandpass";
    murmurBand.frequency.value = 500;
    murmurBand.Q.value = 0.5;
    const murmurCut = c.createBiquadFilter();
    murmurCut.type = "lowpass";
    murmurCut.frequency.value = 900;
    murmurGain = c.createGain();
    murmurGain.gain.value = 0.01;
    loopOf(c, white).connect(murmurBand);
    murmurBand.connect(murmurCut);
    murmurCut.connect(murmurGain);
    murmurGain.connect(bus);

    nextBeat = c.currentTime + 0.2;
    window.setInterval(() => {
        if (!ctx || !rumbleGain || !roarGain || !murmurGain || !hissGain || !hissBand || !bus) return;
        const now = ctx.currentTime;
        smooth += (motion - smooth) * 0.2;

        rumbleGain.gain.setTargetAtTime(0.1 + 0.3 * smooth, now, 0.4);
        roarGain.gain.setTargetAtTime(0.36 * smooth, now, 0.4);
        hissGain.gain.setTargetAtTime(0.026 * smooth * smooth, now, 0.35);
        hissBand.frequency.setTargetAtTime(1500 + 2200 * smooth, now, 0.3);
        murmurGain.gain.setTargetAtTime(0.014 * (1 - smooth), now, 0.6);

        if (nextBeat < now) nextBeat = now;
        const interval = 1 / (0.9 + 2.4 * smooth);
        while (nextBeat < now + 0.3) {
            if (smooth > 0.06) {
                const level = 0.3 + 0.7 * smooth;
                const gap = 0.1 - 0.04 * smooth;
                knock(ctx, bus, nextBeat, level);
                knock(ctx, bus, nextBeat + gap, level * 0.8);
                knock(ctx, bus, nextBeat + interval * 0.5, level * 0.9);
                knock(ctx, bus, nextBeat + interval * 0.5 + gap, level * 0.7);
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

    /** 0 = parked at the platform, 1 = running at speed. Drives rumble, roar and rail clatter. */
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

    /** The wall of air as the train passes through the camera. */
    whoosh() {
        if (!guard(900, lastWhoosh) || !ctx || !bus) return;
        lastWhoosh = performance.now();
        const now = ctx.currentTime;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.Q.value = 0.8;
        band.frequency.setValueAtTime(180, now);
        band.frequency.exponentialRampToValueAtTime(1100, now + 0.9);
        const src = ctx.createBufferSource();
        src.buffer = white;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        src.connect(band);
        band.connect(gain);
        gain.connect(bus);
        src.start(now, Math.random() * 2);
        src.stop(now + 1.2);
    },

    /** Air release, a motor-driven slide and a dull thunk at each end of travel. No beeps. */
    doors(open: boolean) {
        if (!enabled || !ctx || !bus) return;
        const now = ctx.currentTime;
        burst(ctx, bus, now, { freq: 4200, q: 0.5, level: 0.05, length: 0.7 });
        burst(ctx, bus, now + 0.12, { freq: 380, q: 0.7, level: 0.1, length: 1.05 });
        burst(ctx, bus, now + (open ? 1.1 : 1.05), { freq: 200, q: 0.9, level: 0.3, length: 0.18, low: 85, body: 0.2 });
        if (!open) {
            burst(ctx, bus, now + 0.02, { freq: 1900, q: 3, level: 0.025, length: 0.2 });
        }
    },

    /** A diesel-style train horn: two blasts, a short then a long one, from a low three-note chord. */
    horn() {
        if (!enabled || !ctx || !bus) return;
        const c = ctx;
        const out = bus;
        const now = c.currentTime;
        const blast = (at: number, length: number) => {
            const filter = c.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 850;
            filter.Q.value = 0.7;
            const gain = c.createGain();
            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(0.1, at + 0.12);
            gain.gain.setValueAtTime(0.1, at + length);
            gain.gain.exponentialRampToValueAtTime(0.0001, at + length + 0.45);
            filter.connect(gain);
            gain.connect(out);
            [185, 233, 277].forEach((freq, i) => {
                const osc = c.createOscillator();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq * 1.03, at);
                osc.frequency.exponentialRampToValueAtTime(freq, at + 0.18);
                osc.detune.value = (i - 1) * 4;
                osc.connect(filter);
                osc.start(at);
                osc.stop(at + length + 0.5);
            });
        };
        blast(now, 0.45);
        blast(now + 0.75, 1.2);
    },

    /** Two soft low notes for arrivals, like a platform announcement. */
    chime() {
        if (!enabled || !ctx || !bus) return;
        const now = ctx.currentTime;
        [
            [392, 0],
            [311.13, 0.5],
        ].forEach(([freq, delay]) => {
            const osc = ctx!.createOscillator();
            const filter = ctx!.createBiquadFilter();
            const gain = ctx!.createGain();
            osc.type = "triangle";
            osc.frequency.value = freq;
            filter.type = "lowpass";
            filter.frequency.value = 900;
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.05, now + delay + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.6);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(bus!);
            osc.start(now + delay);
            osc.stop(now + delay + 1.7);
        });
    },

    /** A soft switch click used as interface feedback. */
    tone(_pitch?: number) {
        if (!guard(240, lastTone) || !ctx || !bus) return;
        lastTone = performance.now();
        burst(ctx, bus, ctx.currentTime, { freq: 700, q: 1.2, level: 0.1, length: 0.08, low: 140, body: 0.05 });
    },
};
