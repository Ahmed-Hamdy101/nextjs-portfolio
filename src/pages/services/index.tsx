import Link from "next/link";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const SERVICES = [
    {
        title: "ERP systems",
        tagline: "Enterprise resource planning",
        description:
            "Platforms tailored to your business workflows, from inventory and invoicing to live dashboards, built with Laravel, Next.js and PostgreSQL.",
        stack: ["Laravel", "Next.js", "PostgreSQL", "Dashboards"],
    },
    {
        title: "Cloud architecture",
        tagline: "Scalable infrastructure",
        description:
            "Production infrastructure on AWS and DigitalOcean with automated CI/CD, Docker containers, NGINX reverse proxies and zero-downtime deployments.",
        stack: ["AWS EC2/S3", "Docker", "NGINX", "CI/CD"],
    },
    {
        title: "Full-stack web apps",
        tagline: "End-to-end engineering",
        description:
            "React and Next.js front ends paired with Bun/Fastify or Node.js/Express APIs, optimised for speed and built to scale.",
        stack: ["Next.js", "Bun", "Fastify", "Tailwind"],
    },
    {
        title: "SaaS platforms",
        tagline: "Software as a service",
        description:
            "Multi-tenant architecture, role-based access control, billing integration and deployment strategies that scale with your customers.",
        stack: ["Multi-tenant", "Auth", "Billing", "Next.js"],
    },
    {
        title: "DevOps and automation",
        tagline: "Infrastructure and pipelines",
        description:
            "CI/CD pipelines, server hardening and monitoring across your development lifecycle. Less downtime, faster releases.",
        stack: ["GitHub Actions", "Docker", "Linux", "SSH"],
    },
    {
        title: "Legacy modernisation",
        tagline: "Legacy to modern",
        description:
            "Migrating older systems and codebases to modern architectures, with performance audits, SEO work and UI/UX redesigns.",
        stack: ["Migration", "Performance", "SEO", "UI/UX"],
    },
];

const PROCESS = [
    { title: "Discovery", desc: "We go through your goals, stack and constraints." },
    { title: "Architecture", desc: "I design the system blueprint before writing code." },
    { title: "Build", desc: "Iterative development with regular reviews and demos." },
    { title: "Deploy", desc: "Production launch with CI/CD and monitoring in place." },
];

const SECTIONS: readonly DotSection[] = [
    { id: "services", label: "Services" },
    { id: "process", label: "Process" },
    { id: "start", label: "Start a project" },
];

export default function ServicesPage() {
    return (
        <>
            <SEOHead
                title="Services | Ahmed Hamdy, Full-Stack Engineer"
                description="Software engineering services from Ahmed Hamdy: ERP systems, cloud architecture, full-stack web apps, SaaS platforms and DevOps."
                path="/services"
            />
            <SectionDots sections={SECTIONS} />

            <section id="services" data-section className="section">
                <div className="wrap grid gap-10">
                    <header className="grid gap-4">
                        <h1 className="h1">Services</h1>
                        <p className="lede">End-to-end software engineering, from architecture to deployment.</p>
                    </header>
                    <div className="grid">
                        {SERVICES.map((service) => (
                            <article key={service.title} className="grid gap-3 border-t rule py-6 last:border-b lg:grid-cols-12 lg:gap-10">
                                <h2 className="h3 lg:col-span-4">{service.title}</h2>
                                <p className="muted lg:col-span-5">{service.description}</p>
                                <p className="meta lg:col-span-3">{service.stack.join(", ")}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="process" data-section className="section border-t border-line">
                <div className="wrap grid gap-10">
                    <h2 className="h2">How I work</h2>
                    <ol className="grid gap-8 md:grid-cols-4">
                        {PROCESS.map((phase, i) => (
                            <li key={phase.title} className="grid content-start gap-2 border-t-2 border-accent pt-4">
                                <p className="meta">Step {i + 1}</p>
                                <h3 className="h3">{phase.title}</h3>
                                <p className="muted">{phase.desc}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="start" data-section className="section band-ink">
                <div className="wrap grid gap-6 justify-items-start">
                    <h2 className="h2 max-w-2xl">Ready to start your project?</h2>
                    <p className="lede">Tell me what you&apos;re building and where it&apos;s stuck.</p>
                    <div className="grid gap-3 sm:grid-flow-col">
                        <Link href="/contact" className="btn btn-primary">Send a message</Link>
                        <Link href="/schedule" className="btn btn-quiet">Book a call</Link>
                    </div>
                </div>
            </section>
        </>
    );
}
