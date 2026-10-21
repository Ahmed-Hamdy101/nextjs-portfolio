import { useRef } from "react";
import Link from "next/link";
import { MotionValue, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { HiMiniCalendarDays, HiMiniEnvelope, HiMiniHome, HiMiniSquares2X2 } from "react-icons/hi2";
import type { IconType } from "react-icons";

interface DockItem {
    label: string;
    href: string;
    Icon: IconType;
    external?: boolean;
}

const ITEMS: DockItem[] = [
    { label: "Home", href: "/", Icon: HiMiniHome },
    { label: "Projects", href: "/projects", Icon: HiMiniSquares2X2 },
    { label: "GitHub", href: "https://github.com/Ahmed-Hamdy101", Icon: FaGithub, external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ahmed-hamdy-ah/", Icon: FaLinkedinIn, external: true },
    { label: "WhatsApp", href: "https://wa.me/201141640812", Icon: FaWhatsapp, external: true },
    { label: "Email", href: "mailto:ahmedhamdy.mh95@gmail.com", Icon: HiMiniEnvelope, external: true },
    { label: "Book a call", href: "/schedule", Icon: HiMiniCalendarDays },
];

const BASE = 44;
const PEAK = 56;
const RANGE = 120;

function DockIcon({ item, mouseX }: { item: DockItem; mouseX: MotionValue<number> }) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (x) => {
        const box = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return x - box.x - box.width / 2;
    });
    const size = useSpring(useTransform(distance, [-RANGE, 0, RANGE], [BASE, PEAK, BASE]), {
        mass: 0.2,
        stiffness: 180,
        damping: 26,
    });
    const iconSize = useTransform(size, (s) => s * 0.46);

    const inner = (
        <motion.span style={{ fontSize: iconSize }} className="grid place-items-center">
            <item.Icon aria-hidden="true" />
        </motion.span>
    );

    const shared = {
        "aria-label": item.label,
        className:
            "peer grid size-full place-items-center rounded-full border border-line bg-paper text-ink transition-colors hover:border-accent hover:text-accent",
    };

    return (
        <motion.div ref={ref} style={{ width: size, height: size }} className="group relative">
            {item.external ? (
                <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" {...shared}>
                    {inner}
                </a>
            ) : (
                <Link href={item.href} {...shared}>
                    {inner}
                </Link>
            )}
            <span className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-line bg-sheet px-2.5 py-1 text-sm opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100">
                {item.label}
            </span>
        </motion.div>
    );
}

export default function Dock() {
    const mouseX = useMotionValue(Infinity);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center md:grid">
        <motion.nav
            aria-label="Quick links"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className="pointer-events-auto grid h-[4.5rem] grid-flow-col items-center gap-2 rounded-2xl border border-line bg-sheet px-3"
        >
            {ITEMS.map((item) => (
                <DockIcon key={item.label} item={item} mouseX={mouseX} />
            ))}
        </motion.nav>
        </div>
    );
}
