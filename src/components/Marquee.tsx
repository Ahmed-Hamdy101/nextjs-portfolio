import type { ReactNode } from "react";

interface MarqueeProps {
    items: ReactNode[];
    reverse?: boolean;
    className?: string;
}

/** Infinite horizontal ticker. The list is rendered twice so the loop is seamless. */
export default function Marquee({ items, reverse = false, className = "" }: MarqueeProps) {
    return (
        <div className={`marquee ${reverse ? "marquee-reverse" : ""} ${className}`} aria-hidden="true">
            <div className="marquee-track">
                {[...items, ...items].map((item, i) => (
                    <span key={i}>{item}</span>
                ))}
            </div>
        </div>
    );
}
