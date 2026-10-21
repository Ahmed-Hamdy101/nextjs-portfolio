import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";

const CATEGORIES = [
    {
        id: "frontend",
        title: "Frontend",
        summary: "Interfaces that load fast, stay accessible and hold up on mobile.",
        skills: ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "shadcn/ui", "Magic UI", "GSAP", "HTML and CSS", "UX and UI design", "GIS maps"],
    },
    {
        id: "backend",
        title: "Backend and data",
        summary: "Typed APIs, relational data models and the caching in front of them.",
        skills: ["Node.js", "Bun", "Express", "Fastify", "PHP and Laravel", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Drizzle", "Prisma", "Jest", "Jasmine", "Python", "Go"],
    },
    {
        id: "cms",
        title: "CMS and commerce",
        summary: "Content platforms and storefronts, tuned for search and speed.",
        skills: ["WordPress", "WooCommerce", "Swagger / OpenAPI", "NGINX"],
    },
    {
        id: "devops",
        title: "Cloud and delivery",
        summary: "Production hosting, containers and pipelines.",
        skills: ["AWS (EC2, S3, RDS)", "DigitalOcean", "Oracle Cloud", "Docker", "Linux and SSH", "Git and CI/CD", "GitHub", "Vercel", "Decoupled architecture", "Namecheap", "GoDaddy"],
    },
    {
        id: "tools",
        title: "Design and tooling",
        summary: "Design software and desktop toolchains used alongside the web stack.",
        skills: ["Figma", "Adobe XD", "Adobe Illustrator", "Adobe Photoshop", "Qt and C++", "Visual Studio and C#", "VS Code"],
    },
] as const;

const SECTIONS: readonly DotSection[] = CATEGORIES.map(({ id, title }) => ({ id, label: title }));

export default function SkillsPage() {
    return (
        <>
            <SEOHead
                title="Skills | Ahmed Hamdy, Full-Stack Engineer"
                description="Technical skills of Ahmed Hamdy across frontend, backend, data, cloud and delivery, built over 5+ years of production work."
                path="/skills"
            />
            <SectionDots sections={SECTIONS} />

            <header className="wrap grid gap-4 pb-6 pt-16">
                <h1 className="h1">Skills</h1>
                <p className="lede">Five years of shipping production systems across the full stack.</p>
            </header>

            {CATEGORIES.map((category) => (
                <section
                    key={category.id}
                    id={category.id}
                    data-section
                    className="border-t border-line py-14 lg:min-h-[55svh] lg:content-center lg:grid"
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
