import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FaGithub, FaLinkedinIn, FaStackOverflow, FaWhatsapp } from "react-icons/fa";
import { HiMiniArrowDownTray, HiMiniArrowRight } from "react-icons/hi2";
import { projects } from "@/lib/projects-data";
import HeroParallax, { ParallaxItem } from "@/components/HeroParallax";
import ParallaxScroll from "@/components/ParallaxScroll";
import StickyLayers, { Layer } from "@/components/StickyLayers";
import TextReveal from "@/components/TextReveal";
import Marquee from "@/components/Marquee";
import SpotlightCard from "@/components/SpotlightCard";
import ScheduleForm from "@/components/ScheduleForm";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead, { SITE_ORIGIN } from "@/components/SEOHead";

const ResumeModal = dynamic(() => import("@/components/ResumeModal"), {
    ssr: false,
    loading: () => null,
});

const SECTIONS: readonly DotSection[] = [
    { id: "overview", label: "Overview" },
    { id: "intro", label: "Introduction" },
    { id: "work", label: "Selected work" },
    { id: "stack", label: "How I build" },
    { id: "outcomes", label: "Outcomes" },
    { id: "contact", label: "Contact" },
];

const SOCIALS = [
    { label: "GitHub", href: "https://github.com/Ahmed-Hamdy101", Icon: FaGithub },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ahmed-hamdy-ah/", Icon: FaLinkedinIn },
    { label: "Stack Overflow", href: "https://stackoverflow.com/users/19638490/ahmed-hamdy", Icon: FaStackOverflow },
    { label: "WhatsApp", href: "https://wa.me/201141640812", Icon: FaWhatsapp },
];

const STATEMENT =
    "I build web products end to end: the interface, the API, the data and the servers they run on. I own a live booking platform and lead the security hardening and rebuild of a corporate platform.";

const STACK_ROW_ONE = ["Next.js", "React", "TypeScript", "Node.js", "Bun", "Fastify", "Laravel"];
const STACK_ROW_TWO = ["PostgreSQL", "Redis", "Docker", "AWS", "NGINX", "Tailwind", "Drizzle"];

const LAYERS: Layer[] = [
    {
        name: "Interface",
        tools: ["Next.js 15", "React", "TypeScript", "Tailwind CSS", "Framer Motion"],
        body: "Server-rendered and cached for fast first paint, with accessibility and SEO treated as requirements.",
    },
    {
        name: "API",
        tools: ["Node.js", "Express", "Fastify", "Bun", "Laravel"],
        body: "Typed REST APIs with JWT / OAuth2 authentication, role-based access control and rate limiting.",
    },
    {
        name: "Data",
        tools: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Drizzle", "Prisma"],
        body: "Normalized PostgreSQL schemas with strategic indexes, migrations and connection pooling, and Redis in front of hot reads.",
    },
    {
        name: "Delivery",
        tools: ["Docker", "NGINX", "Vercel", "DigitalOcean", "AWS", "CI/CD"],
        body: "Frontend on Vercel and API on DigitalOcean behind a reverse proxy, with custom domains, SSL/TLS, Docker and CI/CD pipelines.",
    },
];

const withImage = projects.filter((p) => p.previewImage);
const toItem = (p: (typeof projects)[number]): ParallaxItem => ({
    title: p.title,
    href: p.slug ? `/projects/${p.slug}` : "/projects",
    image: p.previewImage,
});

const heroItems: ParallaxItem[] = Array.from({ length: 15 }, (_, i) => toItem(withImage[i % withImage.length]));
const workItems = withImage.slice(0, 9).map((p) => ({ ...toItem(p), note: `${p.category} · ${p.year}` }));

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person",
            "@id": `${SITE_ORIGIN}/#person`,
            name: "Ahmed Hamdy",
            url: `${SITE_ORIGIN}/about`,
            jobTitle: "Full Stack Engineer",
            address: { "@type": "PostalAddress", addressLocality: "Giza", addressCountry: "EG" },
            sameAs: [
                "https://github.com/Ahmed-Hamdy101",
                "https://www.linkedin.com/in/ahmed-hamdy-ah/",
                "https://stackoverflow.com/users/19638490/ahmed-hamdy",
            ],
            knowsAbout: ["TypeScript", "Node.js", "Next.js", "React", "Laravel", "AWS", "PostgreSQL", "Redis", "Docker"],
        },
        {
            "@type": "WebSite",
            "@id": `${SITE_ORIGIN}/#website`,
            url: `${SITE_ORIGIN}/`,
            name: "Ahmed Hamdy | Portfolio",
            publisher: { "@id": `${SITE_ORIGIN}/#person` },
            inLanguage: "en",
        },
    ],
};

export default function HomePage() {
    const [isResumeOpen, setIsResumeOpen] = useState(false);

    return (
        <>
            <SEOHead
                title="Ahmed Hamdy | Full-Stack Engineer"
                description="Ahmed Hamdy is a full stack engineer in Giza, Egypt, shipping production web platforms with TypeScript, Node.js, Next.js and PostgreSQL. Open to full-time remote roles."
                path="/"
                structuredData={structuredData}
            />

            <SectionDots sections={SECTIONS} />

            {/* Overview: parallax hero */}
            <section id="overview" data-section data-free>
                <HeroParallax
                    items={heroItems}
                    header={
                        <div className="wrap relative z-10 grid gap-8 pb-10 pt-16 md:pt-24">
                            <h1 className="display max-w-5xl">Full-stack engineer. Database to deploy.</h1>
                            <p className="lede">
                                I&apos;m Ahmed Hamdy in Giza, Egypt. I ship production web platforms in TypeScript,
                                Node.js, Next.js and PostgreSQL, and I&apos;m open to full-time remote roles.
                            </p>
                            <div className="grid gap-3 sm:grid-flow-col sm:justify-start">
                                <Link href="/projects" className="btn btn-primary">See case studies</Link>
                                <button type="button" className="btn btn-quiet" onClick={() => setIsResumeOpen(true)}>
                                    <HiMiniArrowDownTray aria-hidden="true" />
                                    Download CV
                                </button>
                            </div>
                            <ul className="grid grid-flow-col justify-start gap-2" aria-label="Profiles">
                                {SOCIALS.map(({ label, href, Icon }) => (
                                    <li key={label}>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={label}
                                            className="grid size-11 place-items-center rounded-full border border-line text-mute transition-colors hover:border-accent hover:text-accent"
                                        >
                                            <Icon />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    }
                />
            </section>

            {/* Introduction: scroll-driven statement + stack ticker */}
            <section id="intro" data-section data-free className="border-t border-line">
                <TextReveal text={STATEMENT} />
                <div className="grid gap-6 pb-24">
                    <Marquee
                        items={STACK_ROW_ONE.map((t) => (
                            <span key={t} className="outline-text text-[clamp(3rem,8vw,6rem)] font-bold leading-none tracking-[-0.04em]">{t}</span>
                        ))}
                    />
                    <Marquee
                        reverse
                        items={STACK_ROW_TWO.map((t) => (
                            <span key={t} className="outline-text text-[clamp(3rem,8vw,6rem)] font-bold leading-none tracking-[-0.04em]">{t}</span>
                        ))}
                    />
                </div>
            </section>

            {/* Selected work: parallax scroll columns */}
            <section id="work" data-section data-free className="overflow-hidden border-t border-line py-24">
                <div className="wrap grid gap-14">
                    <header className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <h2 className="h2">Selected work</h2>
                        <Link href="/projects" className="link">All projects</Link>
                    </header>
                    <div className="pb-32">
                        <ParallaxScroll items={workItems} />
                    </div>
                </div>
            </section>

            {/* How I build: sticky scroll reveal */}
            <section id="stack" data-section data-free className="border-t border-line">
                <StickyLayers layers={LAYERS} />
            </section>

            {/* Outcomes: bento */}
            <section id="outcomes" data-section className="section border-t border-line">
                <div className="wrap grid gap-12">
                    <h2 className="h2">Outcomes</h2>
                    <div className="grid gap-4 lg:grid-cols-6 lg:grid-rows-[auto_auto]">
                        <SpotlightCard className="p-8 lg:col-span-3 lg:row-span-2 lg:p-10">
                            <div className="grid content-between gap-10">
                                <p className="text-[clamp(5rem,12vw,9rem)] font-bold leading-[0.85] tracking-[-0.05em] text-accent">100%</p>
                                <div className="grid gap-2">
                                    <p className="text-2xl font-semibold tracking-tight">Lighthouse SEO 100, accessibility 98, LCP under 2.5 seconds</p>
                                    <p className="text-mute">ET GCO Tours: bilingual booking platform on Next.js 15 with Redis caching, SSR/SSG and Gzip.</p>
                                </div>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="p-8 lg:col-span-3">
                            <div className="grid content-between gap-6">
                                <p className="text-5xl font-bold tracking-[-0.04em]">Lighthouse 50 to 80+</p>
                                <p className="text-mute">Al Kayan v2.0 rebuild, measured on staging: strategic indexes and a file-based caching layer.</p>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="p-8 lg:col-span-2">
                            <div className="grid content-between gap-6">
                                <p className="text-3xl font-bold tracking-[-0.03em]">ERP over a private VPN</p>
                                <p className="text-mute">Rust and Tauri apps managing a WireGuard tunnel for Al Kayan&apos;s internal ERP.</p>
                            </div>
                        </SpotlightCard>

                        <Link href="/testimonials" className="panel group grid content-between gap-6 p-8 transition-colors hover:border-accent lg:col-span-1">
                            <span className="text-3xl font-bold tracking-[-0.03em]">All outcomes</span>
                            <HiMiniArrowRight className="text-2xl text-accent transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact */}
            <section id="contact" data-section className="section band-ink">
                <div className="wrap grid gap-12 lg:grid-cols-12 lg:items-start">
                    <div className="grid content-start gap-6 lg:col-span-5">
                        <h2 className="h2">Let&apos;s talk about your product.</h2>
                        <p className="lede">
                            Pick a time for a 30-minute call about a role, a technical challenge or a project.
                            A calendar invite and Google Meet link are sent automatically.
                        </p>
                        <div className="grid gap-3 sm:grid-flow-col sm:justify-start">
                            <Link href="/contact" className="btn btn-primary">Send a message</Link>
                            <button type="button" className="btn btn-quiet" onClick={() => setIsResumeOpen(true)}>
                                View CV
                            </button>
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <ScheduleForm />
                    </div>
                </div>
            </section>

            {isResumeOpen && <ResumeModal isOpen={isResumeOpen} onClose={() => setIsResumeOpen(false)} />}
        </>
    );
}
