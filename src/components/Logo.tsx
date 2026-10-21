import Link from "next/link";

const Logo = () => (
    <Link
        href="/"
        aria-label="Ahmed Hamdy, home"
        className="grid grid-flow-col items-center gap-3 w-max"
    >
        <span className="grid size-10 place-items-center rounded-md border border-accent bg-accent-wash text-accent text-sm font-semibold tracking-tight">
            AH
        </span>
        <span className="hidden sm:grid leading-tight">
            <span className="text-[0.9375rem] font-semibold">Ahmed Hamdy</span>
            <span className="meta">Full-stack engineer</span>
        </span>
    </Link>
);

export default Logo;
