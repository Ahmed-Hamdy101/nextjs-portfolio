import Link from "next/link";
import Image from "next/image";
import { site } from "@/config/site";

/** Cropped monogram from Ahmed's supplied logo artwork. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
    return (
        <Image
            src="/brand/logo-mark.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className={`${className} mix-blend-screen`}
            draggable={false}
        />
    );
}

const Logo = ({ compact = false }: { compact?: boolean }) => (
    <Link
        href="/"
        aria-label={`${site.name}, home`}
        className="group grid w-max grid-flow-col items-center gap-2.5 text-ink"
    >
        <span className="transition-opacity group-hover:opacity-75">
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
