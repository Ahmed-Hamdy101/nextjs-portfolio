import Link from "next/link";
import { useState } from "react";
import { HiMiniArrowDownTray } from "react-icons/hi2";
import Avatar from "@/components/Avatar";
import ResumeModal from "@/components/ResumeModal";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const SECTIONS: readonly DotSection[] = [
    { id: "intro", label: "Introduction" },
    { id: "experience", label: "Experience" },
    { id: "credentials", label: "Education and more" },
];

const EXPERIENCE = [
    {
        role: "Full Stack Developer",
        company: "ET GCO Tours",
        period: "Dec 2025 – Present",
        note: "Remote, part-time",
        points: [
            "Own a production tour-booking platform end to end: Next.js 15 frontend, Express/TypeScript API and PostgreSQL, with booking workflows, real-time inventory, REST APIs and admin tools.",
            "Designed a normalized PostgreSQL schema with Drizzle ORM (chosen over Prisma for speed): strategic indexes, migrations and connection pooling.",
            "LCP under 2.5s with Lighthouse SEO 100 and Accessibility 98, using Redis caching, SSR/SSG and Gzip.",
            "Frontend on Vercel, API on DigitalOcean behind a reverse proxy with custom domains and SSL/TLS. Building online payment into the booking flow (in progress).",
            "Rate limiting, CSRF protection, SQL-injection prevention, unit tests and bilingual support.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Alkayan Construction & Engineering Consultancy",
        period: "Jan 2021 – Present",
        note: "Maadi, Egypt · part-time contract (monthly)",
        points: [
            "Built the company's live production site: multi-category project portfolio, careers module with CV upload, and an Admin CMS with role-based access control.",
            "Completed the v2.0 rebuild (deployment pending): routing, JSON APIs, a reusable PHP component system across 10+ templates, GSAP animations and a Three.js hero.",
            "Raised the Lighthouse performance score from 50 to 80+ in the v2.0 rebuild (staging) with strategic indexes and a file-based caching layer.",
            "Hardened security: CSRF tokens, full-stack input validation, removed hard-coded credentials, closed .env exposure, fixed error leakage.",
            "Building an internal ERP stock system (in progress), accessed over my own Rust/Tauri WireGuard VPN.",
        ],
    },
];

const CREDENTIALS = [
    {
        title: "B.Sc. Computer Science",
        meta: "Higher Institute for Computer Science and Information Systems, Giza · 2020",
        body: "Bachelor's degree in Computer Science.",
    },
    {
        title: "Advanced Full Stack Web Development Nanodegree",
        meta: "Udacity / FWD · 2022",
        body: "Node.js, Express, PostgreSQL, React, AWS (EC2, S3, RDS), Docker and CI/CD.",
    },
    {
        title: "Languages and learning",
        meta: "Arabic (native), English (professional working proficiency)",
        body: "Currently learning NestJS and Go.",
    },
];

export default function AboutPage() {
    const [isResumeOpen, setIsResumeOpen] = useState(false);

    return (
        <>
            <SEOHead
                title="About | Ahmed Hamdy, Full-Stack Engineer"
                description="Ahmed Hamdy is a full stack engineer in Giza, Egypt, shipping production web platforms with TypeScript, Node.js, Next.js and PostgreSQL. Open to full-time remote roles."
                path="/about"
            />
            <SectionDots sections={SECTIONS} />

            <section id="intro" data-section className="section">
                <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
                    <div className="grid gap-7 lg:col-span-7">
                        <h1 className="h1">Full stack engineer in Giza, Egypt.</h1>
                        <div className="grid gap-4 lede">
                            <p>
                                I&apos;m Ahmed Hamdy. I ship production web platforms in TypeScript, Node.js, Next.js and
                                PostgreSQL, and I&apos;m open to full-time remote roles.
                            </p>
                            <p>
                                I currently own a production booking platform end to end (Next.js 15, Express, Drizzle,
                                Redis) and lead the security hardening and rebuild of a corporate platform. I lean
                                backend, with Laravel and PHP as a second stack, plus desktop (Rust and Tauri) and
                                Python projects.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-flow-col sm:justify-start">
                            <button type="button" className="btn btn-primary" onClick={() => setIsResumeOpen(true)}>
                                <HiMiniArrowDownTray aria-hidden="true" />
                                Review CV
                            </button>
                            <Link href="/skills" className="btn btn-quiet">Technical skills</Link>
                            <Link href="/projects" className="btn btn-quiet">All projects</Link>
                        </div>
                        <p className="border-t rule pt-6 font-medium">
                            ET GCO Tours loads with LCP under 2.5 seconds and scores 100 on Lighthouse SEO. On the Al Kayan
                            v2.0 rebuild, Lighthouse performance went from 50 to 80+ on staging.
                        </p>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg border border-line">
                            <Avatar />
                        </div>
                    </div>
                </div>
            </section>

            <section id="experience" data-section className="section border-t border-line">
                <div className="wrap grid gap-10">
                    <header className="grid gap-3">
                        <h2 className="h2">Experience</h2>
                        <Link href="/work" className="link w-max">Full work history</Link>
                    </header>
                    <ol className="grid">
                        {EXPERIENCE.map((job) => (
                            <li key={job.company + job.period} className="grid gap-4 border-t rule py-7 md:grid-cols-12 md:gap-8">
                                <p className="meta md:col-span-3">{job.period}</p>
                                <div className="grid content-start gap-1 md:col-span-3">
                                    <h3 className="h3">{job.role}</h3>
                                    <p className="muted">{job.company}</p>
                                    <p className="meta">{job.note}</p>
                                </div>
                                <ul className="grid gap-2 md:col-span-6">
                                    {job.points.map((point) => (
                                        <li key={point} className="muted">{point}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                        <li className="grid gap-2 border-t rule py-7 md:grid-cols-12 md:gap-8">
                            <p className="meta md:col-span-3">Earlier</p>
                            <p className="muted md:col-span-9">
                                IT Support Specialist, Padel Nuestro (2023–2026). WordPress and technical SEO, Egypt Racket Sport (2025–2026).
                            </p>
                        </li>
                    </ol>
                </div>
            </section>

            <section id="credentials" data-section className="section border-t border-line">
                <div className="wrap grid gap-10">
                    <h2 className="h2">Education and more</h2>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {CREDENTIALS.map((item) => (
                            <article key={item.title} className="grid content-start gap-3 border-t rule pt-6">
                                <h3 className="h3">{item.title}</h3>
                                <p className="meta">{item.meta}</p>
                                <p className="muted">{item.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {isResumeOpen && <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />}
        </>
    );
}
