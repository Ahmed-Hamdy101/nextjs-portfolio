import { useCallback, useEffect, useRef, useState } from "react";
import { HiMiniChevronDown, HiMiniChevronUp } from "react-icons/hi2";

export interface DotSection {
    id: string;
    label: string;
}

interface SectionDotsProps {
    sections: readonly DotSection[];
}

let snapUsers = 0;

export default function SectionDots({ sections }: SectionDotsProps) {
    const navRef = useRef<HTMLElement>(null);
    const [active, setActive] = useState(sections[0]?.id);

    // Sections are looked up inside this page's own wrapper, so a page that is still
    // animating out cannot hand back its elements when ids repeat across pages.
    const find = useCallback((id: string) => {
        const scope: ParentNode = navRef.current?.parentElement ?? document;
        return scope.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        snapUsers += 1;
        root.classList.add("snap");
        setActive(sections[0]?.id);

        let frame = 0;
        const compute = () => {
            frame = 0;
            if (!sections.length) return;
            const atTop = window.scrollY < 48;
            const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;

            if (atTop) return setActive(sections[0].id);
            if (atBottom) return setActive(sections[sections.length - 1].id);

            const anchor = window.innerHeight * 0.35;
            let current = sections[0].id;
            for (const section of sections) {
                const el = find(section.id);
                if (el && el.getBoundingClientRect().top <= anchor) current = section.id;
            }
            setActive(current);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(compute);
        };

        compute();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);

        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            if (frame) cancelAnimationFrame(frame);
            snapUsers -= 1;
            if (snapUsers <= 0) root.classList.remove("snap");
        };
    }, [sections, find]);

    const index = Math.max(0, sections.findIndex((s) => s.id === active));

    const go = useCallback(
        (i: number) => {
            const target = sections[i];
            if (!target) return;
            find(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        [sections, find]
    );

    return (
        <nav ref={navRef} aria-label="Page sections" className="dots">
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
