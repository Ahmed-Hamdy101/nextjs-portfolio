// Animation variants — kept in one place so every page
// uses identical easing and duration values.

export const fadeIn = (direction: "up" | "down" | "left" | "right", delay: number) => ({
    hidden: {
        y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
        x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
        opacity: 0,
    },
    show: {
        y: 0,
        x: 0,
        opacity: 1,
        transition: {
            type: "tween" as const,
            duration: 0.3,
            delay: Math.min(delay * 0.35, 0.18),
            ease: [0.25, 0.1, 0.25, 1],
        },
    },
});
