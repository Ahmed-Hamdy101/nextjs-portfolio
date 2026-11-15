import { useCallback, useEffect, useRef, useState } from "react";
import { HiMiniChevronDown, HiMiniChevronUp } from "react-icons/hi2";

export interface DotSection {
    id: string;
    label: string;
}

interface SectionDotsProps {
    sections: readonly DotSection[];
}

const WHEEL_LOCK_MS = 850;
const WHEEL_THRESHOLD = 24;

let snapUsers = 0;

export default function SectionDots({ sections }: SectionDotsProps) {
    const navRef = useRef<HTMLElement>(null);
    const activeRef = useRef(0);
    const lockedUntil = useRef(0);
    const [active, setActive] = useState(sections[0]?.id);

    const find = useCallback((id: string) => {
        const scope: ParentNode = navRef.current?.parentElement ?? document;
        return scope.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    }, []);

    const go = useCallback(
        (i: number) => {
            const target = sections[i];
            if (!target) return;
            lockedUntil.current = performance.now() + WHEEL_LOCK_MS;
            find(target.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        [sections, find]
    );

    useEffect(() => {
        const root = document.documentElement;
        snapUsers += 1;
        root.classList.add("snap");
        setActive(sections[0]?.id);

        let frame = 0;
        const setCurrent = (i: number) => {
            activeRef.current = i;
            setActive(sections[i].id);
        };
        const compute = () => {
            frame = 0;
            if (!sections.length) return;
            const atTop = window.scrollY < 48;
            const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 4;

            if (atTop) return setCurrent(0);
            if (atBottom) return setCurrent(sections.length - 1);

            const anchor = window.innerHeight * 0.35;
            let current = 0;
            sections.forEach((section, i) => {
                const el = find(section.id);
                if (el && el.getBoundingClientRect().top <= anchor) current = i;
            });
            setCurrent(current);
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(compute);
        };

        // Sections that fit the viewport advance one-by-one; tall (data-free) sections scroll natively.
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
            if (performance.now() < lockedUntil.current) {
                e.preventDefault();
                return;
            }
            const section = sections[activeRef.current];
            const el = section && find(section.id);
            if (!el || el.hasAttribute("data-free")) return;

            const rect = el.getBoundingClientRect();
            const header = parseFloat(getComputedStyle(root).getPropertyValue("--header-h")) * 16 || 0;
            if (rect.height > window.innerHeight - header + 8) return;
            if (Math.abs(rect.top - header) > 24) return;

            const next = activeRef.current + (e.deltaY > 0 ? 1 : -1);
            if (next < 0 || next >= sections.length) return;
            e.preventDefault();
            go(next);
        };

        compute();
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        window.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("wheel", onWheel);
            if (frame) cancelAnimationFrame(frame);
            snapUsers -= 1;
            if (snapUsers <= 0) root.classList.remove("snap");
        };
    }, [sections, find, go]);

    const index = Math.max(0, sections.findIndex((s) => s.id === active));

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
                    <span aria-hidden="true">{section.label}</span>
                    <i aria-hidden="true">{String(i + 1).padStart(2, "0")}</i>
                </button>
            ))}

            <button type="button" className="dot-step" aria-label="Next section" disabled={index === sections.length - 1} onClick={() => go(index + 1)}>
                <HiMiniChevronDown aria-hidden="true" />
            </button>
        </nav>
    );
}
