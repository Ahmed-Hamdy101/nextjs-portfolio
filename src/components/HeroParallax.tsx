import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionValue, motion, useScroll, useSpring, useTransform } from "framer-motion";

export interface ParallaxItem {
    title: string;
    href: string;
    image: string;
}

const SPRING = { stiffness: 300, damping: 30, bounce: 100 };

function Tile({ item, translate }: { item: ParallaxItem; translate: MotionValue<number> }) {
    return (
        <motion.div
            style={{ x: translate }}
            whileHover={{ y: -20 }}
            transition={{ duration: 0.25 }}
            className="group relative h-72 w-[26rem] shrink-0 sm:h-80 sm:w-[30rem]"
        >
            <Link href={item.href} className="block size-full overflow-hidden rounded-xl border border-line bg-sheet" aria-label={item.title}>
                <Image src={item.image} alt={`${item.title} interface`} fill className="object-cover object-top" sizes="30rem" unoptimized />
                <span className="absolute inset-0 bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="absolute bottom-4 left-5 text-xl font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.title}
                </span>
            </Link>
        </motion.div>
    );
}

/** Aceternity style hero parallax: three rows of project screens drift sideways and flatten as you scroll. */
export default function HeroParallax({ items, header }: { items: ParallaxItem[]; header: ReactNode }) {
    const rows = [items.slice(0, 5), items.slice(5, 10), items.slice(10, 15)];
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

    const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), SPRING);
    const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), SPRING);
    const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), SPRING);
    const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), SPRING);
    const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), SPRING);
    const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 120]), SPRING);

    return (
        <div
            ref={ref}
            className="relative grid h-[260vh] grid-cols-[minmax(0,1fr)] content-start overflow-hidden pb-40 pt-8 antialiased [perspective:1000px] [transform-style:preserve-3d]"
        >
            {header}
            <motion.div style={{ rotateX, rotateZ, translateY, opacity }} className="grid min-w-0 gap-16">
                <div className="grid grid-flow-col auto-cols-max gap-14 pl-10">
                    {rows[0].map((item, i) => (
                        <Tile key={`a-${i}`} item={item} translate={translateX} />
                    ))}
                </div>
                <div className="grid grid-flow-col auto-cols-max justify-end gap-14 pr-10">
                    {rows[1].map((item, i) => (
                        <Tile key={`b-${i}`} item={item} translate={translateXReverse} />
                    ))}
                </div>
                <div className="grid grid-flow-col auto-cols-max gap-14 pl-10">
                    {rows[2].map((item, i) => (
                        <Tile key={`c-${i}`} item={item} translate={translateX} />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
