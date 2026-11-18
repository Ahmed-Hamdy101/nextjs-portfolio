/**
 * Cross-page content contracts.
 *
 * These describe what the presentation layers consume; the data itself lives in
 * `src/data` and is exposed through `src/services`.
 */

export interface SocialLink {
    label: string;
    href: string;
}

export interface NavItem {
    href: string;
    label: string;
    /** Optional one-line description used by the desktop mega menu and mobile sheet. */
    description?: string;
}

export interface SectionDef {
    id: string;
    label: string;
}

export interface Testimonial {
    quote: string;
    author: string;
    role: string;
    company: string;
}

export interface ServiceItem {
    title: string;
    summary: string;
    deliverables: string[];
}

export interface SkillGroup {
    title: string;
    items: string[];
}

export interface ExperienceItem {
    company: string;
    role: string;
    period: string;
    summary: string;
    highlights?: string[];
}

/** POST /api/contact */
export interface ContactPayload {
    name: string;
    email: string;
    subject?: string;
    message: string;
}

/** POST /api/schedule */
export interface SchedulePayload {
    name: string;
    email: string;
    date: string;
    time: string;
    duration: string;
    note?: string;
    timezone: string;
}

export interface ScheduleResult {
    success: true;
    meetLink: string | null;
    calendarLink: string | null;
}

export interface ApiErrorBody {
    error?: string;
}

export interface ApiSuccess {
    success: true;
}
