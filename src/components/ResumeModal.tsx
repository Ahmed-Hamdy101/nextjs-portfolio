import React, { useEffect } from "react";
import { HiMiniXMark, HiMiniEnvelope, HiMiniMapPin, HiMiniPhone, HiMiniPrinter } from "react-icons/hi2";
import { FaGithub, FaLinkedin } from "react-icons/fa";

interface ResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SKILLS = [
    { label: "Core stack", value: "Node.js, Express, Fastify, Bun, Laravel, Next.js 15, React, TypeScript, PHP" },
    { label: "Frontend", value: "Tailwind CSS, shadcn/ui, Radix UI, Framer Motion, GSAP, Three.js" },
    { label: "Backend and APIs", value: "RESTful APIs, JWT / OAuth2, microservices, decoupled and monolithic architecture" },
    { label: "Cloud and DevOps", value: "AWS (EC2, S3, RDS, Lambda), Docker, NGINX, CI/CD, Redis" },
    { label: "Databases and ORMs", value: "PostgreSQL, MySQL, MongoDB, Drizzle, Prisma" },
    { label: "AI and testing", value: "OpenAI / Claude LLM integration, RAG pipelines, Jest, PHPUnit, Jasmine" },
];

const EXPERIENCE = [
    {
        role: "Full Stack Developer",
        company: "ET GCO Tours",
        link: "https://egypt-tour-guide.com",
        duration: "Dec 2025 – Present · Remote",
        points: [
            "Architected a type-safe, decoupled Next.js 15, Express and TypeScript application powering a complete tour booking platform with unique booking codes, customer management and real-time inventory.",
            "Designed a normalised PostgreSQL schema with Drizzle ORM, strategic indexes, migrations and connection pooling for production-scale traffic.",
            "Delivered LCP under 2.5s and Lighthouse scores of 100% SEO, 81% Performance and 98% Accessibility through Redis caching, SSR/SSG and Gzip compression.",
            "Built an accessible, mobile-first interface using Radix UI, GSAP, Framer Motion and Tailwind CSS.",
            "Managed deployment: front end on Vercel, back end migrated from Oracle Cloud to a DigitalOcean Droplet with reverse proxy, custom domains and strict SSL/TLS.",
        ],
    },
    {
        role: "WordPress / SEO Specialist",
        company: "Egypt Racket Sport",
        link: "https://egyptracketstore.com",
        duration: "Nov 2025 – Jan 2026 · Remote",
        points: [
            "Managed and optimised WordPress product pages with technical SEO, improved Core Web Vitals and UI enhancements.",
            "Ran ongoing performance tuning, troubleshooting and maintenance that improved site speed and search visibility.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Al Kayan Construction & Engineering (Nova v2.0)",
        link: "https://ahmedhamdy101.is-a.dev/projects/alkayan-nova",
        duration: "Sep 2025 – Present · Maadi, Egypt",
        points: [
            "Architected a reusable OOP component system (PHP static layout classes) exposing shared UI blocks as composable methods, keeping markup DRY across 10+ page templates.",
            "Built a front end using MDBootstrap, GSAP-driven 3D card animations and a Three.js WebGL hero scene, with light and dark themes persisted in localStorage.",
            "Designed a custom PHP MVC framework from scratch using a front-controller pattern, handling routing, JSON APIs and page rendering, with no Laravel and no CMS.",
            "Hardened security: CSRF tokens on all forms, full-stack input validation, removed hard-coded credentials, closed .env exposure and fixed error leakage.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Al Kayan Construction (Legacy and Real Estate CMS)",
        link: "https://www.alkayan-co.com",
        duration: "Jan 2021 – Sep 2025 · Maadi, Egypt",
        points: [
            "Architected and deployed the production web platform for Al Kayan Construction, with multi-category project portfolios and career management.",
            "Built an admin CMS with role-based access control, strict input validation and CSRF protection.",
            "Managed production deployment end to end, including cloud hosting, DNS routing and SSL configuration.",
        ],
    },
    {
        role: "IT Support Specialist",
        company: "Padel Nuestro",
        link: undefined,
        duration: "Sep 2023 – Mar 2026 · West Cairo, Egypt",
        points: [
            "Maintained network and IT infrastructure for a 100-person office, resolving 10+ issues monthly.",
            "Deployed and managed CCTV, DVR and NVR systems for security monitoring.",
            "Administered Windows Server 2019, ERP systems, VPN access, software licensing, and hardware and printer support.",
        ],
    },
];

const PROJECTS = [
    { name: "ETGCO Tours", url: "egypt-tour-guide.com", desc: "Bilingual (DE/EN) PWA tourism app built with Next.js 15, TypeScript and Redis, with sub-2s load times." },
    { name: "Laravel REST API (admin backend)", url: "github.com/Ahmed-Hamdy101/laravel-rest-api", desc: "Laravel REST API with Passport OAuth2/JWT auth, RBAC, full order lifecycle management and streaming CSV exports." },
    { name: "AWS fullstack deployment", url: "github.com/Ahmed-Hamdy101/aws-fullstack-deployment", desc: "Full-stack AWS application with custom cloud infrastructure, backend services and CI/CD production deployment." },
    { name: "Logger Suite ERP", url: "ahmedhamdy101.is-a.dev/projects/logger-suite-erp", desc: "Multi-tenant SaaS ERP combining a Next.js 15 front end with a Laravel REST backend, Admin/Editor/User RBAC and Redis caching." },
    { name: "Node.js Storefront API", url: "github.com/Ahmed-Hamdy101/nodejs-store-front-api", desc: "TypeScript/Express e-commerce REST API with PostgreSQL, JWT authentication, migration workflows and Jasmine tests." },
    { name: "TypeScript AI API", url: "github.com/Ahmed-Hamdy101/ts-ai-api", desc: "Fastify REST API in TypeScript integrated with OpenAI for intelligent assistant capabilities." },
    { name: "Al Kayan Construction Nova", url: "github.com/Ahmed-Hamdy101/alkayan-nova-showcase", desc: "Construction platform built with PHP/MVC, Three.js and GSAP visuals, IndexedDB caching and SEO optimisation." },
    { name: "AutoFix", url: "github.com/Ahmed-Hamdy101/autofix-service-platform-demo", desc: "Multi-role dashboards for mechanics, admins and customers, with AI-assisted vehicle diagnostics." },
    { name: "GIS Dashboard Map", url: "github.com/Ahmed-Hamdy101/gis-dashboard", desc: "Multilingual GIS dashboard for exploring buildings on a Cesium 3D map." },
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
                            <p className="text-lg font-medium text-accent">Senior Full Stack Engineer and IT Support</p>
                            <p className="meta print-cv-text-muted">Node.js · Laravel · Next.js · TypeScript · AWS · AI integration</p>
                        </div>
                        <ul className="grid content-start gap-2 text-sm print-cv-text-muted">
                            <li className="icon-link"><HiMiniMapPin aria-hidden="true" /> 6th of October, Giza, Egypt</li>
                            <li className="icon-link"><HiMiniPhone aria-hidden="true" /> +20 114 164 0812</li>
                            <li><a className="icon-link" href="mailto:ahmedhamdy.mh95@gmail.com"><HiMiniEnvelope aria-hidden="true" /> ahmedhamdy.mh95@gmail.com</a></li>
                            <li><a className="icon-link" href="https://github.com/Ahmed-Hamdy101" target="_blank" rel="noreferrer"><FaGithub aria-hidden="true" /> github.com/Ahmed-Hamdy101</a></li>
                            <li><a className="icon-link" href="https://linkedin.com/in/ahmed-hamdy-ah" target="_blank" rel="noreferrer"><FaLinkedin aria-hidden="true" /> linkedin.com/in/ahmed-hamdy-ah</a></li>
                        </ul>
                    </header>

                    <section className="grid gap-3">
                        <CvHeading>Professional summary</CvHeading>
                        <p className="text-sm leading-relaxed print-cv-text-muted">
                            Full-stack engineer with 5+ years of experience building and deploying production web applications and APIs.
                            Deep expertise in Node.js, Laravel, Next.js 15, TypeScript and AWS. Track record of high-performance systems
                            (LCP under 2.5s, strong Lighthouse scores), secure architectures and AI-powered features (LLM integrations and
                            RAG pipelines). Live products across tourism, construction, real estate and e-commerce.
                        </p>
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Technical skills</CvHeading>
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
                        <CvHeading>Professional experience</CvHeading>
                        {EXPERIENCE.map((exp) => (
                            <article key={exp.company + exp.duration} className="grid gap-2">
                                <div className="grid gap-1 sm:grid-cols-[1fr_auto] sm:gap-4">
                                    <h3 className="text-sm font-semibold print-cv-text-dark">
                                        {exp.role} ·{" "}
                                        {exp.link ? (
                                            <a href={exp.link} target="_blank" rel="noreferrer" className="link">{exp.company}</a>
                                        ) : (
                                            exp.company
                                        )}
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
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Key projects</CvHeading>
                        <div className="grid gap-3 md:grid-cols-2">
                            {PROJECTS.map(({ name, url, desc }) => (
                                <article key={name} className="grid content-start gap-1 rounded-md border border-line print-cv-border print-cv-bg-light p-3">
                                    <h3 className="text-xs font-semibold print-cv-text-dark">{name}</h3>
                                    <a href={`https://${url}`} target="_blank" rel="noreferrer" className="link break-all text-xs">{url}</a>
                                    <p className="text-xs leading-relaxed text-mute print-cv-text-muted">{desc}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="grid gap-3">
                        <CvHeading>Education and certifications</CvHeading>
                        <div className="grid gap-4 text-xs text-mute print-cv-text-muted">
                            <p className="grid gap-0.5 sm:grid-cols-[1fr_auto] sm:gap-4">
                                <span>
                                    <strong className="font-semibold text-ink print-cv-text-dark">Bachelor of Engineering, Computer Science</strong><br />
                                    Culture &amp; Science City, Faculty of CS &amp; Information Systems, Giza, Egypt<br />
                                    Graduation project: Doctor Prescription Electronic System (Android and web)
                                </span>
                                <span className="font-medium">2020</span>
                            </p>
                            <p className="grid gap-0.5 sm:grid-cols-[1fr_auto] sm:gap-4">
                                <span>
                                    <strong className="font-semibold text-ink print-cv-text-dark">Advanced Full Stack Web Development Nanodegree</strong><br />
                                    Udacity / FWD: Node.js, Express, PostgreSQL, React, AWS (EC2, S3, RDS), Docker, CI/CD, security and testing
                                </span>
                                <span className="font-medium">2022</span>
                            </p>
                        </div>
                    </section>

                    <p className="hidden border-t border-gray-200 pt-4 text-center text-[10px] text-gray-500 print:block">
                        Ahmed Hamdy · Senior Full Stack Engineer · ahmedhamdy.mh95@gmail.com · +20 114 164 0812
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResumeModal;
