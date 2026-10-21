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
    { id: "credentials", label: "Education and training" },
];

const EXPERIENCE = [
    {
        role: "Full Stack Developer",
        company: "ET GCO Tours",
        period: "Dec 2025 – Present",
        points: [
            "Architected a decoupled Next.js 15, Express and TypeScript app with unique booking codes, customer management and real-time inventory.",
            "Delivered LCP under 2.5s and Lighthouse scores of 100% SEO, 81% Performance and 98% Accessibility through Redis caching, SSR/SSG and Gzip.",
            "Built an accessible, mobile-first UI with Radix UI, GSAP and Framer Motion. Deployed on Vercel and a DigitalOcean Droplet.",
        ],
    },
    {
        role: "WordPress / SEO Specialist",
        company: "Egypt Racket Sport",
        period: "Nov 2025 – Jan 2026",
        points: [
            "Managed and optimised WordPress product pages with technical SEO and Core Web Vitals improvements.",
            "Ran ongoing performance tuning and maintenance that improved site speed and search visibility.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Al Kayan Construction & Engineering (Nova v2.0)",
        period: "Sep 2025 – Present",
        points: [
            "Designed a custom PHP MVC framework from scratch using the front-controller pattern, with no Laravel and no CMS.",
            "Built a reusable OOP component system and a front end with MDBootstrap, GSAP 3D cards and a Three.js WebGL hero.",
            "Hardened security with CSRF tokens, full-stack input validation, removed hard-coded credentials and closed .env exposure.",
        ],
    },
    {
        role: "Full Stack Developer",
        company: "Al Kayan Construction (Legacy and Real Estate CMS)",
        period: "Jan 2021 – Sep 2025",
        points: [
            "Architected and deployed the production web platform for Al Kayan Construction, with multi-category project portfolios and career management.",
            "Built an admin CMS with role-based access control, strict input validation and CSRF protection.",
            "Managed production deployment end to end: cloud hosting, DNS routing and SSL configuration.",
        ],
    },
    {
        role: "IT Support Specialist",
        company: "Padel Nuestro",
        period: "Sep 2023 – Mar 2026",
        points: [
            "Maintained network and IT infrastructure for a 100-person office, resolving 10+ issues monthly.",
            "Deployed and managed CCTV, DVR and NVR systems for security monitoring.",
            "Administered Windows Server 2019, ERP systems, VPN access, licensing, and hardware and printer support.",
        ],
    },
];

const CREDENTIALS = [
    {
        title: "Bachelor of Engineering, Computer Science",
        meta: "Culture & Science City, Giza · 2020",
        body: "Faculty of Computer Science and Information Systems. Graduation project: Doctor Prescription Electronic System (Android and web).",
        tags: ["Data structures", "Algorithms", "OOP", "Software engineering", "Networks"],
    },
    {
        title: "Udacity Advanced Full Stack Nanodegree",
        meta: "2022",
        body: "Node.js, Express, PostgreSQL, React, AWS (EC2, S3, RDS), Docker, CI/CD, security, and unit and integration testing.",
        tags: ["Microservices", "CI/CD", "AWS", "Docker", "Testing"],
    },
    {
        title: "Clean architecture and SOLID",
        meta: "Applied across 10+ production projects",
        body: "DRY and SOLID principles with Swagger/OpenAPI documentation. CI/CD automation on AWS Elastic Beanstalk with CircleCI.",
        tags: ["SOLID", "OpenAPI", "Elastic Beanstalk", "CircleCI"],
    },
];

export default function AboutPage() {
    const [isResumeOpen, setIsResumeOpen] = useState(false);

    return (
        <>
            <SEOHead
                title="About | Ahmed Hamdy, Full-Stack Engineer"
                description="Ahmed Hamdy is a full-stack engineer with 5+ years of experience building scalable web applications and cloud infrastructure with Next.js, Laravel and AWS."
                path="/about"
            />
            <SectionDots sections={SECTIONS} />

            <section id="intro" data-section className="section">
                <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-center">
                    <div className="grid gap-7 lg:col-span-7">
                        <h1 className="h1">Full-stack engineer based in Giza, Egypt.</h1>
                        <div className="grid gap-4 lede">
                            <p>
                                I&apos;m Ahmed Hamdy. I design and ship web applications, REST APIs and cloud-hosted systems
                                across the whole stack.
                            </p>
                            <p>
                                From real estate platforms and ERP systems to AI-powered products and tourism PWAs, I focus on
                                high-performance architecture with Node.js, Bun, Laravel, Next.js and AWS.
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
                            Five years in production. Cut security vulnerabilities by 75% on the Al Kayan CMS and kept
                            ET GCO Tours under a 2.5 second largest contentful paint.
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
                        <Link href="/work" className="link w-max">Full professional journey</Link>
                    </header>
                    <ol className="grid">
                        {EXPERIENCE.map((job) => (
                            <li key={job.company + job.period} className="grid gap-4 border-t rule py-7 md:grid-cols-12 md:gap-8">
                                <p className="meta md:col-span-3">{job.period}</p>
                                <div className="grid content-start gap-1 md:col-span-3">
                                    <h3 className="h3">{job.role}</h3>
                                    <p className="muted">{job.company}</p>
                                </div>
                                <ul className="grid gap-2 md:col-span-6">
                                    {job.points.map((point) => (
                                        <li key={point} className="muted">{point}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="credentials" data-section className="section border-t border-line">
                <div className="wrap grid gap-10">
                    <h2 className="h2">Education and training</h2>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {CREDENTIALS.map((item) => (
                            <article key={item.title} className="grid content-start gap-3 border-t rule pt-6">
                                <h3 className="h3">{item.title}</h3>
                                <p className="meta">{item.meta}</p>
                                <p className="muted">{item.body}</p>
                                <p className="meta">{item.tags.join(", ")}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {isResumeOpen && <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />}
        </>
    );
}
