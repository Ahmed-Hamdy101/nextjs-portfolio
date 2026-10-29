import type { Project } from "./projects-data";

const LANGUAGES: Record<string, string> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    php: "PHP",
    python: "Python",
    rust: "Rust",
    kotlin: "Kotlin",
    go: "Go",
};

const FRAMEWORKS: Record<string, string> = {
    laravel: "PHP",
    livewire: "PHP",
    flask: "Python",
    fastapi: "Python",
    tauri: "Rust",
    nestjs: "TypeScript",
    fastify: "TypeScript",
    bun: "TypeScript",
    "next.js": "TypeScript",
    "node.js": "JavaScript",
    express: "JavaScript",
    react: "JavaScript",
    electron: "JavaScript",
    "three.js": "JavaScript",
};

const normalize = (tech: string) => tech.toLowerCase().replace(/\s+\d[\d.]*$/, "").trim();

/** Main programming language: a named language in the tech list wins, otherwise the first framework that implies one. */
export function getLanguage(project: Pick<Project, "tech">): string {
    const names = project.tech.map(normalize);
    for (const name of names) if (LANGUAGES[name]) return LANGUAGES[name];
    for (const name of names) if (FRAMEWORKS[name]) return FRAMEWORKS[name];
    return "TypeScript";
}

export type Stage = "Production" | "Development";

export function getStage(project: Pick<Project, "status">): Stage {
    return project.status === "Live" || project.status.startsWith("Live --") ? "Production" : "Development";
}
