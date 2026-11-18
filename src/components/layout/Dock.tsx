import { Fragment, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { MotionValue, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { HiMiniCalendarDays, HiMiniEnvelope, HiMiniHome, HiMiniSquares2X2 } from "react-icons/hi2";
import type { IconType } from "react-icons";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

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

/** Resting tile size, peak magnification, and how far the pointer's influence reaches. */
const BASE = 44;
const PEAK = 70;
const RANGE = 118;

/** Smooth bell rather than a triangular ramp, so neighbours swell and settle like macOS. */
const magnification = (distance: number) => {
    const t = Math.min(1, Math.abs(distance) / RANGE);
    const bell = Math.cos((t * Math.PI) / 2) ** 1.7;
    return BASE + (PEAK - BASE) * bell;
};

function DockIcon({ item, mouseX, current }: { item: DockItem; mouseX: MotionValue<number>; current: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = usePrefersReducedMotion();

    const distance = useTransform(mouseX, (x) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return RANGE * 2;
        return x - box.x - box.width / 2;
    });

    const target = useTransform(distance, (d) => (reduced ? BASE : magnification(d)));
    const size = useSpring(target, { mass: 0.16, stiffness: 320, damping: 24 });
    const glyph = useTransform(size, (s) => s * (item.accent ? 0.46 : 0.44));

    const shared = {
        "aria-label": item.label,
        "aria-current": current ? ("page" as const) : undefined,
        className: `peer grid size-full place-items-center rounded-[13px] border outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            item.accent
                ? "border-accent/60 bg-accent text-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] hover:brightness-110"
                : current
                  ? "border-white/25 bg-white/20 text-white"
                  : "border-white/10 bg-white/[0.08] text-white/85 hover:border-white/25 hover:bg-white/15 hover:text-white"
        }`,
    };

    const glyphNode = (
        <motion.span style={{ fontSize: glyph }} className="grid place-items-center leading-none">
            <item.Icon aria-hidden="true" />
        </motion.span>
    );

    return (
        <motion.div
            ref={ref}
            style={{ width: size, height: size }}
            className="group relative shrink-0"
        >
            {item.external ? (
                <a
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    {...shared}
                >
                    {glyphNode}
                </a>
            ) : (
                <Link href={item.href} {...shared}>
                    {glyphNode}
                </Link>
            )}

            {/* Running-app indicator: only the page you are on, like macOS */}
            {current && (
                <motion.span
                    aria-hidden="true"
                    layoutId="dock-current"
                    className="pointer-events-none absolute -bottom-[5px] left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent"
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
            )}

            {/* macOS-style label, on hover and keyboard focus only */}
            <span
                role="tooltip"
                className="pointer-events-none absolute -top-[2.6rem] left-1/2 z-10 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-white/10 bg-black/85 px-2.5 py-1 text-[0.75rem] font-medium tracking-[0.01em] text-white/90 opacity-0 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 peer-focus-visible:translate-y-0 peer-focus-visible:opacity-100"
            >
                {item.label}
            </span>
        </motion.div>
    );
}

export default function Dock() {
    const mouseX = useMotionValue(Infinity);
    const router = useRouter();
    const pathname = router?.pathname || "";
    const reduced = usePrefersReducedMotion();

    const isCurrent = (item: DockItem) =>
        !item.external && (item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/"));

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 hidden justify-center md:grid">
            <motion.nav
                aria-label="Quick links"
                initial={{ y: 90, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: reduced ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
                onMouseMove={(event) => {
                    if (!reduced) mouseX.set(event.clientX);
                }}
                onMouseLeave={() => mouseX.set(Infinity)}
                className="pointer-events-auto flex items-end gap-2 rounded-[26px] border border-white/10 bg-white/[0.07] p-2.5 pb-2 shadow-[0_20px_60px_-18px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150"
            >
                {GROUPS.map((group, gi) => (
                    <Fragment key={gi}>
                        {gi > 0 && <span aria-hidden="true" className="mx-1.5 h-8 w-px self-center bg-white/10" />}
                        {group.map((item) => (
                            <DockIcon key={item.label} item={item} mouseX={mouseX} current={isCurrent(item)} />
                        ))}
                    </Fragment>
                ))}
            </motion.nav>
        </div>
    );
}
