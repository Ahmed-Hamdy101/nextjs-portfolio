import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { FaGithub, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
import { HiMiniBars3, HiMiniChevronDown, HiMiniXMark } from "react-icons/hi2";
import Logo from "./Logo";
import { projects } from "@/lib/projects-data";

const WORK_MENU = [
    {
        href: "/projects",
        title: "Projects",
        body: `${projects.length} systems shipped to production or in active development.`,
    },
    {
        href: "/work",
        title: "Work history",
        body: "Production work since 2021: booking platforms, corporate sites and ERP tooling.",
    },
    {
        href: "/skills",
        title: "Skills",
        body: "Frontend, backend, data and cloud tooling I ship with every day.",
    },
];

const LINKS = [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/testimonials", label: "Outcomes" },
    { href: "/contact", label: "Contact" },
];

const SOCIALS = [
    { label: "GitHub", href: "https://github.com/Ahmed-Hamdy101", Icon: FaGithub },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ahmed-hamdy-ah/", Icon: FaLinkedinIn },
    { label: "WhatsApp", href: "https://wa.me/201141640812", Icon: FaWhatsapp },
];

const WORK_PATHS = ["/projects", "/work", "/skills"];
const EASE = [0.16, 1, 0.3, 1] as const;

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

/** Full-screen mobile menu, rendered in a portal so it is not trapped by the header's transforms. */
function MobileMenu({ open, onClose, pathname }: { open: boolean; onClose: () => void; pathname: string }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        const onResize = () => window.innerWidth >= 1024 && onClose();
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", onResize);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", onResize);
        };
    }, [open, onClose]);

    if (!mounted) return null;

    let step = 0;
    const item = () => ({
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.12 + step++ * 0.055, duration: 0.5, ease: EASE },
    });

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    id="mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Site menu"
                    initial={{ clipPath: "inset(0 0 100% 0)" }}
                    animate={{ clipPath: "inset(0 0 0% 0)" }}
                    exit={{ clipPath: "inset(0 0 100% 0)" }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] overflow-y-auto bg-deep text-ink"
                >
                    <div className="grid h-[4.5rem] grid-cols-[1fr_auto] items-center gap-4 px-5">
                        <Logo />
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close menu"
                            className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
                        >
                            <HiMiniXMark className="text-2xl" />
                        </button>
                    </div>

                    <nav aria-label="Mobile navigation" className="grid content-center gap-8 px-5 py-6">
                        <div className="grid gap-3">
                            <motion.p {...item()} className="meta">Work</motion.p>
                            <ul className="grid gap-1">
                                {WORK_MENU.map(({ href, title, body }) => (
                                    <motion.li key={href} {...item()}>
                                        <Link
                                            href={href}
                                            onClick={onClose}
                                            aria-current={isActive(pathname, href) ? "page" : undefined}
                                            className={`grid gap-0.5 py-1.5 ${isActive(pathname, href) ? "text-accent" : "text-ink"}`}
                                        >
                                            <span className="text-[clamp(2rem,9vw,2.75rem)] font-bold leading-none tracking-[-0.04em]">{title}</span>
                                            <span className="text-sm font-normal tracking-normal text-mute">{body}</span>
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        <ul className="grid gap-1 border-t border-line pt-6">
                            {LINKS.map(({ href, label }) => (
                                <motion.li key={href} {...item()}>
                                    <Link
                                        href={href}
                                        onClick={onClose}
                                        aria-current={isActive(pathname, href) ? "page" : undefined}
                                        className={`block py-1.5 text-[clamp(2rem,9vw,2.75rem)] font-bold leading-none tracking-[-0.04em] ${
                                            isActive(pathname, href) ? "text-accent" : "text-ink"
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    </nav>

                    <motion.div {...item()} className="grid gap-4 border-t border-line px-5 pb-8 pt-5">
                        <Link href="/schedule" onClick={onClose} className="btn btn-primary min-h-12 rounded-full">
                            Book a 30-minute call
                        </Link>
                        <ul className="grid grid-flow-col justify-start gap-2" aria-label="Profiles">
                            {SOCIALS.map(({ label, href, Icon }) => (
                                <li key={label}>
                                    <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="grid size-11 place-items-center rounded-full border border-line text-mute transition-colors hover:border-accent hover:text-accent"
                                    >
                                        <Icon />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

export default function Navbar() {
    const router = useRouter();
    const pathname = router?.pathname || "";
    const [menuOpen, setMenuOpen] = useState(false);
    const [mega, setMega] = useState(false);
    const [hovered, setHovered] = useState<string | null>(null);
    const holder = useRef<HTMLDivElement>(null);

    // Scroll-linked: 0 at the top (transparent bar), 1 after 90px (black floating pill)
    const { scrollY } = useScroll();
    const progress = useSpring(useTransform(scrollY, [0, 90], [0, 1]), { stiffness: 220, damping: 32, mass: 0.4 });

    const backgroundColor = useTransform(progress, [0, 1], ["rgba(0,0,0,0)", "rgba(0,0,0,0.92)"]);
    const borderColor = useTransform(progress, [0, 1], ["rgba(255,255,255,0)", "rgba(255,255,255,0.14)"]);
    const maxWidth = useTransform(progress, [0, 1], [1152, 980]);
    const marginTop = useTransform(progress, [0, 1], [0, 12]);
    const height = useTransform(progress, [0, 1], [68, 60]);
    const backdropFilter = useTransform(progress, (v) => `blur(${(v * 14).toFixed(1)}px)`);

    useEffect(() => {
        const close = () => {
            setMenuOpen(false);
            setMega(false);
        };
        router.events.on("routeChangeComplete", close);
        return () => router.events.off("routeChangeComplete", close);
    }, [router.events]);

    useEffect(() => {
        if (!mega) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMega(false);
        const onDown = (e: MouseEvent) => {
            if (holder.current && !holder.current.contains(e.target as Node)) setMega(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("mousedown", onDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("mousedown", onDown);
        };
    }, [mega]);

    const workActive = WORK_PATHS.some((p) => isActive(pathname, p));
    const desktopLinks = LINKS.filter((l) => l.href !== "/contact");

    const pill = (id: string) =>
        hovered === id && (
            <motion.span
                layoutId="nav-pill"
                className="absolute inset-0 -z-10 rounded-full bg-white/10"
                transition={{ duration: 0.25, ease: EASE }}
            />
        );

    const underline = (on: boolean) =>
        on && (
            <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-4 bottom-0.5 h-0.5 rounded-full bg-accent"
                transition={{ duration: 0.3, ease: EASE }}
            />
        );

    return (
        <>
            <motion.header
                initial={{ y: -70, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="pointer-events-none fixed inset-x-0 top-0 z-50"
            >
                <motion.div
                    style={{ backgroundColor, borderColor, maxWidth, marginTop, height, backdropFilter, WebkitBackdropFilter: backdropFilter }}
                    className="pointer-events-auto relative mx-auto grid w-[calc(100%-1.5rem)] grid-cols-[auto_1fr_auto] items-center gap-6 rounded-[2rem] border px-3 sm:w-[calc(100%-2rem)] sm:px-5"
                >
                    <Logo />

                    <nav
                        aria-label="Main navigation"
                        className="hidden justify-self-start lg:grid lg:grid-flow-col lg:items-center lg:gap-1 lg:pl-4"
                        onMouseLeave={() => setHovered(null)}
                    >
                        <motion.div
                            ref={holder}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.5, ease: EASE }}
                            className="relative"
                            onMouseEnter={() => {
                                setMega(true);
                                setHovered("work");
                            }}
                            onMouseLeave={() => setMega(false)}
                        >
                            <button
                                type="button"
                                className={`relative grid grid-flow-col items-center gap-1.5 px-4 py-2 text-[0.9375rem] font-medium transition-colors ${
                                    workActive || mega ? "text-ink" : "text-mute"
                                }`}
                                aria-expanded={mega}
                                aria-haspopup="true"
                                aria-controls="work-menu"
                                aria-current={workActive ? "page" : undefined}
                                onClick={() => setMega((v) => !v)}
                                onFocus={() => setMega(true)}
                            >
                                {pill("work")}
                                Work
                                <HiMiniChevronDown aria-hidden="true" className={`transition-transform duration-300 ${mega ? "rotate-180" : ""}`} />
                                {underline(workActive)}
                            </button>

                            <AnimatePresence>
                                {mega && (
                                    <motion.div
                                        id="work-menu"
                                        initial={{ opacity: 0, y: -10, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.97 }}
                                        transition={{ duration: 0.22, ease: EASE }}
                                        style={{ transformOrigin: "top left" }}
                                        className="absolute left-0 top-full w-[34rem] pt-4"
                                    >
                                        <ul className="grid gap-1 rounded-2xl border border-line bg-deep p-2">
                                            {WORK_MENU.map(({ href, title, body }, i) => (
                                                <motion.li
                                                    key={href}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3, ease: EASE }}
                                                >
                                                    <Link
                                                        href={href}
                                                        className="grid gap-0.5 rounded-xl px-4 py-3 transition-colors hover:bg-white/10"
                                                        onClick={() => setMega(false)}
                                                    >
                                                        <span className="font-semibold">{title}</span>
                                                        <span className="text-sm text-mute">{body}</span>
                                                    </Link>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {desktopLinks.map(({ href, label }, i) => {
                            const active = isActive(pathname, href);
                            return (
                                <motion.div
                                    key={href}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.42 + i * 0.07, duration: 0.5, ease: EASE }}
                                    onMouseEnter={() => setHovered(href)}
                                >
                                    <Link
                                        href={href}
                                        aria-current={active ? "page" : undefined}
                                        className={`relative block px-4 py-2 text-[0.9375rem] font-medium transition-colors ${
                                            active || hovered === href ? "text-ink" : "text-mute"
                                        }`}
                                    >
                                        {pill(href)}
                                        {label}
                                        {underline(active)}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
                        className="col-start-3 grid grid-flow-col items-center gap-2 justify-self-end"
                    >
                        <Link href="/contact" className="btn btn-primary hidden rounded-full transition-transform hover:scale-[1.04] active:scale-95 sm:inline-grid">
                            Get in touch
                        </Link>
                        <button
                            type="button"
                            className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent lg:hidden"
                            aria-expanded={menuOpen}
                            aria-controls="mobile-menu"
                            aria-label="Open menu"
                            onClick={() => setMenuOpen(true)}
                        >
                            <HiMiniBars3 className="text-2xl" />
                        </button>
                    </motion.div>
                </motion.div>
            </motion.header>

            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} pathname={pathname} />
        </>
    );
}
