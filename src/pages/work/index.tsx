import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

interface Job {
    id: string;
    company: string;
    companyLink: string | null;
    role: string;
    duration: string;
    type: string;
    note?: string;
    description: string;
    skills: string[];
}

const JOBS: Job[] = [
    {
        id: "et-gco",
        company: "ET GCO Tours",
        companyLink: "https://egypt-tour-guide.com",
        role: "Full Stack Developer",
        duration: "Dec 2025 – Present",
        type: "Remote",
        description:
            "Architected a type-safe, decoupled Next.js 15, Express and TypeScript app powering a complete tour booking platform with unique booking codes, customer management and real-time inventory. Normalised the PostgreSQL schema with Drizzle ORM, strategic indexes, migrations and connection pooling. Delivered LCP under 2.5s and Lighthouse scores of 100% SEO, 81% Performance and 98% Accessibility through Redis caching, SSR/SSG and Gzip. Built an accessible, mobile-first interface with Radix UI, GSAP and Framer Motion. Front end on Vercel, back end on a DigitalOcean Droplet (migrated from Oracle Cloud) behind a reverse proxy with strict SSL/TLS.",
        skills: ["Next.js 15", "TypeScript", "Express", "PostgreSQL", "Drizzle ORM", "Redis", "Radix UI", "GSAP", "DigitalOcean", "Vercel"],
    },
    {
        id: "racket-sport",
        company: "Egypt Racket Sport",
        companyLink: "https://egyptracketstore.com",
        role: "WordPress / SEO Specialist",
        duration: "Nov 2025 – Jan 2026",
        type: "Remote",
        description:
            "Managed and optimised WordPress product pages with technical SEO, improved Core Web Vitals and UI enhancements. Ran ongoing performance tuning, troubleshooting and maintenance that improved site speed and search visibility.",
        skills: ["WordPress", "SEO", "Core Web Vitals", "Performance tuning"],
    },
    {
        id: "alkayan-nova",
        company: "Al Kayan Construction & Engineering (Nova v2.0)",
        companyLink: "https://ahmedhamdy101.is-a.dev/projects/alkayan-nova",
        role: "Full Stack Developer",
        duration: "Sep 2025 – Present",
        type: "On-site · Maadi",
        note: "Custom PHP MVC rebuild",
        description:
            "Designed a custom PHP MVC framework from scratch (front-controller pattern, no Laravel, no CMS) handling routing, JSON APIs and page rendering. Architected a reusable OOP component system, with static layout classes exposing navbar, footer, hero and section blocks as composable methods, keeping markup DRY across 10+ page templates. Built a front end with MDBootstrap, GSAP-driven 3D card animations and a Three.js WebGL hero scene, with light and dark themes persisted in localStorage. Hardened security with CSRF tokens on every form, full-stack input validation, removed hard-coded credentials, closed .env exposure and fixed error-message leakage.",
        skills: ["PHP", "Custom MVC", "MDBootstrap", "Three.js", "GSAP", "WebGL", "CSRF"],
    },
    {
        id: "alkayan-cms",
        company: "Al Kayan Construction (Legacy and Real Estate CMS)",
        companyLink: "https://www.alkayan-co.com",
        role: "Full Stack Developer",
        duration: "Jan 2021 – Sep 2025",
        type: "On-site · Maadi",
        description:
            "Architected and deployed the official production web platform for Al Kayan Construction, with multi-category project portfolios and career management. Built an admin CMS with role-based access control, strict input validation and CSRF protection. Managed production deployment end to end, including cloud hosting, DNS routing and SSL configuration.",
        skills: ["Laravel", "PHP", "MySQL", "RBAC", "CSRF", "Namecheap", "GoDaddy"],
    },
    {
        id: "padel-nuestro",
        company: "Padel Nuestro",
        companyLink: null,
        role: "IT Support Specialist",
        duration: "Sep 2023 – Mar 2026",
        type: "West Cairo",
        description:
            "Maintained network and IT infrastructure for a 100-person office, resolving 10+ issues monthly. Deployed and managed CCTV, DVR and NVR systems for security monitoring. Administered Windows Server 2019, ERP systems, VPN access, software licensing, and hardware and printer support.",
        skills: ["Networking", "CCTV / NVR", "Windows Server", "ERP", "VPN", "IT support"],
    },
];

const SECTIONS: readonly DotSection[] = [
    { id: "journey", label: "Journey" },
    ...JOBS.map((j) => ({ id: j.id, label: j.company.split(" (")[0] })),
];

export default function WorkPage() {
    return (
        <>
            <SEOHead
                title="Work | Ahmed Hamdy, Full-Stack Engineer"
                description="Professional history of Ahmed Hamdy: five years of full-stack engineering, IT infrastructure and system architecture."
                path="/work"
            />
            <SectionDots sections={SECTIONS} />

            <header id="journey" data-section className="wrap grid gap-4 pb-8 pt-16">
                <h1 className="h1">Work history</h1>
                <p className="lede">Five years of full-stack engineering, IT operations and system architecture.</p>
            </header>

            {JOBS.map((job) => (
                <section
                    key={job.id}
                    id={job.id}
                    data-section
                    className="border-t border-line py-14 lg:grid lg:min-h-[60svh] lg:content-center"
                >
                    <div className="wrap grid gap-8 lg:grid-cols-12">
                        <div className="grid content-start gap-2 lg:col-span-4">
                            <p className="meta">{job.duration} · {job.type}</p>
                            <h2 className="h2">{job.role}</h2>
                            {job.companyLink ? (
                                <a href={job.companyLink} target="_blank" rel="noopener noreferrer" className="link w-max font-medium">
                                    {job.company}
                                </a>
                            ) : (
                                <p className="font-medium">{job.company}</p>
                            )}
                            {job.note && <p className="meta">{job.note}</p>}
                        </div>
                        <div className="grid content-start gap-6 lg:col-span-8">
                            <p className="muted max-w-3xl">{job.description}</p>
                            <ul className="flex flex-wrap gap-1.5">
                                {job.skills.map((skill) => (
                                    <li key={skill} className="tag">{skill}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            ))}
        </>
    );
}
