import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
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
        body: "Five years of full-stack engineering, IT operations and architecture.",
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
];

const WORK_PATHS = ["/projects", "/work", "/skills"];
const EASE = [0.16, 1, 0.3, 1] as const;

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

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
        <motion.header
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="pointer-events-none fixed inset-x-0 top-0 z-50"
        >
            <motion.div
                style={{ backgroundColor, borderColor, maxWidth, marginTop, height, backdropFilter, WebkitBackdropFilter: backdropFilter }}
                className="pointer-events-auto relative mx-auto grid w-[calc(100%-2rem)] grid-cols-[auto_1fr_auto] items-center gap-6 rounded-[2rem] border px-5"
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

                    {LINKS.map(({ href, label }, i) => {
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
                    <Link href="/contact" className="btn btn-primary rounded-full transition-transform hover:scale-[1.04] active:scale-95">
                        Get in touch
                    </Link>
                    <button
                        type="button"
                        className="btn btn-quiet rounded-full px-3 lg:hidden"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        aria-label={menuOpen ? "Close menu" : "Open menu"}
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        {menuOpen ? <HiMiniXMark className="text-xl" /> : <HiMiniBars3 className="text-xl" />}
                    </button>
                </motion.div>

                <AnimatePresence>
                    {menuOpen && (
                        <motion.nav
                            id="mobile-menu"
                            aria-label="Mobile navigation"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: EASE }}
                            className="absolute inset-x-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-deep p-2 lg:hidden"
                        >
                            {[...WORK_MENU.map(({ href, title }) => ({ href, label: title })), ...LINKS, { href: "/schedule", label: "Book a call" }].map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`block rounded-lg px-4 py-3 text-lg font-medium transition-colors hover:bg-white/10 ${
                                        isActive(pathname, href) ? "text-accent" : "text-ink"
                                    }`}
                                    aria-current={isActive(pathname, href) ? "page" : undefined}
                                >
                                    {label}
                                </Link>
                            ))}
                        </motion.nav>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.header>
    );
}
