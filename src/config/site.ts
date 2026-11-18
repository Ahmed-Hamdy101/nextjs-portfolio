/**
 * Single source of truth for identity, contact details and the canonical origin.
 * Presentation code must read from here instead of hard-coding strings.
 */

export const site = {
    name: "Ahmed Hamdy",
    shortName: "AH",
    role: "Full-stack engineer",
    tagline: "Interface, API, data and delivery — one owner.",
    location: {
        city: "Giza",
        country: "EG",
        label: "Giza, Egypt",
        availability: "Open to full-time remote roles",
    },
    email: "ahmedhamdy.mh95@gmail.com",
    phone: {
        display: "+20 114 164 0812",
        href: "tel:+201141640812",
        whatsapp: "https://wa.me/201141640812",
    },
    origin: "https://ahmedhamdy101.is-a.dev",
    socials: [
        { label: "GitHub", href: "https://github.com/Ahmed-Hamdy101" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/ahmed-hamdy-ah/" },
        { label: "WhatsApp", href: "https://wa.me/201141640812" },
        { label: "Stack Overflow", href: "https://stackoverflow.com/users/19638490/ahmed-hamdy" },
    ],
    /** Default social/OG artwork, served from `/public/brand`. */
    ogImage: "/brand/og-image-portfolio.jpg",
} as const;

export const SITE_ORIGIN = site.origin;

export type SiteConfig = typeof site;
