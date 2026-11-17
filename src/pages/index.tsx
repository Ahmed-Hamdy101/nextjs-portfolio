import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { HiMiniArrowDownTray, HiMiniArrowRight, HiMiniChevronLeft, HiMiniChevronRight, HiMiniPlay } from "react-icons/hi2";
import { projects } from "@/lib/projects-data";
import { getLanguage, getStage } from "@/lib/project-meta";
import type { ParallaxItem } from "@/components/HeroParallax";
import HeroCarousel from "@/components/HeroCarousel";
import ProjectTrain from "@/components/ProjectTrain";
import StickyLayers, { Layer } from "@/components/StickyLayers";
import TrainReveal from "@/components/TrainReveal";
import PlanStudy from "@/components/PlanStudy";
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
    { id: "intro", label: "Intro" },
    { id: "work", label: "Work" },
    { id: "stack", label: "Stack" },
    { id: "reveal", label: "Reveal" },
    { id: "design", label: "Plan" },
    { id: "outcomes", label: "Outcomes" },
    { id: "contact", label: "Contact" },
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

const workItems = withImage.slice(0, 9).map((p) => ({ ...toItem(p), note: `${p.category} · ${getLanguage(p)} · ${getStage(p)}` }));
const heroCards = withImage.slice(0, 5).map((p) => ({ ...toItem(p), label: String(p.category) }));

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Person",
            "@id": `${SITE_ORIGIN}/#person`,
            name: "Ahmed Hamdy",
            alternateName: ["ahmedhamdy101", "Ahmed-Hamdy101"],
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
                title="Ahmed Hamdy (ahmedhamdy101) | Full Stack Engineer"
                description="Ahmed Hamdy is a full stack engineer in Giza, Egypt, shipping production web platforms with TypeScript, Node.js, Next.js and PostgreSQL. Open to full-time remote roles."
                path="/"
                structuredData={structuredData}
            />

            <SectionDots sections={SECTIONS} />

            {/* Overview: full-bleed 3D station, train arrives and departs */}
            <section id="overview" data-section data-free className="relative min-h-[calc(100svh-var(--header-h))]">
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-black/50 to-transparent" />

                <div className="wrap relative z-10 grid justify-items-center gap-4 pt-10 text-center md:pt-16">
                    <h1 className="max-w-4xl text-[clamp(2rem,5.2vw,4.5rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.01em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">
                        One engineer. The whole product.
                        <span className="mt-2 block text-[0.6em] tracking-[0.06em]">Live in production.</span>
                    </h1>
                </div>

                <div className="absolute bottom-28 left-0 z-10 grid max-w-md gap-4 px-6 md:left-8 md:px-0">
                    <p className="text-[0.9375rem] leading-snug text-white/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.6)]">
                        I&apos;m Ahmed Hamdy in Giza, Egypt. I ship production web platforms in TypeScript, Node.js, Next.js and PostgreSQL, and
                        I&apos;m open to full-time remote roles.
                    </p>
                    <div className="grid gap-2 sm:grid-flow-col sm:justify-start">
                        <Link href="/projects" className="btn btn-primary">See case studies</Link>
                        <button
                            type="button"
                            className="btn btn-quiet bg-black/55"
                            onClick={() => window.dispatchEvent(new CustomEvent("cinema", { detail: true }))}
                        >
                            <HiMiniPlay aria-hidden="true" />
                            Watch the reel
                        </button>
                        <button type="button" className="btn btn-quiet bg-black/55" onClick={() => setIsResumeOpen(true)}>
                            <HiMiniArrowDownTray aria-hidden="true" />
                            View CV
                        </button>
                    </div>
                </div>

                <a
                    href="#work"
                    className="absolute inset-x-0 bottom-28 z-10 mx-auto hidden w-max items-center gap-3 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-white md:flex [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]"
                >
                    <HiMiniChevronLeft aria-hidden="true" className="text-[#8fe8ff]" />
                    Scroll for projects
                    <HiMiniChevronRight aria-hidden="true" className="text-[#8fe8ff]" />
                </a>

                <div className="absolute bottom-28 right-28 z-10 hidden lg:block">
                    <HeroCarousel items={heroCards} />
                </div>
            </section>

            {/* Introduction: scroll-driven statement + stack ticker */}
            <section id="intro" data-section data-free className="border-t border-line bg-deep/80">
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

            {/* Selected work: projects as carriages that roll past as you scroll */}
            <ProjectTrain projects={workItems} />

            {/* How I build: sticky scroll reveal */}
            <section id="stack" data-section data-free className="border-t border-line">
                <StickyLayers layers={LAYERS} />
            </section>

            <TrainReveal />
            <PlanStudy />

            {/* Outcomes: bento */}
            <section id="outcomes" data-section className="section border-t border-line">
                <div className="wrap grid gap-12">
                    <h2 className="h2">Outcomes</h2>
                    <div className="grid gap-4 lg:grid-cols-6 lg:grid-rows-[auto_auto]">
                        <SpotlightCard className="p-8 lg:col-span-3 lg:row-span-2 lg:p-10">
                            <div className="grid content-between gap-10">
                                <p className="text-[clamp(5rem,12vw,9rem)] font-bold leading-[0.85] tracking--0.05em text-accent">100%</p>
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
