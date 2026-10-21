import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import ParallaxCard from "./ParallaxCard";
import type { ParallaxItem } from "./HeroParallax";

interface WorkItem extends ParallaxItem {
    note: string;
}

const ASPECTS = ["aspect-[4/5]", "aspect-[5/4]", "aspect-square"];

/** Three columns that move at different speeds, each holding parallax tilt cards. */
export default function ParallaxScroll({ items }: { items: WorkItem[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -140]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, 140]);
    const y3 = useTransform(scrollYProgress, [0, 1], [0, -140]);

    const third = Math.ceil(items.length / 3);
    const columns = [
        { items: items.slice(0, third), y: y1 },
        { items: items.slice(third, third * 2), y: y2 },
        { items: items.slice(third * 2), y: y3 },
    ];

    return (
        <div ref={ref} className="grid items-start gap-6 md:grid-cols-3">
            {columns.map((col, c) => (
                <motion.div key={c} style={{ y: col.y }} className="grid gap-6">
                    {col.items.map((item, i) => (
                        <ParallaxCard
                            key={`${item.title}-${i}`}
                            href={item.href}
                            title={item.title}
                            note={item.note}
                            image={item.image}
                            aspect={ASPECTS[(c + i) % ASPECTS.length]}
                        />
                    ))}
                </motion.div>
            ))}
        </div>
    );
}
