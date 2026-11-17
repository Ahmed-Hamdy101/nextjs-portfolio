import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

export interface TrainProject {
    title: string;
    href: string;
    image: string;
    note: string;
}

function Wheels() {
    return (
        <div aria-hidden="true" className="absolute inset-x-10 -bottom-3 flex justify-between">
            {[0, 1].map((i) => (
                <span key={i} className="size-6 rounded-full border-[3px] border-[#3b4553] bg-[#0c0f14] shadow-[inset_0_0_0_3px_#1b212a]" />
            ))}
        </div>
    );
}

function Car({ project, index }: { project: TrainProject; index: number }) {
    return (
        <li className="relative flex shrink-0 items-center">
            {index > 0 && <span aria-hidden="true" className="h-2 w-8 bg-[#2a313b] md:w-12" />}
            <Link
                href={project.href}
                className="group relative block w-[min(78vw,26rem)] snap-center overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0e1218] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.8)] transition-colors hover:border-[#8fe8ff]/60"
            >
                <span className="flex items-center justify-between border-b border-white/10 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.25em] text-white/60">
                    <span>Car {String(index + 1).padStart(2, "0")}</span>
                    <span aria-hidden="true" className="flex gap-1">
                        {[0, 1, 2].map((d) => (
                            <span key={d} className="size-1.5 rounded-full bg-[#8fe8ff]/70" />
                        ))}
                    </span>
                </span>
                <span className="relative block aspect-[4/3] w-full overflow-hidden">
                    <Image
                        src={project.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 78vw, 416px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </span>
                <span className="grid gap-1 px-5 pb-5 pt-4">
                    <span className="text-lg font-bold leading-tight tracking-tight text-white">{project.title}</span>
                    <span className="text-[0.8125rem] text-white/60">{project.note}</span>
                </span>
                <Wheels />
            </Link>
        </li>
    );
}

export default function ProjectTrain({ projects }: { projects: TrainProject[] }) {
    const ref = useRef<HTMLElement>(null);
    const track = useRef<HTMLUListElement>(null);
    const prefersReduced = useReducedMotion();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const still = hydrated && Boolean(prefersReduced);

    const [shift, setShift] = useState(0);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -shift], { clamp: true });
    const railX = useTransform(scrollYProgress, [0, 1], [0, -120]);

    useEffect(() => {
        const measure = () => {
            const el = track.current;
            if (el) setShift(Math.max(0, el.scrollWidth - window.innerWidth + 96));
        };
        measure();
        window.addEventListener("resize", measure);
        const observer = typeof ResizeObserver !== "undefined" && track.current ? new ResizeObserver(measure) : null;
        if (observer && track.current) observer.observe(track.current);
        return () => {
            window.removeEventListener("resize", measure);
            observer?.disconnect();
        };
    }, [projects.length]);

    const header = (
        <header className="wrap grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-3">
                <p className="meta uppercase tracking-[0.3em] text-accent">Now boarding</p>
                <h2 className="h2">Selected work</h2>
            </div>
            <Link href="/projects" className="link">All projects</Link>
        </header>
    );

    if (still) {
        return (
            <section id="work" data-section data-free className="border-t border-line py-24">
                <div className="grid gap-12">
                    {header}
                    <ul className="flex snap-x snap-mandatory gap-0 overflow-x-auto px-6 pb-8 pt-4" aria-label="Projects">
                        {projects.map((p, i) => (
                            <Car key={p.href} project={p} index={i} />
                        ))}
                    </ul>
                </div>
            </section>
        );
    }

    return (
        <section
            id="work"
            ref={ref}
            data-section
            data-free
            className="relative border-t border-line"
            style={{ height: `${Math.max(240, projects.length * 55 + 100)}vh` }}
        >
            <div className="sticky grid content-center gap-12 overflow-hidden py-10" style={{ top: "var(--header-h)", height: "calc(100svh - var(--header-h))" }}>
                {header}

                <div className="relative">
                    <motion.ul ref={track} style={{ x }} className="flex w-max items-center px-6 md:px-12" aria-label="Projects">
                        {projects.map((p, i) => (
                            <Car key={p.href} project={p} index={i} />
                        ))}
                    </motion.ul>

                    <div aria-hidden="true" className="relative mt-6 h-3 overflow-hidden">
                        <span className="absolute inset-x-0 top-0 h-px bg-white/30" />
                        <motion.span
                            style={{ x: railX, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 2px, transparent 2px 22px)" }}
                            className="absolute -inset-x-40 bottom-0 h-2"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
