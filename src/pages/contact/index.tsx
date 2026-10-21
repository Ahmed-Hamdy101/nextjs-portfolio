import { useState } from "react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { HiMiniArrowTopRightOnSquare, HiMiniPaperAirplane } from "react-icons/hi2";
import SEOHead from "@/components/SEOHead";

const DETAILS = [
    { label: "Email", value: "ahmedhamdy.mh95@gmail.com", href: "mailto:ahmedhamdy.mh95@gmail.com" },
    { label: "Phone", value: "+20 114 164 0812", href: "tel:+201141640812" },
    { label: "Location", value: "6th of October, Giza, Egypt. Available remotely.", href: null },
];

const SOCIALS = [
    { icon: FaGithub, href: "https://github.com/Ahmed-Hamdy101", label: "GitHub" },
    { icon: FaLinkedinIn, href: "https://linkedin.com/in/ahmed-hamdy-ah", label: "LinkedIn" },
];

type Status = { type: "success" | "error"; text: string } | null;

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        setIsSubmitting(true);
        setStatus(null);

        const data = Object.fromEntries(new FormData(formEl).entries());

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (result.success) {
                setStatus({ type: "success", text: "Message sent. I'll be in touch." });
                formEl.reset();
            } else {
                setStatus({ type: "error", text: result.error || "Something went wrong." });
            }
        } catch {
            setStatus({ type: "error", text: "Could not reach the server. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SEOHead
                title="Contact | Ahmed Hamdy, Full-Stack Engineer"
                description="Get in touch with Ahmed Hamdy about full-time roles, consulting or a new project."
                path="/contact"
            />

            <div className="wrap grid gap-12 pb-24 pt-16">
                <header className="grid gap-4">
                    <h1 className="h1">Get in touch</h1>
                    <p className="lede">Have a project in mind? Tell me about it and I&apos;ll reply within 24 hours.</p>
                </header>

                <div className="grid gap-10 lg:grid-cols-12">
                    <form className="panel grid content-start gap-5 p-6 sm:p-8 lg:col-span-7" onSubmit={handleSubmit}>
                        {status && (
                            <p
                                role={status.type === "error" ? "alert" : "status"}
                                className={`notice ${status.type === "success" ? "notice-ok" : "notice-error"}`}
                            >
                                {status.text}
                            </p>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="field">
                                <label htmlFor="contact-name">Full name</label>
                                <input id="contact-name" name="name" type="text" required className="input" placeholder="Your name" autoComplete="name" />
                            </div>
                            <div className="field">
                                <label htmlFor="contact-email">Email</label>
                                <input id="contact-email" name="email" type="email" required className="input" placeholder="you@company.com" autoComplete="email" />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="contact-subject">Subject</label>
                            <input id="contact-subject" name="subject" type="text" required className="input" placeholder="Project proposal or collaboration" />
                        </div>

                        <div className="field">
                            <label htmlFor="contact-message">Message</label>
                            <textarea id="contact-message" name="message" required rows={6} className="input" placeholder="Tell me about your project, timeline and goals" />
                        </div>

                        <button type="submit" disabled={isSubmitting} className="btn btn-primary min-h-12">
                            <HiMiniPaperAirplane aria-hidden="true" />
                            {isSubmitting ? "Sending…" : "Send message"}
                        </button>
                    </form>

                    <aside className="grid content-start gap-8 lg:col-span-5">
                        <dl className="grid">
                            {DETAILS.map(({ label, value, href }) => (
                                <div key={label} className="grid gap-1 border-t rule py-4 last:border-b">
                                    <dt className="meta">{label}</dt>
                                    <dd className="font-medium break-words">
                                        {href ? <a href={href} className="link">{value}</a> : value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className="grid gap-3">
                            <p className="meta">Find me online</p>
                            <ul className="grid gap-2">
                                {SOCIALS.map(({ icon: Icon, href, label }) => (
                                    <li key={label}>
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="panel grid grid-cols-[1.25rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:border-accent hover:text-accent"
                                        >
                                            <Icon aria-hidden="true" />
                                            <span className="font-medium">{label}</span>
                                            <HiMiniArrowTopRightOnSquare aria-hidden="true" className="text-mute" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="notice notice-ok">Currently accepting new projects and collaborations.</p>
                    </aside>
                </div>
            </div>
        </>
    );
}
