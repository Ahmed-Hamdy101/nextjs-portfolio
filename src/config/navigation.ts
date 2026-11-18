import type { NavItem } from "@/types/content";

/** Grouped "Work" menu; rendered as the desktop mega menu and the mobile sheet. */
export const WORK_LINKS: NavItem[] = [
    {
        href: "/projects",
        label: "Projects",
        description: "Case studies of platforms shipped to production or in active development.",
    },
    {
        href: "/work",
        label: "Work history",
        description: "Production work since 2021: booking platforms, corporate sites and ERP tooling.",
    },
    {
        href: "/skills",
        label: "Skills",
        description: "Frontend, backend, data and cloud tooling used daily.",
    },
];

/** Top-level destinations. `mobileOnly` items appear in the sheet but not the bar. */
export const PRIMARY_LINKS: NavItem[] = [
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/testimonials", label: "Outcomes" },
    { href: "/contact", label: "Contact", description: "Start a conversation" },
];

export const FOOTER_LINKS: NavItem[] = [
    { href: "/projects", label: "Work" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/testimonials", label: "Outcomes" },
    { href: "/schedule", label: "Schedule" },
    { href: "/contact", label: "Contact" },
];

/** Routes that belong to the "Work" group, used for active-state detection. */
export const WORK_PATHS = WORK_LINKS.map((link) => link.href);

export const isActivePath = (pathname: string, href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);
