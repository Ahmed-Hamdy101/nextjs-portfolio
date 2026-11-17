import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HiMiniChevronLeft, HiMiniChevronRight, HiMiniPause, HiMiniPlay } from "react-icons/hi2";

export interface HeroCard {
    title: string;
    href: string;
    image: string;
    label: string;
}

const INTERVAL = 5200;
const STEP = 52;
const EASE = [0.16, 1, 0.3, 1] as const;

const ctrl =
    "grid size-9 place-items-center rounded-full border border-white/25 bg-black/60 text-white transition-colors hover:border-[#8fe8ff] hover:text-[#8fe8ff]";

export default function HeroCarousel({ items }: { items: HeroCard[] }) {
    const count = items.length;
    const [active, setActive] = useState(0);
    const [hold, setHold] = useState(false);
    const [playing, setPlaying] = useState(true);
    const prefersReduced = useReducedMotion();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const reduced = hydrated && Boolean(prefersReduced);

    const go = useCallback((n: number) => setActive(((n % count) + count) % count), [count]);

    useEffect(() => {
        if (!playing || hold || count < 2) return;
        const id = window.setInterval(() => setActive((v) => (v + 1) % count), INTERVAL);
        return () => window.clearInterval(id);
    }, [playing, hold, count, active]);

    if (!count) return null;

    const stack = Array.from({ length: Math.min(3, count) }, (_, o) => ({ card: items[(active + o) % count], o }));

    return (
        <div
            className="grid justify-items-end gap-3"
            role="group"
            aria-roledescription="carousel"
            aria-label="Featured projects"
            onMouseEnter={() => setHold(true)}
            onMouseLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={() => setHold(false)}
        >
            <div className="relative h-[13.5rem] w-[21rem]" aria-live={playing ? "off" : "polite"}>
                {[...stack].reverse().map(({ card, o }) => {
                    const front = o === 0;
                    const body = (
                        <>
                            <span className="relative block h-28 w-full overflow-hidden">
                                <Image src={card.image} alt="" fill sizes="208px" className="object-cover" />
                            </span>
                            <span className="grid gap-1.5 p-3 text-left">
                                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[#8fe8ff]">{card.label}</span>
                                <span className="line-clamp-2 text-[0.75rem] font-bold uppercase leading-tight tracking-wide text-white">{card.title}</span>
                                {front && playing && !reduced && (
                                    <span className="mt-0.5 h-0.5 w-full overflow-hidden rounded bg-white/25" aria-hidden="true">
                                        <span
                                            key={active}
                                            className="hero-bar block h-full bg-[#8fe8ff]"
                                            style={{ animationPlayState: hold ? "paused" : "running" }}
                                        />
                                    </span>
                                )}
                            </span>
                        </>
                    );

                    return (
                        <motion.div
                            key={card.href}
                            initial={{ x: STEP * 3, scale: 0.7, opacity: 0 }}
                            animate={{ x: o * STEP, scale: 1 - o * 0.09, opacity: 1 - o * 0.3 }}
                            transition={{ duration: 0.6, ease: EASE }}
                            style={{ zIndex: 10 - o, transformOrigin: "left bottom" }}
                            className="absolute bottom-0 left-0 w-52 overflow-hidden rounded-2xl border border-white/25 bg-[#0c1016] shadow-2xl"
                        >
                            {front ? (
                                <Link href={card.href} className="block" aria-label={`${card.title}, ${card.label}`}>
                                    {body}
                                </Link>
                            ) : (
                                <button type="button" className="block w-full" aria-label={`Show ${card.title}`} onClick={() => go(active + o)}>
                                    {body}
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex items-center gap-2">
                <button type="button" className={ctrl} aria-label="Previous project" onClick={() => go(active - 1)}>
                    <HiMiniChevronLeft aria-hidden="true" />
                </button>
                <div className="flex gap-1.5" role="tablist" aria-label="Choose project">
                    {items.slice(0, 6).map((c, i) => (
                        <button
                            key={c.href}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            aria-label={`Project ${i + 1}: ${c.title}`}
                            onClick={() => go(i)}
                            className="grid size-4 place-items-center"
                        >
                            <span className={`block rounded-full transition-all ${i === active ? "h-1.5 w-5 bg-white" : "size-1.5 bg-white/40"}`} />
                        </button>
                    ))}
                </div>
                <button type="button" className={ctrl} aria-label="Next project" onClick={() => go(active + 1)}>
                    <HiMiniChevronRight aria-hidden="true" />
                </button>
                <button type="button" className={ctrl} aria-label={playing ? "Pause carousel" : "Play carousel"} onClick={() => setPlaying((v) => !v)}>
                    {playing ? <HiMiniPause aria-hidden="true" /> : <HiMiniPlay aria-hidden="true" />}
                </button>
            </div>
        </div>
    );
}
