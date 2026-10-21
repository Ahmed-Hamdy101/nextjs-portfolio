import type { ReactNode, MouseEvent } from "react";

interface SpotlightCardProps {
    children: ReactNode;
    className?: string;
}

/** Aceternity style card whose highlight follows the pointer. */
export default function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
    const onMove = (e: MouseEvent<HTMLDivElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - box.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - box.top}px`);
    };

    return (
        <div onMouseMove={onMove} className={`panel spot ${className}`}>
            <div className="relative grid h-full">{children}</div>
        </div>
    );
}
