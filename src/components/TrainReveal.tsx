import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { sound } from "@/lib/sound";

const Canvas3D = dynamic(() => import("./TrainRevealCanvas"), { ssr: false, loading: () => null });

const STAGES = ["Outline", "Material", "Light", "Finish"] as const;

const SERVICES = [
    { name: "Full-stack platforms", body: "Interfaces, APIs and data shipped as one coherent product." },
    { name: "APIs & infrastructure", body: "Typed services, queues and pipelines that stay quiet in production." },
    { name: "Interactive experiences", body: "Real-time 3D and motion, used where it earns its place." },
];

export default function TrainReveal() {
    const ref = useRef<HTMLElement>(null);
    const prefersReduced = useReducedMotion();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const reduced = hydrated && Boolean(prefersReduced);
    const still = useMotionValue(1);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const scrolled = useTransform(scrollYProgress, [0.04, 0.88], [0, 1], { clamp: true });
    const progress = reduced ? still : scrolled;

    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const [stage, setStage] = useState(0);

    useEffect(() => {
        if (reduced) setStage(3);
    }, [reduced]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: "900px 0px" });
        const live = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px 0px" });
        near.observe(el);
        live.observe(el);
        return () => {
            near.disconnect();
            live.disconnect();
        };
    }, []);

    useMotionValueEvent(progress, "change", (v) => {
        const next = Math.min(3, Math.floor(v * 4));
        setStage((prev) => {
            if (prev !== next) sound.tone(520 + next * 110);
            return next;
        });
    });

    return (
        <section
            id="reveal"
            ref={ref}
            data-section
            data-free
            aria-label="Train visualization reveal"
            className="relative border-t border-line bg-deep"
            style={{ height: reduced ? "auto" : "360vh" }}
        >
            <div
                className={`grid grid-rows-[46%_1fr] lg:grid-cols-[1.35fr_1fr] lg:grid-rows-1 ${
                    reduced ? "min-h-[80svh]" : "sticky h-[calc(100svh-var(--header-h))] overflow-hidden"
                }`}
                style={reduced ? undefined : { top: "var(--header-h)" }}
            >
                <div className="relative min-h-[40svh] border-b border-line lg:border-b-0 lg:border-r">
                    <div className="absolute inset-0" aria-hidden="true">
                        {mounted && <Canvas3D progress={progress} active={active} />}
                    </div>

                    <div aria-hidden="true" className="pointer-events-none absolute inset-4 border border-white/10">
                        <span className="absolute -left-px -top-px size-3 border-l border-t border-[#53e0ff]" />
                        <span className="absolute -right-px -top-px size-3 border-r border-t border-[#53e0ff]" />
                        <span className="absolute -bottom-px -left-px size-3 border-b border-l border-[#53e0ff]" />
                        <span className="absolute -bottom-px -right-px size-3 border-b border-r border-[#53e0ff]" />
                        <p className="meta absolute left-4 top-3 text-[0.6875rem] uppercase tracking-[0.25em] text-[#53e0ff]/80">Fig. 01 · Transit concept</p>
                    </div>

                    <ol className="absolute inset-x-6 bottom-6 grid grid-cols-4 gap-2" aria-label="Reveal stages">
                        {STAGES.map((name, i) => (
                            <li key={name} aria-current={i === stage ? "step" : undefined} className="grid gap-1.5">
                                <span className={`h-px transition-colors duration-500 ${i <= stage ? "bg-[#53e0ff]" : "bg-white/20"}`} />
                                <span
                                    className={`meta text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-500 ${
                                        i === stage ? "text-[#53e0ff]" : "text-mute"
                                    }`}
                                >
                                    0{i + 1} {name}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="wrap-narrow grid content-center gap-5 px-6 py-6 lg:gap-7 lg:px-12">
                    <p className="meta uppercase tracking-[0.3em] text-accent">The studio</p>
                    <h2 className="display text-[clamp(2rem,4.4vw,4rem)]">One machine, drawn into existence.</h2>
                    <p className="max-w-md text-mute">
                        A product starts as an outline, picks up material, then light, then finish. I build it end to end, so nothing is lost
                        between the drawing and the shipped result.
                    </p>
                    <ul className="grid gap-3 border-t border-line pt-4">
                        {SERVICES.map((s, i) => (
                            <li key={s.name} className="grid grid-cols-[auto_1fr] gap-x-4">
                                <span className="meta pt-0.5 text-[0.75rem] text-accent">0{i + 1}</span>
                                <div>
                                    <h3 className="font-semibold">{s.name}</h3>
                                    <p className="hidden text-[0.9375rem] text-mute md:block">{s.body}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <p className="sr-only" aria-live="polite">
                Stage {stage + 1} of 4: {STAGES[stage]}
            </p>
        </section>
    );
}
