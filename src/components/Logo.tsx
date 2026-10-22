import Image from "next/image";
import Link from "next/link";

const Logo = () => (
    <Link
        href="/"
        aria-label="Ahmed Hamdy, home"
        className="grid w-max grid-flow-col items-center gap-3"
    >
        <Image
            src="/images/logo/logo-mark.png"
            alt=""
            width={44}
            height={44}
            priority
            className="size-11 rounded-lg object-contain"
        />
        <span className="hidden leading-tight sm:grid">
            <span className="text-[0.9375rem] font-semibold">Ahmed Hamdy</span>
            <span className="meta">Full-stack engineer</span>
        </span>
    </Link>
);

export default Logo;
