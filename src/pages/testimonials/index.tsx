import Link from "next/link";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const OUTCOMES = [
    {
        id: "et-gco",
        client: "ET GCO Tours",
        sector: "Tourism booking platform",
        site: "egypt-tour-guide.com",
        headline: "Lighthouse SEO 100, Accessibility 98",
        body: "Owns the platform end to end: Next.js 15, Express and PostgreSQL. LCP stays under 2.5 seconds with Redis caching, SSR/SSG and Gzip. Online payment is being added to the booking flow.",
    },
    {
        id: "alkayan",
        client: "Alkayan Construction & Engineering",
        sector: "Corporate platform",
        site: "alkayan-co.com",
        headline: "Lighthouse performance from 50 to 80+",
        body: "Measured on staging in the v2.0 rebuild (deployment pending), using strategic indexes and a file-based caching layer. Security was hardened with CSRF tokens, input validation, removed hard-coded credentials and a closed .env exposure.",
    },
    {
        id: "erp-vpn",
        client: "Al Kayan ERP VPN",
        sector: "Desktop tooling, in progress",
        site: "Rust · Tauri 2 · WireGuard",
        headline: "ERP reachable only over a private VPN",
        body: "Windows hub and client apps manage a WireGuard tunnel, with firewall rules that limit access to the internal ERP stock system to the VPN subnet.",
    },
] as const;

const SECTIONS: readonly DotSection[] = [
    { id: "overview", label: "Overview" },
    ...OUTCOMES.map((o) => ({ id: o.id, label: o.client.split(" ").slice(0, 2).join(" ") })),
];

export default function OutcomesPage() {
    return (
        <>
            <SEOHead
                title="Outcomes | Ahmed Hamdy, Full-Stack Engineer"
                description="Measured results from Ahmed Hamdy's work: Lighthouse scores on ET GCO Tours, performance gains on the Al Kayan rebuild, and a private VPN for an internal ERP."
                path="/testimonials"
            />
            <SectionDots sections={SECTIONS} />

            <header id="overview" data-section className="wrap grid gap-4 pb-8 pt-16">
                <h1 className="h1">Outcomes</h1>
                <p className="lede">What changed after the work shipped.</p>
            </header>

            {OUTCOMES.map((item) => (
                <section
                    key={item.id}
                    id={item.id}
                    data-section
                    className="border-t border-line py-14 lg:grid lg:min-h-[50svh] lg:content-center"
                >
                    <div className="wrap grid gap-6 lg:grid-cols-12 lg:gap-10">
                        <div className="grid content-start gap-1 lg:col-span-4">
                            <h2 className="h3">{item.client}</h2>
                            <p className="meta">{item.sector}</p>
                            <p className="meta">{item.site}</p>
                        </div>
                        <div className="grid content-start gap-4 lg:col-span-8">
                            <p className="text-3xl font-semibold leading-tight tracking-tight text-accent sm:text-4xl">
                                {item.headline}
                            </p>
                            <p className="muted max-w-2xl">{item.body}</p>
                        </div>
                    </div>
                </section>
            ))}

            <section className="band-ink py-16">
                <div className="wrap grid gap-5 justify-items-start">
                    <h2 className="h2">Have a similar problem?</h2>
                    <Link href="/contact" className="btn btn-primary">Start a project</Link>
                </div>
            </section>
        </>
    );
}
