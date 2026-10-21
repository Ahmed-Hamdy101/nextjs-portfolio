import { motion, AnimatePresence, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef } from "react";
import {
    HiMiniArrowTopRightOnSquare,
    HiMiniXMark,
    HiMiniChevronLeft,
    HiMiniChevronRight,
    HiMiniCodeBracket,
} from "react-icons/hi2";
import SEOHead from "@/components/SEOHead";
import { projects, filters, statusConfig, Project, FilterType } from "@/lib/projects-data";

// ─── Lightbox ──────────────────────────────────────────────────────────────
export interface LightboxProps {
    images: string[];
    title: string;
    startIndex: number;
    onClose: () => void;
}

export const Lightbox = ({ images, title, startIndex, onClose }: LightboxProps) => {
    const [current, setCurrent] = useState(startIndex);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] grid grid-rows-[auto_1fr_auto] gap-4 bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} gallery`}
            onClick={onClose}
        >
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 text-ink">
                <p className="text-sm">{title} · {current + 1} of {images.length}</p>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close gallery"
                    className="grid size-10 place-items-center rounded-md border border-line text-ink hover:border-accent"
                >
                    <HiMiniXMark className="text-lg" />
                </button>
            </div>

            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {images.length > 1 ? (
                    <button type="button" onClick={prev} aria-label="Previous image" className="grid size-11 place-items-center rounded-md border border-line text-ink hover:border-accent">
                        <HiMiniChevronLeft className="text-xl" />
                    </button>
                ) : <span />}
                <div className="relative grid h-full min-h-0 place-items-center">
                    <Image
                        src={images[current]}
                        alt={`${title} screenshot ${current + 1}`}
                        width={1400}
                        height={900}
                        className="max-h-[72vh] w-auto rounded-md object-contain"
                        priority
                        unoptimized
                    />
                </div>
                {images.length > 1 ? (
                    <button type="button" onClick={next} aria-label="Next image" className="grid size-11 place-items-center rounded-md border border-line text-ink hover:border-accent">
                        <HiMiniChevronRight className="text-xl" />
                    </button>
                ) : <span />}
            </div>

            {images.length > 1 ? (
                <div className="grid grid-flow-col auto-cols-max justify-center gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
                    {images.map((img, i) => (
                        <button
                            key={img}
                            type="button"
                            aria-label={`Show image ${i + 1}`}
                            aria-current={i === current ? "true" : undefined}
                            onClick={() => setCurrent(i)}
                            className={`relative h-10 w-16 overflow-hidden rounded border-2 ${i === current ? "border-accent" : "border-transparent opacity-50 hover:opacity-90"}`}
                        >
                            <Image src={img} alt="" fill className="object-cover" unoptimized />
                        </button>
                    ))}
                </div>
            ) : <span />}
        </motion.div>
    );
};

// ─── Project card ──────────────────────────────────────────────────────────
interface CardProps {
    project: Project;
    onOpenLightbox: (project: Project, i: number) => void;
}

const ProjectCard = ({ project, onOpenLightbox }: CardProps) => {
    const hasImages = project.images.length > 0;
    const isLiveLink = project.link !== "#" && !project.link.includes("github");
    const isGithubLink = !isLiveLink && project.link.includes("github");
    const isLive = project.status === "Live";
    const Icon = project.Icon;

    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const imageY = useTransform(scrollYProgress, [0, 1], ["-9%", "9%"]);

    const tiltX = useMotionValue(0);
    const tiltY = useMotionValue(0);
    const rotateX = useSpring(tiltX, { stiffness: 160, damping: 20 });
    const rotateY = useSpring(tiltY, { stiffness: 160, damping: 20 });

    const onMove = (e: React.MouseEvent<HTMLElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        tiltY.set(((e.clientX - box.left) / box.width - 0.5) * 9);
        tiltX.set(-((e.clientY - box.top) / box.height - 0.5) * 9);
    };
    const onLeave = () => {
        tiltX.set(0);
        tiltY.set(0);
    };

    const preview = (
        <div className="relative aspect-[16/10] overflow-hidden bg-paper">
            {hasImages ? (
                <motion.div style={{ y: imageY, scale: 1.2 }} className="absolute inset-0">
                    <Image
                        src={project.previewImage}
                        alt={`${project.title} preview`}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        unoptimized
                    />
                </motion.div>
            ) : (
                <div className="grid size-full place-items-center text-mute">
                    <Icon className="text-6xl opacity-40" aria-hidden="true" />
                </div>
            )}
        </div>
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ perspective: 900 }}
        >
        <motion.article
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="panel grid grid-rows-[auto_1fr] overflow-hidden"
        >
            {project.slug ? (
                <Link href={`/projects/${project.slug}`} aria-label={`${project.title} case study`}>{preview}</Link>
            ) : hasImages ? (
                <button type="button" onClick={() => onOpenLightbox(project, 0)} aria-label={`Open ${project.title} gallery`} className="block text-left">
                    {preview}
                </button>
            ) : (
                preview
            )}

            <div className="grid content-start gap-3 p-5" style={{ transform: "translateZ(28px)" }}>
                <h3 className="h3">{project.title}</h3>
                <p className="muted line-clamp-3">{project.description}</p>
                <p className="meta grid grid-flow-col justify-start gap-2">
                    {isLive && <span className="mt-[0.55rem] size-1.5 rounded-full bg-accent" aria-hidden="true" />}
                    <span>{statusConfig[project.status].label} · {project.category} · {project.year} · {project.tech.slice(0, 4).join(", ")}</span>
                </p>

                <div className="mt-1 grid grid-flow-col justify-start gap-5 border-t rule pt-4 text-[0.9375rem]">
                    {project.slug && <Link href={`/projects/${project.slug}`} className="link">Case study</Link>}
                    {isLiveLink && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="link icon-link">
                            <HiMiniArrowTopRightOnSquare aria-hidden="true" /> Live site
                        </a>
                    )}
                    {isGithubLink && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className="link icon-link">
                            <HiMiniCodeBracket aria-hidden="true" /> GitHub
                        </a>
                    )}
                    {project.githubLink && (
                        <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="link icon-link">
                            <HiMiniCodeBracket aria-hidden="true" /> Source
                        </a>
                    )}
                    {hasImages && !project.slug && (
                        <button type="button" onClick={() => onOpenLightbox(project, 0)} className="link">Gallery</button>
                    )}
                </div>
            </div>
        </motion.article>
        </motion.div>
    );
};

// ─── Page ──────────────────────────────────────────────────────────────────
const ProjectsPage = () => {
    const [activeFilter, setActiveFilter] = useState<FilterType>("All");
    const [lightbox, setLightbox] = useState<{ project: Project; index: number } | null>(null);

    const filtered = activeFilter === "All" ? projects : projects.filter((p) => p.status === activeFilter);
    const openLightbox = useCallback((project: Project, index = 0) => {
        if (project.images.length > 0) setLightbox({ project, index });
    }, []);

    return (
        <>
            <SEOHead
                title="Projects | Ahmed Hamdy, Full-Stack Engineer"
                description="Systems shipped to production by Ahmed Hamdy: SaaS platforms, tourism apps, ERPs and AI-powered tools built with Next.js, Laravel, Bun and AWS."
                path="/projects"
            />

            <div className="wrap grid gap-10 pb-24 pt-16">
                <header className="grid gap-4">
                    <h1 className="h1">Projects</h1>
                    <p className="lede">
                        {projects.length} systems shipped to production or in active development, built with Next.js,
                        Laravel, Bun and AWS.
                    </p>
                </header>

                <div role="group" aria-label="Filter projects by status" className="flex flex-wrap gap-2">
                    {filters.map((filter) => {
                        const count = filter === "All" ? projects.length : projects.filter((p) => p.status === filter).length;
                        const selected = activeFilter === filter;
                        return (
                            <button
                                key={filter}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setActiveFilter(filter)}
                                className={`min-h-10 rounded-md border px-4 text-sm font-medium transition-colors ${
                                    selected
                                        ? "border-accent bg-accent-wash text-accent-deep"
                                        : "border-line text-mute hover:border-accent hover:text-accent"
                                }`}
                            >
                                {statusConfig[filter].label} ({count})
                            </button>
                        );
                    })}
                </div>

                <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                        {filtered.map((project) => (
                            <ProjectCard key={project.title} project={project} onOpenLightbox={openLightbox} />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filtered.length === 0 && <p className="muted py-16 text-center">No projects match this filter.</p>}
            </div>

            <AnimatePresence>
                {lightbox && (
                    <Lightbox
                        images={lightbox.project.images}
                        title={lightbox.project.title}
                        startIndex={lightbox.index}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default ProjectsPage;
