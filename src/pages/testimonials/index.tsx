import Link from "next/link";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const OUTCOMES = [
    {
        id: "alkayan",
        client: "Al Kayan Engineering",
        sector: "Construction and real estate",
        site: "alkayan-co.com",
        headline: "75% fewer security vulnerabilities",
        body: "Built the real estate CMS from scratch with role-based access control, strict input validation and CSRF protection. The property listing operation runs on it in production.",
    },
    {
        id: "et-gco",
        client: "ET GCO Tours",
        sector: "Tourism platform",
        site: "egypt-tour-guide.com",
        headline: "100% Lighthouse SEO, 98% Accessibility",
        body: "Delivered a bilingual PWA with a booking workflow that loads in under 2.5 seconds LCP, backed by Redis caching and SSR/SSG.",
    },
    {
        id: "padel",
        client: "Padel Nuestro",
        sector: "Sports and retail",
        site: "West Cairo",
        headline: "IT for a 100-person office",
        body: "Maintained network and IT infrastructure, ERP, VPN, licensing and hardware support, and deployed CCTV, DVR and NVR security systems end to end.",
    },
    {
        id: "racket",
        client: "Egypt Racket Sport",
        sector: "E-commerce and SEO",
        site: "WordPress / WooCommerce",
        headline: "Faster pages, better search visibility",
        body: "Improved Core Web Vitals through caching and image optimisation, and did on-page SEO work on product pages.",
    },
] as const;

const SECTIONS: readonly DotSection[] = [
    { id: "overview", label: "Overview" },
    ...OUTCOMES.map((o) => ({ id: o.id, label: o.client })),
];

export default function OutcomesPage() {
    return (
        <>
            <SEOHead
                title="Outcomes | Ahmed Hamdy, Full-Stack Engineer"
                description="Measured results from Ahmed Hamdy's engagements: security, performance, SEO and IT infrastructure outcomes for four clients."
                path="/testimonials"
            />
            <SectionDots sections={SECTIONS} />

            <header id="overview" data-section className="wrap grid gap-4 pb-8 pt-16">
                <h1 className="h1">Outcomes</h1>
                <p className="lede">What changed for each client after the work shipped.</p>
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
