import { useEffect, useRef, useState } from "react";
import Router from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { sound } from "@/lib/sound";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const DEPART_MS = 480;
const MIN_CLOSED_MS = 180;
const OPEN_MS = 620;

const NAMES: Record<string, string> = {
    "/": "Home",
    "/projects": "Projects",
    "/work": "Work history",
    "/skills": "Skills",
    "/services": "Services",
    "/about": "About",
    "/testimonials": "Outcomes",
    "/contact": "Contact",
    "/schedule": "Schedule a call",
};

const pathOf = (url: string) => url.split(/[?#]/)[0].replace(/\/$/, "") || "/";
const nameFor = (url: string) => {
    const path = pathOf(url);
    if (NAMES[path]) return NAMES[path];
    if (path.startsWith("/projects/")) return "Project details";
    return "the next station";
};

type Phase = "idle" | "depart" | "doors" | "arrive";

const STREAKS = [
    { top: "8%", h: "6%", w: "70%", d: 0.0 },
    { top: "24%", h: "3%", w: "45%", d: 0.12 },
    { top: "40%", h: "8%", w: "85%", d: 0.28 },
    { top: "58%", h: "4%", w: "55%", d: 0.06 },
    { top: "74%", h: "7%", w: "75%", d: 0.2 },
    { top: "88%", h: "3%", w: "40%", d: 0.34 },
];

function Door({ side, open, still }: { side: "left" | "right"; open: boolean; still: boolean }) {
    const dir = side === "left" ? -1 : 1;
    const hidden = `${dir * 101}%`;

    return (
        <motion.div
            initial={{ x: hidden }}
            animate={{ x: open ? hidden : "0%" }}
            transition={{ duration: open ? 0.55 : 0.42, ease: EASE, delay: open ? 0.08 : 0 }}
            className={`absolute inset-y-0 w-1/2 bg-gradient-to-b from-[#252c36] via-[#181d25] to-[#0c0f14] ${side === "left" ? "left-0" : "right-0"}`}
        >
            <div className="absolute inset-x-[16%] top-[13%] h-[54%] overflow-hidden rounded-[2.5rem] border-[3px] border-[#3b4553] bg-gradient-to-b from-[#7fb1d6] via-[#cfe0e6] to-[#f2c58a] shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]">
                {!open && !still &&
                    STREAKS.map((s, i) => (
                        <motion.span
                            key={i}
                            className="absolute rounded-full bg-black/35"
                            style={{ top: s.top, height: s.h, width: s.w, left: 0 }}
                            animate={{ x: ["-120%", "260%"] }}
                            transition={{ duration: 0.55, repeat: Infinity, ease: "linear", delay: s.d }}
                        />
                    ))}
                <span className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
            </div>

            <span
                className={`absolute inset-y-0 w-3 bg-black ${side === "left" ? "right-0" : "left-0"}`}
                style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
            />
            <span
                className={`absolute bottom-0 h-[22%] w-3 ${side === "left" ? "right-0" : "left-0"}`}
                style={{ background: "repeating-linear-gradient(135deg,#f2c230 0 10px,#15181d 10px 20px)" }}
            />
            <span className={`absolute top-[72%] h-[14%] w-1.5 rounded-full bg-[#aeb7c2] ${side === "left" ? "right-8" : "left-8"}`} />
        </motion.div>
    );
}

export default function TrainTransition() {
    const prefersReduced = usePrefersReducedMotion();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const reduced = hydrated && Boolean(prefersReduced);

    const [phase, setPhase] = useState<Phase>("idle");
    const [label, setLabel] = useState("");
    const [toast, setToast] = useState("");

    const phaseRef = useRef<Phase>("idle");
    const labelRef = useRef("");
    const loaded = useRef(false);
    const closedAt = useRef(0);
    const timers = useRef<number[]>([]);

    useEffect(() => {
        const clearTimers = () => {
            timers.current.forEach((t) => window.clearTimeout(t));
            timers.current = [];
        };
        const later = (fn: () => void, ms: number) => {
            timers.current.push(window.setTimeout(fn, ms));
        };
        const go = (p: Phase) => {
            phaseRef.current = p;
            setPhase(p);
        };
        const showToast = (name: string) => {
            setToast(name);
            later(() => setToast(""), 3000);
        };

        const arrive = () => {
            go("arrive");
            window.dispatchEvent(new Event("train-arrive"));
            document.documentElement.classList.remove("transit");
            sound.chime();
            sound.doors(true);
            later(() => {
                go("idle");
                showToast(labelRef.current);
            }, OPEN_MS);
        };

        const maybeArrive = () => {
            if (phaseRef.current !== "doors" || !loaded.current) return;
            const wait = MIN_CLOSED_MS - (performance.now() - closedAt.current);
            if (wait > 0) later(maybeArrive, wait);
            else arrive();
        };

        const reset = () => {
            clearTimers();
            document.documentElement.classList.remove("transit");
            window.dispatchEvent(new Event("train-arrive"));
            go("idle");
        };

        const onStart = (url: string) => {
            if (pathOf(url) === pathOf(Router.asPath)) return;
            clearTimers();
            loaded.current = false;
            setToast("");
            const name = nameFor(url);
            labelRef.current = name;
            setLabel(name);
            document.documentElement.classList.add("transit");
            window.dispatchEvent(new Event("train-depart"));
            sound.whoosh();
            go("depart");
            later(() => {
                go("doors");
                sound.doors(false);
                closedAt.current = performance.now();
                maybeArrive();
            }, DEPART_MS);
        };

        const onComplete = () => {
            if (phaseRef.current === "idle") return;
            loaded.current = true;
            maybeArrive();
        };

        Router.events.on("routeChangeStart", onStart);
        Router.events.on("routeChangeComplete", onComplete);
        Router.events.on("routeChangeError", reset);
        return () => {
            Router.events.off("routeChangeStart", onStart);
            Router.events.off("routeChangeComplete", onComplete);
            Router.events.off("routeChangeError", reset);
            clearTimers();
            document.documentElement.classList.remove("transit");
        };
    }, []);

    const closed = phase === "doors" || phase === "arrive";

    return (
        <>
            <AnimatePresence>
                {phase === "depart" && (
                    <motion.div
                        key="depart"
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -14 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="pointer-events-none fixed inset-x-0 top-24 z-[61] flex justify-center"
                    >
                        <span className="flex items-center gap-3 rounded-full border border-white/20 bg-black/55 px-5 py-2.5 text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                            <span className="size-2 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
                            Departing · {label}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {closed && (
                <div aria-hidden="true" className={`fixed inset-0 z-[62] ${phase === "doors" ? "pointer-events-auto" : "pointer-events-none"}`}>
                    <Door side="left" open={phase === "arrive"} still={reduced} />
                    <Door side="right" open={phase === "arrive"} still={reduced} />

                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={phase}
                                initial={{ opacity: 0, y: 14 }}
                                animate={phase === "arrive" ? { opacity: [1, 1, 0], y: 0 } : { opacity: 1, y: 0 }}
                                transition={phase === "arrive" ? { duration: 0.72, times: [0, 0.55, 1] } : { duration: 0.34, ease: EASE, delay: 0.1 }}
                                className="grid justify-items-center gap-3 rounded-2xl bg-black/55 px-10 py-7 text-center text-white shadow-2xl backdrop-blur-md"
                            >
                                <span className="text-[0.75rem] font-semibold uppercase tracking-[0.35em] text-accent">
                                    {phase === "doors" ? "Next stop" : "You've arrived"}
                                </span>
                                <span className="text-[clamp(2rem,6vw,4rem)] font-extrabold uppercase leading-none tracking-[-0.02em]">{label}</span>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            )}

            <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[55] flex justify-center px-4">
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            key={toast}
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, ease: EASE }}
                            className="flex items-center gap-3 rounded-full border border-white/20 bg-black/65 px-5 py-2.5 text-[0.9375rem] font-medium text-white backdrop-blur-xl"
                        >
                            <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.7rem] font-bold text-deep">✓</span>
                            You&apos;ve arrived at {toast}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
