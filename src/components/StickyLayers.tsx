import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";

export interface Layer {
    name: string;
    tools: string[];
    body: string;
}

/** Aceternity style sticky scroll reveal: the layer list stays pinned while the detail swaps with scroll. */
export default function StickyLayers({ layers }: { layers: Layer[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

    useMotionValueEvent(scrollYProgress, "change", (v) => {
        setActive(Math.min(layers.length - 1, Math.max(0, Math.floor(v * layers.length))));
    });

    const current = layers[active];

    return (
        <div ref={ref} className="relative" style={{ height: `${layers.length * 75}vh` }}>
            <div className="sticky top-0 grid h-screen content-center">
                <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
                    <ol className="grid gap-2 lg:col-span-5">
                        {layers.map((layer, i) => (
                            <li key={layer.name}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const el = ref.current;
                                        if (!el) return;
                                        const total = el.offsetHeight - window.innerHeight;
                                        const top = el.getBoundingClientRect().top + window.scrollY + (total * (i + 0.5)) / layers.length;
                                        window.scrollTo({ top, behavior: "smooth" });
                                    }}
                                    className={`grid w-full text-left text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.04em] transition-colors duration-300 ${
                                        i === active ? "text-accent" : "text-line hover:text-mute"
                                    }`}
                                    aria-current={i === active ? "true" : undefined}
                                >
                                    {layer.name}
                                </button>
                            </li>
                        ))}
                    </ol>

                    <div className="relative min-h-[18rem] rounded-2xl border border-line bg-sheet p-8 lg:col-span-7 lg:p-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.name}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                className="grid gap-8"
                            >
                                <p className="text-xl leading-snug text-mute">{current.body}</p>
                                <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                                    {current.tools.map((tool) => (
                                        <li key={tool} className="border-t rule py-3 text-2xl font-semibold tracking-tight">
                                            {tool}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
