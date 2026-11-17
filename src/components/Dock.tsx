import { Fragment, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MotionValue, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { HiMiniCalendarDays, HiMiniEnvelope, HiMiniHome, HiMiniSquares2X2 } from "react-icons/hi2";
import type { IconType } from "react-icons";

interface DockItem {
    label: string;
    href: string;
    Icon: IconType;
    external?: boolean;
    accent?: boolean;
}

const GROUPS: DockItem[][] = [
    [
        { label: "Home", href: "/", Icon: HiMiniHome },
        { label: "Projects", href: "/projects", Icon: HiMiniSquares2X2 },
    ],
    [
        { label: "GitHub", href: "https://github.com/Ahmed-Hamdy101", Icon: FaGithub, external: true },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/ahmed-hamdy-ah/", Icon: FaLinkedinIn, external: true },
        { label: "WhatsApp", href: "https://wa.me/201141640812", Icon: FaWhatsapp, external: true },
        { label: "Email", href: "mailto:ahmedhamdy.mh95@gmail.com", Icon: HiMiniEnvelope, external: true },
    ],
    [{ label: "Book a call", href: "/schedule", Icon: HiMiniCalendarDays, accent: true }],
];

const BASE = 46;
const PEAK = 62;
const RANGE = 130;

function DockIcon({ item, mouseX, current }: { item: DockItem; mouseX: MotionValue<number>; current: boolean }) {
    const ref = useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (x) => {
        const box = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return x - box.x - box.width / 2;
    });
    const size = useSpring(useTransform(distance, [-RANGE, 0, RANGE], [BASE, PEAK, BASE]), {
        mass: 0.2,
        stiffness: 200,
        damping: 24,
    });
    const iconSize = useTransform(size, (s) => s * 0.44);

    const shared = {
        "aria-label": item.label,
        "aria-current": current ? ("page" as const) : undefined,
        className: `peer grid size-full place-items-center rounded-2xl border transition-colors ${
            item.accent
                ? "border-transparent bg-accent text-deep hover:brightness-110"
                : current
                  ? "border-white/30 bg-white/20 text-white"
                  : "border-white/10 bg-white/[0.07] text-white/85 hover:border-white/30 hover:bg-white/15 hover:text-white"
        }`,
    };

    const inner = (
        <motion.span style={{ fontSize: iconSize }} className="grid place-items-center">
            <item.Icon aria-hidden="true" />
        </motion.span>
    );

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
            {current && <span className="absolute -bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />}
            <span className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl border border-white/15 bg-black/80 px-3 py-1.5 text-[0.8125rem] font-medium text-white opacity-0 shadow-xl transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100">
                {item.label}
            </span>
        </motion.div>
    );
}

export default function Dock() {
    const mouseX = useMotionValue(Infinity);
    const router = useRouter();
    const pathname = router?.pathname || "";

    const isCurrent = (item: DockItem) =>
        !item.external && (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/"));

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center md:grid">
            <motion.nav
                aria-label="Quick links"
                initial={{ y: 90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                onMouseMove={(e) => mouseX.set(e.clientX)}
                onMouseLeave={() => mouseX.set(Infinity)}
                className="pointer-events-auto flex items-end gap-1.5 rounded-[1.75rem] border border-white/15 bg-black/70 p-2 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.7)]"
            >
                {GROUPS.map((group, gi) => (
                    <Fragment key={gi}>
                        {gi > 0 && <span aria-hidden="true" className="mx-1 h-9 w-px self-center bg-white/15" />}
                        {group.map((item) => (
                            <DockIcon key={item.label} item={item} mouseX={mouseX} current={isCurrent(item)} />
                        ))}
                    </Fragment>
                ))}
            </motion.nav>
        </div>
    );
}
