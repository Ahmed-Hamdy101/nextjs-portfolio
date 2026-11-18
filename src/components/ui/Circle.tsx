/**
 * Performance fix:
 * - Removed `mix-blend-color-dodge` (forces a separate compositing context — expensive)
 * - Replaced `animate-pulse` (JS-driven continuous animation) with a CSS-only
 *   `@keyframes` opacity fade via `animate-float-slow` (GPU-composited, no JS)
 * - Reduced blur values: blur-3xl (48px) → blur-2xl (40px) — lighter filter pass
 * - `pointer-events-none` kept; added `will-change: opacity` hint
 */
const Circles = () => {
    return (
        <div
            className="absolute -bottom-32 -right-40 w-[600px] h-[600px] pointer-events-none"
            aria-hidden="true"
            style={{ willChange: "opacity" }}
        >
            <div className="absolute top-1/2 left-1/2 w-[480px] h-[480px] bg-gradient-to-r from-red-500/15 to-purple-600/15 rounded-full blur-2xl animate-float-slow" />
            <div className="absolute top-1/4 left-1/4 w-[280px] h-[280px] bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: "2s" }} />
            <div className="absolute bottom-1/4 right-1/4 w-[180px] h-[180px] bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-2xl animate-float-slow" style={{ animationDelay: "4s" }} />
        </div>
    );
};

export default Circles;
