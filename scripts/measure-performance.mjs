// Runs Lighthouse (mobile) against live sites and writes src/lib/performance-results.generated.json.
// Usage: bun run perf   (needs Chrome installed; the first run downloads lighthouse through npx)
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUNS = 3;
const OUTPUT = new URL("../src/lib/performance-results.generated.json", import.meta.url);

// Case-study slug -> live URL. Add a line when another project goes live.
const TARGETS = {
    "egypt-tour-guide": "https://www.egypt-tour-guide.com/",
    "alkayan-nova": "https://www.alkayan-co.com/",
};
const EXTRA = { portfolio: "https://ahmedhamdy101.is-a.dev/" };

const pct = (score) => (typeof score === "number" ? Math.round(score * 100) : undefined);

function runOnce(url) {
    const dir = mkdtempSync(join(tmpdir(), "lh-"));
    const file = join(dir, "report.json");
    try {
        execFileSync(
            "npx",
            [
                "--yes", "lighthouse", url,
                "--output=json", `--output-path=${file}`,
                "--only-categories=performance,accessibility,best-practices,seo",
                "--form-factor=mobile", "--quiet",
                "--chrome-flags=--headless=new",
            ],
            { stdio: "ignore", shell: process.platform === "win32" }
        );
        return JSON.parse(readFileSync(file, "utf8"));
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

function measure(url) {
    const runs = [];
    for (let i = 0; i < RUNS; i += 1) {
        console.log(`  run ${i + 1}/${RUNS}`);
        runs.push(runOnce(url));
    }
    runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
    const median = runs[Math.floor(runs.length / 2)];
    const audit = (id) => median.audits[id]?.displayValue;

    return {
        site: new URL(url).hostname.replace(/^www\./, ""),
        tool: "Lighthouse",
        device: "Mobile",
        measuredOn: new Date().toISOString().slice(0, 10),
        scores: {
            performance: pct(median.categories.performance.score),
            accessibility: pct(median.categories.accessibility.score),
            bestPractices: pct(median.categories["best-practices"].score),
            seo: pct(median.categories.seo.score),
        },
        metrics: [
            { label: "Largest Contentful Paint", value: audit("largest-contentful-paint") },
            { label: "Total Blocking Time", value: audit("total-blocking-time") },
            { label: "Cumulative Layout Shift", value: audit("cumulative-layout-shift") },
        ].filter((m) => m.value),
        note: `Median of ${RUNS} runs.`,
    };
}

const output = {};
for (const [slug, url] of Object.entries(TARGETS)) {
    console.log(`${slug}: ${url}`);
    try {
        output[slug] = [measure(url)];
    } catch (error) {
        console.error(`  failed: ${error.message}`);
    }
}
writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");

for (const [name, url] of Object.entries(EXTRA)) {
    console.log(`${name}: ${url}`);
    try {
        console.log(JSON.stringify(measure(url).scores));
    } catch (error) {
        console.error(`  failed: ${error.message}`);
    }
}
console.log("Done. Restart the dev server or rebuild to show the new numbers.");
