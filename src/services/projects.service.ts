import { filters, getProjectGroups, matchesFilter, projects, statusConfig } from "@/data/projects";
import type { FilterType, Project, ResolvedProjectGroup } from "@/types/project";

/**
 * Read model for the project catalog.
 *
 * Pages depend on this service rather than on the raw data module, so the
 * catalog can later move behind an API or CMS without touching components.
 */
export const projectsService = {
    all: (): Project[] => projects,

    withPreview: (): Project[] => projects.filter((project) => Boolean(project.previewImage)),

    bySlug: (slug: string): Project | null => projects.find((project) => project.slug === slug) ?? null,

    groups: (): ResolvedProjectGroup[] => getProjectGroups(),

    filters,
    statusConfig,

    matches: (project: Project, filter: FilterType): boolean => matchesFilter(project, filter),
};

export type ProjectsService = typeof projectsService;
