import React, { ReactNode } from "react";
import Dock from "./Dock";
import Navbar from "./Navbar";

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto] bg-paper text-ink">
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-deep"
        >
            Skip to content
        </a>

        <Navbar />

        <main id="main-content" className="min-w-0" style={{ paddingTop: "var(--header-h)" }}>
            {children}
        </main>

        <footer className="band-ink pb-28 md:pb-32">
            <div className="wrap grid gap-6 py-10 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-10">
                <p className="text-[0.9375rem]">
                    <span className="font-semibold">Ahmed Hamdy</span>
                    <span className="text-mute"> · Full-stack engineer · Cairo, Egypt</span>
                </p>
                <nav aria-label="Social links" className="grid grid-flow-col justify-start gap-5 text-[0.9375rem]">
                    <a className="link" href="https://github.com/Ahmed-Hamdy101" target="_blank" rel="noreferrer">GitHub</a>
                    <a className="link" href="https://www.linkedin.com/in/ahmed-hamdy-ah/" target="_blank" rel="noreferrer">LinkedIn</a>
                    <a className="link" href="https://wa.me/201141640812" target="_blank" rel="noreferrer">WhatsApp</a>
                </nav>
                <p className="meta">© {new Date().getFullYear()} Ahmed Hamdy</p>
            </div>
        </footer>

        <Dock />
    </div>
);

export default Layout;
