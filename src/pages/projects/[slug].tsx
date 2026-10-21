import { useMemo } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { HiMiniArrowLeft, HiMiniArrowTopRightOnSquare, HiMiniCodeBracket } from "react-icons/hi2";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import DiagramViewer from "@/components/DiagramViewer";
import SectionDots, { DotSection } from "@/components/SectionDots";
import SEOHead from "@/components/SEOHead";
import { projects, statusConfig, Project } from "@/lib/projects-data";

interface Props {
    slug: string;
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = projects.filter((p) => p.slug).map((p) => ({ params: { slug: p.slug as string } }));
    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
    const slug = params?.slug as string;
    if (!projects.some((p) => p.slug === slug)) return { notFound: true };
    return { props: { slug } };
};

const BulletList = ({ items }: { items: string[] }) => (
    <ul className="grid gap-3">
        {items.map((item) => (
            <li key={item} className="grid grid-cols-[0.5rem_1fr] items-start gap-3 muted">
                <span className="mt-[0.6rem] size-1.5 rounded-full bg-accent" aria-hidden="true" />
                <span>{item}</span>
            </li>
        ))}
    </ul>
);

export default function ProjectDetailPage({ slug }: Props) {
    const project = projects.find((p) => p.slug === slug) as Project | undefined;
    const caseStudy = project?.caseStudy;
    const hasResults = Boolean(caseStudy?.results);

    const sections = useMemo<readonly DotSection[]>(
        () => [
            { id: "overview", label: "Overview" },
            { id: "problem", label: "The problem" },
            { id: "approach", label: "My role" },
            { id: "architecture", label: "Architecture" },
            { id: "security", label: "Security and deployment" },
            ...(hasResults ? [{ id: "results", label: "Results" }] : []),
        ],
        [hasResults]
    );

    if (!project || !caseStudy) return null;

    const status = statusConfig[project.status];
    const isLiveLink = project.link !== "#" && !project.link.includes("github");
    const repoLink = project.githubLink ?? (project.link.includes("github") ? project.link : null);
    const otherProjects = projects.filter((p) => p.slug && p.slug !== project.slug).slice(0, 3);

    const apiLayers =
        project.slug === "typescript-ai-api"
            ? ["Client app", "Fastify REST API (TypeScript)", "OpenAI API"]
            : project.slug === "aws-fullstack-deployment"
                ? ["Client", "Node.js / Express (TypeScript)", "AWS Elastic Beanstalk", "RDS PostgreSQL and S3"]
                : ["Client / admin panel", "Laravel REST API with Passport (OAuth2/JWT)", "MySQL"];

    return (
        <>
            <SEOHead
                title={`${project.title} | Case study, Ahmed Hamdy`}
                description={project.description}
                path={`/projects/${project.slug}`}
                image={project.previewImage || undefined}
                type="article"
            />
            <SectionDots sections={sections} />

            {/* Overview */}
            <section id="overview" data-section className="py-14">
                <div className="wrap grid gap-8">
                    <Link href="/projects" className="icon-link link">
                        <HiMiniArrowLeft aria-hidden="true" /> All projects
                    </Link>

                    <header className="grid gap-5">
                        <h1 className="h1 max-w-4xl">{project.title}</h1>
                        <p className="lede">{project.description}</p>
                        <p className="meta">{status.label} · {project.category} · {project.year}</p>
                        <p className="font-medium">{project.tech.join(", ")}</p>
                        <div className="grid gap-3 sm:grid-flow-col sm:justify-start">
                            {isLiveLink && (
                                <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    <HiMiniArrowTopRightOnSquare aria-hidden="true" /> View live site
                                </a>
                            )}
                            {repoLink && (
                                <a href={repoLink} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">
                                    <HiMiniCodeBracket aria-hidden="true" /> Source on GitHub
                                </a>
                            )}
                            <a href="#architecture" className="btn btn-quiet">View architecture</a>
                        </div>
                    </header>

                    {project.images.length > 0 && (
                        <ul className="grid gap-4 sm:grid-cols-2">
                            {project.images.map((img, i) => (
                                <li key={img}>
                                    <a
                                        href={img}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative block aspect-video overflow-hidden rounded-lg border border-line"
                                    >
                                        <Image src={img} alt={`${project.title} screenshot ${i + 1}`} fill className="object-cover" unoptimized />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* Problem */}
            <section id="problem" data-section className="border-t border-line py-14 lg:grid lg:min-h-[45svh] lg:content-center">
                <div className="wrap grid gap-6 lg:grid-cols-12 lg:gap-10">
                    <h2 className="h2 lg:col-span-4">The problem</h2>
                    <p className="muted max-w-3xl lg:col-span-8">{caseStudy.problem}</p>
                </div>
            </section>

            {/* Role and workflows */}
            <section id="approach" data-section className="border-t border-line py-14 lg:grid lg:min-h-[45svh] lg:content-center">
                <div className="wrap grid gap-8 lg:grid-cols-12 lg:gap-10">
                    <h2 className="h2 lg:col-span-4">My role</h2>
                    <div className="grid gap-8 md:grid-cols-2 lg:col-span-8">
                        <div className="grid content-start gap-3">
                            <h3 className="h3">Responsibilities</h3>
                            <p className="muted">{caseStudy.responsibilities}</p>
                        </div>
                        <div className="grid content-start gap-3">
                            <h3 className="h3">Main workflows</h3>
                            <ol className="grid gap-3">
                                {caseStudy.workflows.map((w, i) => (
                                    <li key={w} className="grid grid-cols-[1.5rem_1fr] items-start gap-2 muted">
                                        <span className="font-semibold text-accent">{i + 1}.</span>
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section id="architecture" data-section className="border-t border-line py-14">
                <div className="wrap grid gap-8">
                    <h2 className="h2">Architecture</h2>
                    {caseStudy.diagrams && caseStudy.diagrams.length > 0 ? (
                        <DiagramViewer diagrams={caseStudy.diagrams} />
                    ) : caseStudy.apiOnly ? (
                        <div className="panel">
                            <ArchitectureDiagram layers={apiLayers} />
                            <p className="meta px-6 pb-6 text-center">
                                Backend API service with no UI to screenshot. See the source for endpoint documentation.
                            </p>
                        </div>
                    ) : null}
                    <div className="max-w-3xl">
                        <BulletList items={caseStudy.architecture} />
                    </div>
                </div>
            </section>

            {/* Security */}
            <section id="security" data-section className="border-t border-line py-14 lg:grid lg:min-h-[45svh] lg:content-center">
                <div className="wrap grid gap-6 lg:grid-cols-12 lg:gap-10">
                    <h2 className="h2 lg:col-span-4">Security and deployment</h2>
                    <div className="lg:col-span-8">
                        <BulletList items={caseStudy.security} />
                    </div>
                </div>
            </section>

            {/* Results */}
            {hasResults && (
                <section id="results" data-section className="border-t border-line py-14 lg:grid lg:min-h-[45svh] lg:content-center">
                    <div className="wrap grid gap-6 lg:grid-cols-12 lg:gap-10">
                        <h2 className="h2 lg:col-span-4">Results</h2>
                        <p className="max-w-3xl border-l-2 border-accent pl-5 text-xl font-medium leading-snug lg:col-span-8">
                            {caseStudy.results}
                        </p>
                    </div>
                </section>
            )}

            {otherProjects.length > 0 && (
                <section className="band-ink py-14">
                    <div className="wrap grid gap-6">
                        <h2 className="h3">More case studies</h2>
                        <ul className="grid gap-4 sm:grid-cols-3">
                            {otherProjects.map((p) => (
                                <li key={p.slug}>
                                    <Link
                                        href={`/projects/${p.slug}`}
                                        className="grid h-full gap-1 rounded-md border border-line p-4 transition-colors hover:border-accent"
                                    >
                                        <span className="font-semibold">{p.title}</span>
                                        <span className="meta">{p.category} · {p.year}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </>
    );
}
