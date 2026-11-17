import { ReactNode, useEffect, useRef, useState } from "react";
import { MotionValue, motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { sound } from "@/lib/sound";

type Range = [number, number];

const R = {
    boundary: [0.02, 0.18] as Range,
    structure: [0.16, 0.34] as Range,
    partitions: [0.32, 0.48] as Range,
    openings: [0.46, 0.64] as Range,
    furniture: [0.62, 0.82] as Range,
    notes: [0.8, 0.94] as Range,
    markers: [0.9, 1] as Range,
};

const OUTER =
    "M60 130H1140a20 20 0 0 1 20 20V290a20 20 0 0 1-20 20H60a20 20 0 0 1-20-20V150a20 20 0 0 1 20-20Z";
const INNER = "M62 148H1138V292H62Z";

const PILLARS = [335, 455, 575, 695, 815]
    .map((x) => `M${x} 148h10v10h-10zM${x} 282h10v10h-10z`)
    .join("");
const BULKHEADS = "M62 148V292M72 148V292M1138 148V292M1128 148V292";
const PARTITIONS = "M210 148V195M210 245V292M990 148V195M990 245V292";

const DOORS_LEAF = "M112 148V208M112 292V232M1088 148V208M1088 292V232";
const DOORS_SWING =
    "M112 208A60 60 0 0 0 172 148M112 232A60 60 0 0 1 172 292M1088 208A60 60 0 0 1 1028 148M1088 232A60 60 0 0 0 1028 292";
const DOORS_JAMBS = "M112 130V148M172 130V148M112 292V310M172 292V310M1028 130V148M1088 130V148M1028 292V310M1088 292V310";
const WINDOWS = Array.from({ length: 6 }, (_, i) => {
    const a = 230 + i * 120;
    const b = a + 100;
    return `M${a} 136H${b}M${a} 142H${b}M${a} 298H${b}M${a} 304H${b}`;
}).join("");

const SEATS = Array.from({ length: 11 }, (_, i) => 238 + i * 60)
    .flatMap((x) => [156, 180, 240, 264].map((y) => `M${x} ${y}h26v20h-26z`))
    .join("");
const RACKS = "M890 156h70v40h-70zM890 244h70v40h-70z";

const STEPS = [
    { key: "Concept", body: "Boundary and structure: where the journey starts and what holds it up.", at: 0.08 },
    { key: "Material", body: "Partitions and surfaces: what the passenger touches first.", at: 0.34 },
    { key: "Light", body: "Openings and the window band: how daylight sets the rhythm.", at: 0.5 },
    { key: "Experience", body: "Seating, aisle and doors: the route drawn around the person.", at: 0.7 },
];

interface Marker {
    key: string;
    x: number;
    y: number;
    note: string;
    align: "left" | "center" | "right";
}

const MARKERS: Marker[] = [
    { key: "Concept", x: 136, y: 220, note: "The vestibule is the pause before the journey: a threshold, not a corridor.", align: "left" },
    { key: "Material", x: 400, y: 170, note: "Warm surfaces against cool metal, chosen to age well rather than to impress.", align: "center" },
    { key: "Light", x: 630, y: 136, note: "A continuous window band does the first draft of the interior.", align: "center" },
    { key: "Experience", x: 1058, y: 220, note: "Doors, aisle and seating follow the passenger's route, not the other way round.", align: "right" },
];

function Line({ d, p, range, className, width = 1.5 }: { d: string; p: MotionValue<number>; range: Range; className: string; width?: number }) {
    const t = useTransform(p, range, [0, 1]);
    return (
        <motion.path
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={{ pathLength: t }}
        />
    );
}

function Fade({ p, range, children }: { p: MotionValue<number>; range: Range; children: ReactNode }) {
    const opacity = useTransform(p, range, [0, 1]);
    return <motion.g style={{ opacity }}>{children}</motion.g>;
}

function Step({ p, step }: { p: MotionValue<number>; step: (typeof STEPS)[number] }) {
    const opacity = useTransform(p, [step.at, step.at + 0.08], [0.28, 1]);
    return (
        <motion.li style={{ opacity }} className="grid grid-cols-[auto_1fr] gap-x-4 border-t border-line pt-3">
            <span className="meta pt-0.5 text-[0.75rem] text-[#53e0ff]">0{STEPS.indexOf(step) + 1}</span>
            <div>
                <h3 className="font-semibold">{step.key}</h3>
                <p className="text-[0.9375rem] text-mute">{step.body}</p>
            </div>
        </motion.li>
    );
}

function MarkerButton({ marker, p }: { marker: Marker; p: MotionValue<number> }) {
    const [open, setOpen] = useState(false);
    const opacity = useTransform(p, R.markers, [0, 1]);
    const id = `plan-note-${marker.key.toLowerCase()}`;

    const show = () => {
        setOpen(true);
        sound.tone(740);
    };
    const hide = () => setOpen(false);

    const pos = { left: `${(marker.x / 1200) * 100}%`, top: `${(marker.y / 460) * 100}%` };
    const alignment = marker.align === "left" ? "left-0" : marker.align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";

    return (
        <motion.div style={{ ...pos, opacity }} className="absolute -translate-x-1/2 -translate-y-1/2">
            <button
                type="button"
                aria-label={`${marker.key}: design note`}
                aria-describedby={open ? id : undefined}
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
                className="group relative grid size-11 place-items-center rounded-full"
            >
                <span className="absolute size-5 animate-ping rounded-full bg-accent/30 motion-reduce:animate-none" />
                <span className="relative size-3 rounded-full border-2 border-accent bg-deep transition-transform group-hover:scale-125 group-focus-visible:scale-125" />
            </button>
            <span
                id={id}
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-10 mb-1 w-52 border border-[#53e0ff]/40 bg-deep/95 p-3 text-[0.8125rem] leading-snug text-ink backdrop-blur transition-opacity duration-200 ${alignment} ${
                    open ? "opacity-100" : "opacity-0"
                }`}
            >
                <span className="meta mb-1 block text-[0.6875rem] uppercase tracking-[0.2em] text-accent">{marker.key}</span>
                {marker.note}
            </span>
        </motion.div>
    );
}

export default function PlanStudy() {
    const ref = useRef<HTMLElement>(null);
    const prefersReduced = useReducedMotion();
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);
    const reduced = hydrated && Boolean(prefersReduced);
    const still = useMotionValue(1);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const scrolled = useTransform(scrollYProgress, [0.03, 0.92], [0, 1], { clamp: true });
    const p = reduced ? still : scrolled;

    return (
        <section
            id="design"
            ref={ref}
            data-section
            data-free
            aria-label="Inside the design"
            className="relative border-t border-line bg-deep"
            style={{ height: reduced ? "auto" : "420vh" }}
        >
            <div
                className={`grid content-center ${reduced ? "min-h-[80svh] py-16" : "sticky h-[calc(100svh-var(--header-h))] overflow-hidden"}`}
                style={reduced ? undefined : { top: "var(--header-h)" }}
            >
                <div className="wrap grid items-center gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
                    <figure className="relative text-[#53e0ff]">
                        <svg viewBox="0 0 1200 460" role="img" aria-label="Conceptual floor plan of a train carriage, drawn in stages" className="w-full">
                            <title>Conceptual floor plan of a train carriage</title>

                            <Line d={OUTER} p={p} range={R.boundary} className="text-[#53e0ff]" width={2} />
                            <Line d={INNER} p={p} range={R.boundary} className="text-[#53e0ff]/70" />

                            <Line d={PILLARS} p={p} range={R.structure} className="text-[#53e0ff]" />
                            <Line d={BULKHEADS} p={p} range={R.structure} className="text-[#53e0ff]" width={2} />

                            <Line d={PARTITIONS} p={p} range={R.partitions} className="text-[#53e0ff]" width={2} />

                            <Line d={WINDOWS} p={p} range={R.openings} className="text-[#53e0ff]/80" />
                            <Line d={DOORS_JAMBS} p={p} range={R.openings} className="text-[#53e0ff]" />
                            <Line d={DOORS_LEAF} p={p} range={R.openings} className="text-[#f4f1ea]" />
                            <Line d={DOORS_SWING} p={p} range={R.openings} className="text-[#f4f1ea]/60" width={1} />

                            <Line d={SEATS} p={p} range={R.furniture} className="text-[#f4f1ea]/85" width={1.2} />
                            <Line d={RACKS} p={p} range={R.furniture} className="text-[#f4f1ea]/60" width={1.2} />

                            <Fade p={p} range={R.notes}>
                                <path d="M62 220H1138" stroke="currentColor" strokeDasharray="10 8" className="text-[#53e0ff]/40" />
                                <path d="M40 360H1160M40 350V370M1160 350V370" stroke="currentColor" fill="none" className="text-[#f4f1ea]/50" />
                                <g className="hidden fill-[#f4f1ea]/70 text-[15px] tracking-[0.2em] sm:inline" fontFamily="inherit">
                                    <text x="136" y="108" textAnchor="middle">VESTIBULE</text>
                                    <text x="600" y="108" textAnchor="middle">PASSENGER SALOON</text>
                                    <text x="1058" y="108" textAnchor="middle">VESTIBULE</text>
                                    <text x="925" y="330" textAnchor="middle">LUGGAGE</text>
                                    <text x="600" y="392" textAnchor="middle">CONCEPT STUDY · NOT TO SCALE</text>
                                </g>
                            </Fade>
                        </svg>

                        {MARKERS.map((m) => (
                            <MarkerButton key={m.key} marker={m} p={p} />
                        ))}
                    </figure>

                    <div className="grid gap-5">
                        <p className="meta uppercase tracking-[0.3em] text-accent">Inside the design</p>
                        <h2 className="display text-[clamp(2rem,3.6vw,3.25rem)]">Built piece by piece.</h2>
                        <p className="max-w-md text-mute">A conceptual carriage plan, assembled the way I approach a product: structure first, then what people touch, see and feel.</p>
                        <ol className="grid gap-3">
                            {STEPS.map((s) => (
                                <Step key={s.key} p={p} step={s} />
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </section>
    );
}
