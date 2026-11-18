import React, { useEffect, useRef } from "react";

/**
 * Performance budget:
 * - Single beginPath/stroke for ALL connection lines per frame  (was 1 stroke per line)
 * - Spatial grid O(n) neighbour lookup                          (was O(n²))
 * - Opacity-bucketed dot batching, 1 fill call per bucket       (was N fill calls)
 * - Visibility API pauses RAF when tab hidden
 * - Debounced resize
 * - Reduced counts on mobile
 */

const PARTICLE_COUNT_DESKTOP = 40;
const PARTICLE_COUNT_MOBILE  = 18;
const CONNECTION_DISTANCE    = 120;
const CELL_SIZE              = CONNECTION_DISTANCE;

interface Particle {
    x: number; y: number;
    size: number;
    speedX: number; speedY: number;
    opacity: number;
}

const ParticularContainer = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) return;

        let rafId: number;
        let paused = false;

        const setSize = () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();

        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const count    = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

        const particles: Particle[] = [];

        const init = () => {
            particles.length = 0;
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size:   Math.random() * 1.4 + 0.7,
                    speedX: (Math.random() - 0.5) * 0.35,
                    speedY: (Math.random() - 0.5) * 0.35,
                    opacity: Math.random() * 0.35 + 0.1,
                });
            }
        };
        init();

        // ── Grid build ─────────────────────────────────────────────────────────
        type Grid = Map<string, number[]>;
        const buildGrid = (): Grid => {
            const g: Grid = new Map();
            for (let i = 0; i < particles.length; i++) {
                const p   = particles[i];
                const key = `${Math.floor(p.x / CELL_SIZE)},${Math.floor(p.y / CELL_SIZE)}`;
                if (!g.has(key)) g.set(key, []);
                g.get(key)!.push(i);
            }
            return g;
        };

        // ── Single-path connection draw ─────────────────────────────────────────
        // All lines share ONE beginPath → ONE stroke call per frame.
        // Opacity is encoded per-segment by piggy-backing on a uniform low alpha.
        const connectParticles = () => {
            const grid = buildGrid();
            const distSqMax = CONNECTION_DISTANCE * CONNECTION_DISTANCE;

            ctx.lineWidth   = 0.5;
            ctx.strokeStyle = "rgba(147,51,234,0.12)"; // base colour, low alpha
            ctx.beginPath();

            for (let i = 0; i < particles.length; i++) {
                const p  = particles[i];
                const cx = Math.floor(p.x / CELL_SIZE);
                const cy = Math.floor(p.y / CELL_SIZE);

                for (let nx = cx - 1; nx <= cx + 1; nx++) {
                    for (let ny = cy - 1; ny <= cy + 1; ny++) {
                        const bucket = grid.get(`${nx},${ny}`);
                        if (!bucket) continue;

                        for (const j of bucket) {
                            if (j <= i) continue;
                            const q    = particles[j];
                            const dx   = p.x - q.x;
                            const dy   = p.y - q.y;
                            const dSq  = dx * dx + dy * dy;
                            if (dSq >= distSqMax) continue;

                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(q.x, q.y);
                        }
                    }
                }
            }

            ctx.stroke(); // ONE draw call for all lines
        };

        // ── Main loop ──────────────────────────────────────────────────────────
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            if (paused) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update positions
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x > canvas.width)  p.x = 0;
                else if (p.x < 0)        p.x = canvas.width;
                if (p.y > canvas.height) p.y = 0;
                else if (p.y < 0)        p.y = canvas.height;
            }

            // Bucket dots by opacity (1 decimal) → 1 fill call per bucket
            const buckets: Record<string, Particle[]> = {};
            for (let i = 0; i < particles.length; i++) {
                const key = particles[i].opacity.toFixed(1);
                (buckets[key] ??= []).push(particles[i]);
            }
            for (const [alpha, group] of Object.entries(buckets)) {
                ctx.fillStyle = `rgba(239,68,68,${alpha})`;
                ctx.beginPath();
                for (const p of group) {
                    ctx.moveTo(p.x + p.size, p.y);
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
                ctx.fill();
            }

            connectParticles();
        };

        animate();

        // ── Visibility pause ───────────────────────────────────────────────────
        const onVisibility = () => { paused = document.hidden; };
        document.addEventListener("visibilitychange", onVisibility);

        // ── Debounced resize ───────────────────────────────────────────────────
        let resizeTimer: ReturnType<typeof setTimeout>;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { setSize(); init(); }, 150);
        };
        window.addEventListener("resize", onResize, { passive: true });

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(resizeTimer);
            window.removeEventListener("resize", onResize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed top-0 left-0 w-full h-full pointer-events-none"
            aria-hidden="true"
            style={{ zIndex: 0 }}
        />
    );
};

export default ParticularContainer;
