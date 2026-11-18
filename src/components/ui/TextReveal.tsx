import { useRef } from "react";
import { MotionValue, motion, useScroll, useTransform } from "framer-motion";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
    const opacity = useTransform(progress, range, [0.16, 1]);
    return <motion.span style={{ opacity }}>{children}</motion.span>;
}

/** Magic UI style text reveal: words light up one by one while the section is pinned. */
export default function TextReveal({ text }: { text: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const words = text.split(" ");

    return (
        <div ref={ref} className="relative h-[220vh]">
            <div className="sticky top-0 grid h-screen content-center">
                <p className="wrap statement">
                    {words.map((word, i) => {
                        const start = (i / words.length) * 0.8;
                        const end = start + 0.8 / words.length;
                        return (
                            <span key={`${word}-${i}`}>
                                <Word progress={scrollYProgress} range={[start, end]}>{word}</Word>{" "}
                            </span>
                        );
                    })}
                </p>
            </div>
        </div>
    );
}
