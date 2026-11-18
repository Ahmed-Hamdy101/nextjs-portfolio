"use client";

import { useState } from "react";

interface DiagramItem {
    label: string;
    src: string;
}

interface DiagramViewerProps {
    diagrams: DiagramItem[];
    accent?: string;
}

export default function DiagramViewer({ diagrams }: DiagramViewerProps) {
    const [active, setActive] = useState(0);

    if (!diagrams.length) return null;
    const current = diagrams[active];

    return (
        <div className="panel overflow-hidden">
            <div role="tablist" aria-label="Diagrams" className="flex flex-wrap gap-2 border-b rule p-4">
                {diagrams.map((d, i) => (
                    <button
                        key={d.src}
                        type="button"
                        role="tab"
                        aria-selected={i === active}
                        onClick={() => setActive(i)}
                        className={`min-h-9 rounded-md border px-3.5 text-sm font-medium transition-colors ${
                            i === active
                                ? "border-accent bg-accent-wash text-accent-deep"
                                : "border-line text-mute hover:border-accent hover:text-accent"
                        }`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            <a
                href={current.src}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-h-[70vh] overflow-auto bg-black/40 p-6 sm:p-10"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.src} alt={current.label} className="mx-auto h-auto w-full" />
            </a>

            <p className="meta px-6 py-4 text-center">Select the diagram to open it full size.</p>
        </div>
    );
}
