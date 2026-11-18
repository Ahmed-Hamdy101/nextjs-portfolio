interface ArchitectureDiagramProps {
    /** Ordered top-to-bottom layers, e.g. ["Client", "Fastify API", "OpenAI API"] */
    layers: string[];
    accent?: string;
}

/**
 * Dependency-free layer diagram for API-only projects with no UI screenshots.
 * Layers stack top to bottom and are joined by a vertical rule.
 */
const ArchitectureDiagram = ({ layers }: ArchitectureDiagramProps) => (
    <ol className="mx-auto grid w-full max-w-sm justify-items-center gap-0 px-6 py-10">
        {layers.map((layer, i) => (
            <li key={layer} className="grid w-full justify-items-center">
                <span className="w-full rounded-md border border-line bg-sheet px-5 py-3 text-center font-medium">
                    {layer}
                </span>
                {i < layers.length - 1 && <span className="h-6 w-px bg-accent" aria-hidden="true" />}
            </li>
        ))}
    </ol>
);

export default ArchitectureDiagram;
