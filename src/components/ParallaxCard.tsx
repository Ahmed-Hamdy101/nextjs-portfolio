import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

interface ParallaxCardProps {
    href: string;
    title: string;
    note: string;
    image: string;
    aspect?: string;
}

/**
 * Three layers of motion: the screenshot drifts inside its frame as the card scrolls past,
 * the whole card tilts toward the pointer, and the caption floats in front of the image.
 */
export default function ParallaxCard({ href, title, note, image, aspect = "aspect-[4/3]" }: ParallaxCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const imageY = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const rotateX = useSpring(tiltX, { stiffness: 160, damping: 20 });
    const rotateY = useSpring(tiltY, { stiffness: 160, damping: 20 });

    const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        tiltY.set(((e.clientX - box.left) / box.width - 0.5) * 10);
        tiltX.set(-((e.clientY - box.top) / box.height - 0.5) * 10);
    };
    const onLeave = () => {
        tiltX.set(0);
        tiltY.set(0);
    };

    return (
        <div style={{ perspective: 900 }}>
            <motion.div
                ref={ref}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className="group relative rounded-xl border border-line bg-sheet transition-colors hover:border-accent"
            >
                <Link href={href} aria-label={`${title} case study`} className="block">
                    <div className={`relative overflow-hidden rounded-[0.7rem] ${aspect}`}>
                        <motion.div style={{ y: imageY, scale: 1.2 }} className="absolute inset-0">
                            <Image
                                src={image}
                                alt={`${title} interface`}
                                fill
                                className="object-cover object-top"
                                sizes="(max-width: 768px) 100vw, 33vw"
                                unoptimized
                            />
                        </motion.div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 grid gap-0.5 p-5" style={{ transform: "translateZ(40px)" }}>
                        <span className="text-xl font-semibold tracking-tight text-white">{title}</span>
                        <span className="text-sm text-white/75">{note}</span>
                    </div>
                </Link>
            </motion.div>
        </div>
    );
}
