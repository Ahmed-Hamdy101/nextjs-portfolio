import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

interface Job {
    id: string;
    company: string;
    companyLink: string | null;
    role: string;
    duration: string;
    type: string;
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
        type: "Remote · part-time",
        description:
            "Own a production tour-booking platform end to end: Next.js 15 frontend, Express/TypeScript API and PostgreSQL, with booking workflows, real-time inventory, REST APIs and admin tools. Designed a normalized PostgreSQL schema with Drizzle ORM (chosen over Prisma for speed), with strategic indexes, migrations and connection pooling. Achieved LCP under 2.5s with Lighthouse SEO 100 and Accessibility 98 using Redis caching, SSR/SSG and Gzip. Deployed the frontend on Vercel and the API on DigitalOcean behind a reverse proxy with custom domains and SSL/TLS. Implemented rate limiting, CSRF protection, SQL-injection prevention, unit tests and bilingual support. Building online payment into the booking flow (in progress).",
        skills: ["Next.js 15", "TypeScript", "Express", "PostgreSQL", "Drizzle ORM", "Redis", "Vercel", "DigitalOcean"],
    },
    {
        id: "alkayan",
        company: "Alkayan Construction & Engineering Consultancy",
        companyLink: "https://www.alkayan-co.com",
        role: "Full Stack Developer",
        duration: "Jan 2021 – Present",
        type: "Maadi, Egypt · part-time contract (monthly)",
        description:
            "Built the company's live production site: a multi-category project portfolio, a careers module with CV upload, and an Admin CMS with role-based access control. Completed the v2.0 rebuild (deployment pending): routing, JSON APIs, a reusable PHP component system across 10+ templates, GSAP animations and a Three.js hero. Raised the Lighthouse performance score from 50 to 80+ in the v2.0 rebuild (staging) with strategic indexes and a file-based caching layer. Hardened security with CSRF tokens, full-stack input validation, removed hard-coded credentials, closed .env exposure and fixed error leakage. Building an internal ERP stock system (in progress), accessed over my own Rust/Tauri WireGuard VPN.",
        skills: ["PHP", "Laravel", "MySQL", "RBAC", "GSAP", "Three.js", "CSRF", "Rust", "Tauri", "WireGuard"],
    },
    {
        id: "earlier",
        company: "Earlier roles",
        companyLink: null,
        role: "IT support and WordPress",
        duration: "2023 – 2026",
        type: "Padel Nuestro · Egypt Racket Sport",
        description:
            "IT Support Specialist at Padel Nuestro (2023–2026). WordPress and technical SEO at Egypt Racket Sport (2025–2026).",
        skills: ["IT support", "WordPress", "Technical SEO"],
    },
];

const SECTIONS: readonly DotSection[] = [
    { id: "journey", label: "Overview" },
    ...JOBS.map((j) => ({ id: j.id, label: j.company.split(" ")[0] === "Alkayan" ? "Alkayan" : j.company })),
];

export default function WorkPage() {
    return (
        <>
            <SEOHead
                title="Work | Ahmed Hamdy, Full-Stack Engineer"
                description="Work history of Ahmed Hamdy: ET GCO Tours (Dec 2025 to present) and Alkayan Construction & Engineering Consultancy (Jan 2021 to present), plus earlier IT and WordPress roles."
                path="/work"
            />
            <SectionDots sections={SECTIONS} />

            <header id="journey" data-section className="wrap grid gap-4 pb-8 pt-16">
                <h1 className="h1">Work history</h1>
                <p className="lede">Production web platforms since 2021, from booking systems to corporate sites and ERP tooling.</p>
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
