import Link from "next/link";
import { site } from "@/config/site";

/**
 * Brand mark: a rail-track "A" — two converging rails, a crossbar and the
 * ground line. Drawn inline so it inherits `currentColor` and stays crisp.
 */
export function LogoMark({ className = "size-7" }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            role="img"
            aria-hidden="true"
            focusable="false"
            className={className}
            fill="none"
        >
            <path d="M6.5 25.5 16 5.5l9.5 20" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="miter" />
            <path d="M11.1 18.6h9.8" stroke="currentColor" strokeWidth="2.4" />
            <path d="M3.5 25.5h25" stroke="currentColor" strokeWidth="2.4" />
        </svg>
    );
}

const Logo = ({ compact = false }: { compact?: boolean }) => (
    <Link
        href="/"
        aria-label={`${site.name}, home`}
        className="group grid w-max grid-flow-col items-center gap-2.5 text-ink"
    >
        <span className="text-accent transition-colors group-hover:text-ink">
            <LogoMark />
        </span>
        {!compact && (
            <span className="hidden leading-none sm:grid">
                <span className="text-[0.875rem] font-semibold tracking-[-0.01em]">{site.name}</span>
                <span className="mt-1 text-[0.6875rem] uppercase tracking-[0.16em] text-mute">{site.role}</span>
            </span>
        )}
    </Link>
);

export default Logo;
