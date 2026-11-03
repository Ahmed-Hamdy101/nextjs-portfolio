import generated from "./performance-results.generated.json";

export interface PerformanceResult {
    site: string;
    tool: string;
    device?: "Mobile" | "Desktop";
    measuredOn?: string;
    scores: {
        performance?: number | string;
        accessibility?: number | string;
        bestPractices?: number | string;
        seo?: number | string;
    };
    metrics?: { label: string; value: string }[];
    note?: string;
}

/** Figures stated on the CV. Only numbers that were actually measured belong here. */
const REPORTED: Record<string, PerformanceResult[]> = {
    "egypt-tour-guide": [
        {
            site: "egypt-tour-guide.com",
            tool: "Lighthouse",
            scores: { seo: 100, accessibility: 98 },
            metrics: [{ label: "Largest Contentful Paint", value: "under 2.5 s" }],
            note: "Achieved with Redis caching, SSR/SSG and Gzip.",
        },
    ],
    "alkayan-nova": [
        {
            site: "v2.0 rebuild (staging)",
            tool: "Lighthouse",
            scores: { performance: "50 to 80+" },
            note: "Performance score before and after strategic indexes and a file-based caching layer.",
        },
    ],
};

/** Runs written by scripts/measure-performance.mjs. */
const GENERATED = generated as unknown as Record<string, PerformanceResult[]>;

export function getPerformance(slug?: string): PerformanceResult[] {
    if (!slug) return [];
    return [...(GENERATED[slug] ?? []), ...(REPORTED[slug] ?? [])];
}
