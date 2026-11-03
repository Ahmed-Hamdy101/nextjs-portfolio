import type { PerformanceResult } from "@/lib/performance-results";

const LABELS: [keyof PerformanceResult["scores"], string][] = [
    ["performance", "Performance"],
    ["accessibility", "Accessibility"],
    ["bestPractices", "Best practices"],
    ["seo", "SEO"],
];

export default function PerformanceBlock({ results }: { results: PerformanceResult[] }) {
    return (
        <div className="grid gap-10">
            {results.map((result, i) => {
                const rows = [
                    ...LABELS.filter(([key]) => result.scores[key] !== undefined).map(([key, label]) => ({
                        label,
                        value: String(result.scores[key]),
                    })),
                    ...(result.metrics ?? []),
                ];

                return (
                    <article key={`${result.site}-${i}`} className="grid gap-4">
                        <p className="meta">
                            {result.tool}
                            {result.device ? ` · ${result.device}` : ""} · {result.site}
                            {result.measuredOn ? ` · measured ${result.measuredOn}` : ""}
                        </p>
                        <dl className="grid">
                            {rows.map(({ label, value }) => (
                                <div key={label} className="grid gap-1 border-t rule py-4 last:border-b sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8">
                                    <dt className="muted">{label}</dt>
                                    <dd className="text-3xl font-bold tracking-[-0.03em] text-accent">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {result.note && <p className="muted max-w-2xl">{result.note}</p>}
                    </article>
                );
            })}
        </div>
    );
}
