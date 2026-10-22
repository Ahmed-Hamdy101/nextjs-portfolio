import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
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

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(href + "/");

export default function Navbar() {
    const router = useRouter();
    const pathname = router?.pathname || "";
    const [menuOpen, setMenuOpen] = useState(false);
    const [mega, setMega] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const holder = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

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

    return (
        <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
            <div
                className={`pointer-events-auto relative mx-auto grid grid-cols-[auto_1fr_auto] items-center gap-6 rounded-[2rem] border px-5 transition-[width,margin,height,background-color,border-color,backdrop-filter] duration-300 ease-out ${
                    scrolled
                        ? "mt-3 h-[3.75rem] border-line bg-deep/90 backdrop-blur-md"
                        : "mt-0 h-[var(--header-h)] border-transparent bg-transparent"
                }`}
                style={{ width: scrolled ? "min(62rem, 100% - 2rem)" : "min(72rem, 100% - 2.5rem)" }}
            >
                <Logo />

                <nav aria-label="Main navigation" className="hidden justify-self-start lg:grid lg:grid-flow-col lg:items-center lg:gap-1 lg:pl-4">
                    <div ref={holder} className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
                        <button
                            type="button"
                            className="nav-link grid grid-flow-col items-center gap-1.5"
                            aria-expanded={mega}
                            aria-haspopup="true"
                            aria-controls="work-menu"
                            aria-current={WORK_PATHS.some((p) => isActive(pathname, p)) ? "page" : undefined}
                            onClick={() => setMega((v) => !v)}
                            onFocus={() => setMega(true)}
                        >
                            Work
                            <HiMiniChevronDown aria-hidden="true" className={`transition-transform ${mega ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                            {mega && (
                                <motion.div
                                    id="work-menu"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute left-0 top-full w-[34rem] pt-4"
                                >
                                    <ul className="grid gap-1 rounded-2xl border border-line bg-sheet p-2">
                                        {WORK_MENU.map(({ href, title, body }) => (
                                            <li key={href}>
                                                <Link
                                                    href={href}
                                                    className="grid gap-0.5 rounded-xl px-4 py-3 transition-colors hover:bg-accent-wash"
                                                    onClick={() => setMega(false)}
                                                >
                                                    <span className="font-semibold">{title}</span>
                                                    <span className="text-sm text-mute">{body}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {LINKS.map(({ href, label }) => (
                        <Link key={href} href={href} className="nav-link" aria-current={isActive(pathname, href) ? "page" : undefined}>
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="col-start-3 grid grid-flow-col items-center gap-2 justify-self-end">
                    <Link href="/contact" className="btn btn-primary rounded-full">Get in touch</Link>
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
                </div>

                {menuOpen && (
                    <nav
                        id="mobile-menu"
                        aria-label="Mobile navigation"
                        className="absolute inset-x-0 top-full mt-2 max-h-[75vh] overflow-y-auto rounded-2xl border border-line bg-paper p-2 lg:hidden"
                    >
                        {[...WORK_MENU.map(({ href, title }) => ({ href, label: title })), ...LINKS, { href: "/schedule", label: "Book a call" }].map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className="nav-link rounded-lg border-b-0 px-4 py-3 text-lg"
                                aria-current={isActive(pathname, href) ? "page" : undefined}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </header>
    );
}
