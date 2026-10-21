import { useCallback, useEffect, useState } from "react";
import { HiMiniChevronDown, HiMiniChevronUp } from "react-icons/hi2";

export interface DotSection {
    id: string;
    label: string;
}

interface SectionDotsProps {
    sections: readonly DotSection[];
}

export default function SectionDots({ sections }: SectionDotsProps) {
    const [active, setActive] = useState(sections[0]?.id);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add("snap");

        const targets = sections
            .map((s) => document.getElementById(s.id))
            .filter((el): el is HTMLElement => el !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                const hit = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (hit) setActive(hit.target.id);
            },
            { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] }
        );
        targets.forEach((el) => observer.observe(el));

        return () => {
            observer.disconnect();
            root.classList.remove("snap");
        };
    }, [sections]);

    const index = Math.max(0, sections.findIndex((s) => s.id === active));

    const go = useCallback(
        (i: number) => {
            const target = sections[i];
            if (!target) return;
            document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        [sections]
    );

    return (
        <nav aria-label="Page sections" className="dots">
            <button type="button" className="dot-step" aria-label="Previous section" disabled={index === 0} onClick={() => go(index - 1)}>
                <HiMiniChevronUp aria-hidden="true" />
            </button>

            {sections.map((section, i) => (
                <button
                    key={section.id}
                    type="button"
                    className="dot-btn"
                    aria-label={section.label}
                    aria-current={section.id === active ? "true" : undefined}
                    onClick={() => go(i)}
                >
                    <i aria-hidden="true" />
                    <span aria-hidden="true">{section.label}</span>
                </button>
            ))}

            <button type="button" className="dot-step" aria-label="Next section" disabled={index === sections.length - 1} onClick={() => go(index + 1)}>
                <HiMiniChevronDown aria-hidden="true" />
            </button>
        </nav>
    );
}
