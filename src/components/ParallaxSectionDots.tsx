import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SectionItem {
    id: string;
    number: string;
    label: string;
    shortLabel: string;
}

export const UNIFIED_SECTIONS: SectionItem[] = [
    { id: "overview", number: "01", label: "Overview", shortLabel: "Overview" },
    { id: "work", number: "02", label: "Selected Work", shortLabel: "Work" },
    { id: "architecture", number: "03", label: "Architecture", shortLabel: "Architecture" },
    { id: "outcomes", number: "04", label: "Client Outcomes", shortLabel: "Outcomes" },
    { id: "contact", number: "05", label: "Schedule & Contact", shortLabel: "Contact" },
];

export const scrollToSection = (id: string, e?: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
};

interface ParallaxSectionDotsProps {
    activeSection?: string;
    onSectionChange?: (id: string) => void;
}

export default function ParallaxSectionDots({
    activeSection: controlledActive,
    onSectionChange,
}: ParallaxSectionDotsProps) {
    const [internalActive, setInternalActive] = useState<string>("overview");
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);

    const activeSection = controlledActive ?? internalActive;

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight * 0.35;

            for (let i = UNIFIED_SECTIONS.length - 1; i >= 0; i--) {
                const section = document.getElementById(UNIFIED_SECTIONS[i].id);
                if (section) {
                    const top = section.offsetTop;
                    if (scrollPosition >= top) {
                        const currentId = UNIFIED_SECTIONS[i].id;
                        setInternalActive(currentId);
                        if (onSectionChange) onSectionChange(currentId);
                        return;
                    }
                }
            }
            const firstId = UNIFIED_SECTIONS[0].id;
            setInternalActive(firstId);
            if (onSectionChange) onSectionChange(firstId);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [onSectionChange]);

    return (
        <aside
            aria-label="Section parallax navigation"
            className="fixed right-6 lg:right-10 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end gap-6 pointer-events-auto select-none bg-transparent"
        >
            {/* Purely transparent container — no background color, no border box */}
            <div className="flex flex-col items-center gap-6 py-2 bg-transparent">
                {UNIFIED_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    const isHovered = hoveredSection === section.id;

                    return (
                        <div
                            key={section.id}
                            className="relative flex items-center justify-end"
                            onMouseEnter={() => setHoveredSection(section.id)}
                            onMouseLeave={() => setHoveredSection(null)}
                        >
                            {/* Slide-out Tooltip Pill */}
                            <AnimatePresence>
                                {(isHovered || isActive) && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 14, scale: 0.92 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 10, scale: 0.92 }}
                                        transition={{ duration: 0.18, ease: "easeOut" }}
                                        className={`absolute right-14 flex items-center gap-2 px-3.5 py-1.5 rounded-xl border backdrop-blur-2xl whitespace-nowrap pointer-events-none shadow-2xl ${
                                            isActive
                                                ? "bg-[#0b0f19]/90 border-red-500/30 text-white"
                                                : "bg-[#0b0f19]/70 border-white/10 text-slate-300"
                                        }`}
                                    >
                                        <span className="text-[11px] font-mono font-bold text-red-400">
                                            {section.number}
                                        </span>
                                        <span className="text-xs font-semibold tracking-wide">
                                            {section.label}
                                        </span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-red-400 animate-pulse" : "bg-slate-400"}`} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Big Dot Button — Substantial & Tactile */}
                            <button
                                type="button"
                                onClick={(e) => scrollToSection(section.id, e)}
                                aria-label={`Scroll to ${section.label}`}
                                aria-current={isActive ? "true" : undefined}
                                className="group relative flex items-center justify-center p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-full bg-transparent"
                            >
                                {/* Outer Ring when Active */}
                                {isActive && (
                                    <motion.span
                                        layoutId="activeBigDotRing"
                                        className="absolute inset-0 rounded-full border-2 border-red-500/70 bg-red-500/15 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    />
                                )}

                                {/* Big Dot Core */}
                                <div
                                    className={`
                                        relative transition-all duration-300 rounded-full flex items-center justify-center
                                        ${
                                            isActive
                                                ? "w-7 h-7 bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 shadow-[0_0_16px_rgba(239,68,68,0.8)] scale-110"
                                                : "w-5 h-5 bg-white/10 border border-white/20 group-hover:border-red-400 group-hover:bg-white/20 group-hover:scale-125"
                                        }
                                    `}
                                >
                                    {isActive ? (
                                        <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#fff]" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                                    )}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
