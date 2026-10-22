import React, { useEffect } from "react";
import { HiMiniXMark, HiMiniEnvelope, HiMiniMapPin, HiMiniPhone, HiMiniPrinter, HiMiniGlobeAlt } from "react-icons/hi2";
import { FaGithub, FaLinkedin } from "react-icons/fa";

interface ResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SKILLS = [
    { label: "Languages", value: "TypeScript, JavaScript, PHP, SQL, Python, Rust" },
    { label: "Backend", value: "Node.js, Express, Fastify, Bun, Laravel, REST APIs, JWT / OAuth2, RBAC" },
    { label: "Frontend", value: "Next.js 15, React, Tailwind CSS, shadcn/ui, Framer Motion" },
    { label: "Databases", value: "PostgreSQL, MySQL, MongoDB, Drizzle ORM, Prisma, Redis" },
    { label: "Desktop", value: "Tauri (Rust), WireGuard" },
    { label: "AI integration", value: "OpenAI / Claude API integration, Fastify AI services (ts-ai-api)" },
    { label: "Infra and testing", value: "Docker, NGINX, CI/CD, Vercel, DigitalOcean, AWS (EC2, S3, RDS), Jest, Jasmine, PHPUnit" },
    { label: "Currently learning", value: "NestJS, Go" },
];

const EXPERIENCE = [
    {
        role: "Full Stack Developer",
        company: "ET GCO Tours",
        link: "https://egypt-tour-guide.com",
        duration: "Dec 2025 – Present · Remote, part-time",
        points: [
            "Own a production tour-booking platform end-to-end: Next.js 15 frontend, Express/TypeScript API and PostgreSQL, with booking workflows, real-time inventory, REST APIs and admin tools.",
            "Designed a normalized PostgreSQL schema with Drizzle ORM (chosen over Prisma for speed): strategic indexes, migrations and connection pooling.",
            "Achieved LCP under 2.5s with Lighthouse SEO 100 and Accessibility 98 using Redis caching, SSR/SSG and Gzip.",
            "Deployed the frontend on Vercel and the API on DigitalOcean behind a reverse proxy with custom domains and SSL/TLS.",
            "Building online payment into the booking flow (in progress).",
            "Implemented rate limiting, CSRF protection, SQL-injection prevention, unit tests and bilingual support.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Alkayan Construction & Engineering Consultancy",
        link: "https://www.alkayan-co.com",
        duration: "Jan 2021 – Present · Maadi, Egypt, part-time contract (monthly)",
        points: [
            "Built the company's live production site: multi-category project portfolio, careers module with CV upload, and an Admin CMS with role-based access control.",
            "Completed the v2.0 rebuild (deployment pending): routing, JSON APIs, a reusable PHP component system across 10+ templates, GSAP animations and a Three.js hero.",
            "Raised the Lighthouse performance score from 50 to 80+ in the v2.0 rebuild (staging) with strategic indexes and a file-based caching layer.",
            "Hardened security: CSRF tokens, full-stack input validation, removed hard-coded credentials, closed .env exposure and fixed error leakage.",
            "Building an internal ERP stock system (in progress), accessed over my own Rust/Tauri WireGuard VPN.",
        ],
    },
];

const PROJECTS = [
    { name: "Al Kayan ERP VPN", url: "", desc: "Windows hub and client desktop apps (Rust, Tauri 2) managing a WireGuard tunnel: hub setup, peer management, live status and firewall rules limiting ERP access to the VPN subnet." },
    { name: "Logger Suite ERP", url: "ahmedhamdy101.is-a.dev/projects/logger-suite-erp", desc: "Multi-tenant SaaS (Next.js 15 + Laravel), RBAC, Redis." },
    { name: "TypeScript AI API", url: "github.com/Ahmed-Hamdy101/ts-ai-api", desc: "Fastify REST API with OpenAI integration." },
    { name: "AWS Fullstack Deployment", url: "github.com/Ahmed-Hamdy101/aws-fullstack-deployment", desc: "EC2/S3/RDS, Docker, CI/CD pipeline." },
];

const CvHeading = ({ children }: { children: React.ReactNode }) => (
    <h2 className="border-b rule print-cv-border pb-2 text-sm font-semibold tracking-tight print-cv-text-dark">{children}</h2>
);

const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Curriculum vitae of Ahmed Hamdy"
            onClick={onClose}
        >
            <div
                className="grid max-h-[90vh] w-full max-w-4xl grid-rows-[auto_1fr] overflow-hidden rounded-lg border border-line bg-sheet text-ink"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="print-hide grid grid-cols-[1fr_auto] items-center gap-3 border-b rule px-5 py-3">
                    <p className="text-sm font-semibold">Curriculum vitae</p>
                    <div className="grid grid-flow-col gap-2">
                        <button type="button" className="btn btn-quiet min-h-9" onClick={() => window.print()}>
                            <HiMiniPrinter aria-hidden="true" /> Print or save PDF
                        </button>
                        <button type="button" className="btn btn-quiet min-h-9 px-2.5" onClick={onClose} aria-label="Close">
                            <HiMiniXMark className="text-lg" />
                        </button>
                    </div>
                </div>

                <div className="print-cv-container grid content-start gap-8 overflow-y-auto bg-sheet p-6 md:p-10">
                    <header className="grid gap-6 border-b rule print-cv-border pb-7 md:grid-cols-[1fr_auto]">
                        <div className="grid gap-1">
                            <h1 className="text-4xl font-semibold tracking-tight print-cv-text-dark">Ahmed Hamdy</h1>
                            <p className="text-lg font-medium text-accent">Full Stack Engineer · Node.js / TypeScript</p>
                            <p className="meta print-cv-text-muted">Open to full-time remote</p>
                        </div>
                        <ul className="grid content-start gap-2 text-sm print-cv-text-muted">
                            <li className="icon-link"><HiMiniMapPin aria-hidden="true" /> Giza, Egypt</li>
                            <li className="icon-link"><HiMiniPhone aria-hidden="true" /> +20 114 164 0812</li>
                            <li><a className="icon-link" href="mailto:ahmedhamdy.mh95@gmail.com"><HiMiniEnvelope aria-hidden="true" /> ahmedhamdy.mh95@gmail.com</a></li>
                            <li><a className="icon-link" href="https://linkedin.com/in/ahmed-hamdy-ah" target="_blank" rel="noreferrer"><FaLinkedin aria-hidden="true" /> linkedin.com/in/ahmed-hamdy-ah</a></li>
                            <li><a className="icon-link" href="https://github.com/Ahmed-Hamdy101" target="_blank" rel="noreferrer"><FaGithub aria-hidden="true" /> github.com/Ahmed-Hamdy101</a></li>
                            <li><a className="icon-link" href="https://ahmedhamdy101.is-a.dev" target="_blank" rel="noreferrer"><HiMiniGlobeAlt aria-hidden="true" /> ahmedhamdy101.is-a.dev</a></li>
                        </ul>
                    </header>

                    <section className="grid gap-3">
                        <CvHeading>Summary</CvHeading>
                        <p className="text-sm leading-relaxed print-cv-text-muted">
                            Full stack engineer shipping production web platforms in TypeScript, Node.js, Next.js and PostgreSQL.
                            Currently own a production booking platform end-to-end (Next.js 15, Express, Drizzle, Redis) and lead
                            the security hardening and rebuild of a corporate platform. Backend-leaning, with Laravel/PHP as a
                            second stack and delivered desktop (Rust/Tauri) and Python projects.
                        </p>
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Skills</CvHeading>
                        <dl className="grid gap-3 md:grid-cols-2">
                            {SKILLS.map(({ label, value }) => (
                                <div key={label} className="rounded-md border border-line print-cv-border print-cv-bg-light p-3 text-xs">
                                    <dt className="mb-0.5 font-semibold print-cv-text-dark">{label}</dt>
                                    <dd className="text-mute print-cv-text-muted">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className="grid gap-5">
                        <CvHeading>Experience</CvHeading>
                        {EXPERIENCE.map((exp) => (
                            <article key={exp.company + exp.duration} className="grid gap-2">
                                <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-4">
                                    <h3 className="text-sm font-semibold print-cv-text-dark">
                                        {exp.role} ·{" "}
                                        <a href={exp.link} target="_blank" rel="noreferrer" className="link">{exp.company}</a>
                                    </h3>
                                    <p className="meta print-cv-text-muted">{exp.duration}</p>
                                </div>
                                <ul className="grid gap-1.5 text-xs leading-relaxed text-mute print-cv-text-muted">
                                    {exp.points.map((pt) => (
                                        <li key={pt} className="grid grid-cols-[0.75rem_1fr] items-start">
                                            <span className="mt-[0.45rem] size-1 rounded-full bg-mute" aria-hidden="true" />
                                            <span>{pt}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                        <p className="text-xs leading-relaxed text-mute print-cv-text-muted">
                            <strong className="font-semibold text-ink print-cv-text-dark">Earlier:</strong> IT Support Specialist,
                            Padel Nuestro (2023–2026); WordPress and technical SEO, Egypt Racket Sport (2025–2026).
                        </p>
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Selected projects</CvHeading>
                        <div className="grid gap-3 md:grid-cols-2">
                            {PROJECTS.map(({ name, url, desc }) => (
                                <article key={name} className="grid content-start gap-1 rounded-md border border-line print-cv-border print-cv-bg-light p-3">
                                    <h3 className="text-xs font-semibold print-cv-text-dark">{name}</h3>
                                    {url && (
                                        <a href={`https://${url}`} target="_blank" rel="noreferrer" className="link break-all text-xs">{url}</a>
                                    )}
                                    <p className="text-xs leading-relaxed text-mute print-cv-text-muted">{desc}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Education and certification</CvHeading>
                        <div className="grid gap-4 text-xs text-mute print-cv-text-muted">
                            <p className="grid gap-0.5 sm:grid-cols-[1fr_auto] sm:gap-4">
                                <span>
                                    <strong className="font-semibold text-ink print-cv-text-dark">B.Sc. Computer Science</strong><br />
                                    Higher Institute for Computer Science and Information Systems, Giza
                                </span>
                                <span className="font-medium">2020</span>
                            </p>
                            <p className="grid gap-0.5 sm:grid-cols-[1fr_auto] sm:gap-4">
                                <span>
                                    <strong className="font-semibold text-ink print-cv-text-dark">Advanced Full Stack Web Development Nanodegree</strong><br />
                                    Udacity / FWD
                                </span>
                                <span className="font-medium">2022</span>
                            </p>
                            <p>
                                <strong className="font-semibold text-ink print-cv-text-dark">Languages:</strong> Arabic (native), English (professional working proficiency)
                            </p>
                        </div>
                    </section>

                    <p className="hidden border-t border-gray-200 pt-4 text-center text-[10px] text-gray-500 print:block">
                        Ahmed Hamdy · Full Stack Engineer · ahmedhamdy.mh95@gmail.com · +20 114 164 0812
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResumeModal;
