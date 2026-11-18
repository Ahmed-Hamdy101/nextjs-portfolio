import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Read and follow the system reduced-motion preference without the Framer dev-only advisory. */
export function usePrefersReducedMotion() {
    const [prefersReduced, setPrefersReduced] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(QUERY);
        const update = () => setPrefersReduced(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    return prefersReduced;
}
