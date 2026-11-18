import type { IconType } from "react-icons";

export type FilterType = "All" | "Live" | "In Progress (private)" | "Planned" | "Live -- Alkayan Nova in Progress" | "Graduation";

export interface CaseStudy {
    /** 1. The business problem */
    problem: string;
    /** 2. Your responsibilities */
    responsibilities: string;
    /** 4. Main workflows (technologies used = project.tech, already shown in the hero) */
    workflows: string[];
    /** 5. Architecture decisions */
    architecture: string[];
    /** 6. Security and deployment considerations */
    security: string[];
    /** 7. Results, if disclosed — omit the section entirely when not public */
    results?: string;
    /** true = no real screenshots exist yet, render an architecture diagram instead of a gallery */
    apiOnly?: boolean;
    /** Real architecture/ER/sequence diagrams exported as SVG — shown in a tabbed viewer when present */
    diagrams?: { label: string; src: string }[];
}

export interface Project {
    title: string;
    description: string;
    tech: string[];
    link: string;
    /** Optional second link — shown alongside `link` when a project has BOTH a live site and a public repo */
    githubLink?: string;
    Icon: IconType;
    color: string;
    accent: string;
    accentRgb: string;
    status: FilterType;
    images: string[];
    previewImage: string;
    year: string;
    category: string;
    /** What this project is to the system around it; shown instead of the category on grouped cards */
    role?: string;
    /** Overrides the language detected from `tech` (for polyglot projects) */
    language?: string;
    /** Last meaningful change to the project, ISO date (YYYY-MM-DD) */
    updated?: string;
    /** Illustrative cover art for projects without screenshots. Not a product screenshot. */
    cover?: string;
    /** Present only on the featured projects that get a dedicated /projects/[slug] case-study page */
    slug?: string;
    caseStudy?: CaseStudy;
}
export interface ProjectGroup {
    id: string;
    title: string;
    summary: string;
    /** Project titles in display order */
    titles: string[];
    /** Render the first project as a full-width feature */
    featured?: boolean;
}

export interface ResolvedProjectGroup extends Omit<ProjectGroup, "titles"> {
    projects: Project[];
}

/** Group with its member projects resolved at runtime. */
export type ProjectGroupWithProjects = ResolvedProjectGroup;

/** Minimal shape shared by cards, carousels and the train. */
export type ProjectCard = Pick<Project, "title" | "description" | "previewImage" | "category" | "status" | "slug">;
