import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const CATEGORIES = [
    {
        id: "languages",
        title: "Languages",
        summary: "TypeScript first, PHP for Laravel, Rust for desktop tooling, Python for AI and finance work. Go is in progress.",
        skills: ["TypeScript", "JavaScript", "PHP", "SQL", "Python", "Rust", "Go (learning)"],
    },
    {
        id: "backend",
        title: "Backend",
        summary: "Typed REST APIs with token-based auth and role-based access control.",
        skills: ["Node.js", "Express", "Fastify", "Bun", "Laravel", "FastAPI", "Custom PHP MVC", "REST APIs", "JWT / OAuth2", "RBAC", "Event-driven design"],
    },
    {
        id: "frontend",
        title: "Frontend",
        summary: "Server-rendered React interfaces that stay fast and accessible.",
        skills: ["Next.js 15", "React", "Vite", "Tailwind CSS", "shadcn/ui", "Framer Motion", "GSAP", "i18next", "Accessibility (WCAG)"],
    },
    {
        id: "databases",
        title: "Databases",
        summary: "Relational schemas with strategic indexes, and Redis in front of hot reads.",
        skills: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Drizzle ORM", "Prisma", "Eloquent", "Redis"],
    },
    {
        id: "desktop",
        title: "Desktop",
        summary: "Windows apps: a Tauri hub and client managing a WireGuard tunnel, in production at Al Kayan.",
        skills: ["Tauri 2 (Rust)", "Electron", "WireGuard", "MSI installers"],
    },
    {
        id: "ai",
        title: "AI integration",
        summary: "Integration work: hosted and local models behind typed, rate-limited endpoints.",
        skills: ["OpenAI / Claude API integration", "Ollama (local LLMs)", "Fastify AI services", "Prompt design", "Forecasting and summaries"],
    },
    {
        id: "infra",
        title: "Infrastructure and testing",
        summary: "Production hosting, containers, pipelines and test suites.",
        skills: ["Docker", "Docker Compose", "NGINX", "GitHub Actions", "CircleCI", "Vercel", "DigitalOcean", "AWS (EC2, S3, RDS, Elastic Beanstalk)", "Linux", "Jest", "Jasmine", "PHPUnit"],
    },
    {
        id: "learning",
        title: "Currently learning",
        summary: "Where I'm spending study time right now.",
        skills: ["Go", "NestJS", "Rust services (Actix)"],
    },
] as const;

const SECTIONS: readonly DotSection[] = CATEGORIES.map(({ id, title }) => ({ id, label: title }));

export default function SkillsPage() {
    return (
        <>
            <SEOHead
                title="Skills | Ahmed Hamdy, Full-Stack Engineer"
                description="Technical skills of Ahmed Hamdy: TypeScript, Node.js, Next.js, Laravel, PostgreSQL, Redis, Docker, AWS and Rust/Tauri desktop tooling."
                path="/skills"
            />
            <SectionDots sections={SECTIONS} />

            <header className="wrap grid gap-4 pb-6 pt-16">
                <h1 className="h1">Skills</h1>
                <p className="lede">The stack behind the production platforms listed on this site.</p>
            </header>

            {CATEGORIES.map((category) => (
                <section
                    key={category.id}
                    id={category.id}
                    data-section
                    className="border-t border-line py-14 lg:grid lg:min-h-[45svh] lg:content-center"
                >
                    <div className="wrap grid gap-8 lg:grid-cols-12">
                        <div className="grid content-start gap-3 lg:col-span-4">
                            <h2 className="h2">{category.title}</h2>
                            <p className="muted">{category.summary}</p>
                        </div>
                        <ul className="grid content-start sm:grid-cols-2 lg:col-span-8 xl:grid-cols-3">
                            {category.skills.map((skill) => (
                                <li key={skill} className="border-t rule py-3 text-lg font-medium">{skill}</li>
                            ))}
                        </ul>
                    </div>
                </section>
            ))}
        </>
    );
}
