import React, { ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HiMiniArrowUp } from "react-icons/hi2";
import Dock from "@/components/layout/Dock";
import Navbar from "@/components/layout/Navbar";
import SoundToggle from "@/components/layout/SoundToggle";
import TrainTransition from "@/components/visuals/TrainTransition";
import { FOOTER_LINKS } from "@/config/navigation";
import { site } from "@/config/site";

const TrainStage = dynamic(() => import("@/components/visuals/TrainStage"), { ssr: false, loading: () => null });

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto] text-ink">
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-deep"
        >
            Skip to content
        </a>

        <TrainStage />
        <div aria-hidden="true" className="grain" />
        <TrainTransition />
        <Navbar />

        <div className="fixed bottom-5 left-4 z-50 hidden sm:block">
            <SoundToggle />
        </div>

        <main id="main-content" className="relative z-10 min-w-0" style={{ paddingTop: "var(--header-h)" }}>
            {children}
        </main>

        <footer className="band-ink relative z-10 pb-28 md:pb-32">
            <div className="wrap grid gap-14 py-16">
                <div className="grid gap-6">
                    <p className="meta uppercase tracking-[0.3em] text-accent">Contact</p>
                    <h2 className="display max-w-4xl">Tell me what you&apos;re building.</h2>
                    <div className="grid gap-3 sm:grid-flow-col sm:justify-start">
                        <Link href="/contact" className="btn btn-primary">Send a message</Link>
                        <Link href="/schedule" className="btn btn-quiet">Book a call</Link>
                    </div>
                </div>

                <div className="grid gap-8 border-t border-line pt-8 md:grid-cols-[auto_1fr_auto] md:items-start md:gap-12">
                    <p className="text-[1.75rem] font-bold leading-none tracking-[-0.04em]">{site.name}</p>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <nav aria-label="Footer navigation" className="grid gap-2 text-[0.9375rem]">
                            {FOOTER_LINKS.map((l) => (
                                <Link key={l.href} className="link" href={l.href}>{l.label}</Link>
                            ))}
                        </nav>
                        <nav aria-label="Social links" className="grid content-start gap-2 text-[0.9375rem]">
                            <a className="link" href="https://github.com/Ahmed-Hamdy101" target="_blank" rel="noreferrer">GitHub</a>
                            <a className="link" href="https://www.linkedin.com/in/ahmed-hamdy-ah/" target="_blank" rel="noreferrer">LinkedIn</a>
                            <a className="link" href="https://wa.me/201141640812" target="_blank" rel="noreferrer">WhatsApp</a>
                        </nav>
                    </div>

                    <div className="grid justify-items-start gap-3 md:justify-items-end">
                        <SoundToggle />
                        <button
                            type="button"
                            className="btn btn-quiet min-h-11"
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        >
                            <HiMiniArrowUp aria-hidden="true" />
                            Back to top
                        </button>
                    </div>
                </div>

                <div className="grid gap-2">
                    <p className="meta">
                        © {new Date().getFullYear()} Ahmed Hamdy · Full stack engineer · Giza, Egypt
                    </p>
                    <p className="meta">
                        3D station and R46 subway:{" "}
                        <a
                            className="link"
                            href="https://sketchfab.com/3d-models/free-subway-station-r46-subway-ae5aadde1c6f48a19b32b309417a669b"
                            target="_blank"
                            rel="noreferrer"
                        >
                            FREE // Subway Station &amp; R46 Subway
                        </a>{" "}
                        by Alex Murias (Xlay3D), licensed{" "}
                        <a className="link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                            CC BY 4.0
                        </a>
                        .
                    </p>
                </div>
            </div>
        </footer>

        <Dock />
    </div>
);

export default Layout;
