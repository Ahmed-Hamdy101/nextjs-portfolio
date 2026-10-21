import { useState, useMemo } from "react";
import {
    HiMiniCalendarDays,
    HiMiniClock,
    HiMiniVideoCamera,
    HiMiniArrowTopRightOnSquare,
} from "react-icons/hi2";

const todayStr = () => new Date().toISOString().split("T")[0];

const maxDateStr = (days = 60) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
};

const DURATIONS = [
    { label: "15 min", value: "15" },
    { label: "30 min", value: "30" },
    { label: "45 min", value: "45" },
    { label: "60 min", value: "60" },
];

const TIME_SLOTS = Array.from({ length: 23 }, (_, i) => {
    const totalMins = 9 * 60 + i * 30;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const label = new Date(`1970-01-01T${value}:00`).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
    return { value, label };
});

type Step = "form" | "success";

interface FormState {
    name: string;
    email: string;
    date: string;
    time: string;
    duration: string;
    note: string;
}

interface SuccessState {
    meetLink: string | null;
    calendarLink: string | null;
    name: string;
    date: string;
    time: string;
    duration: string;
}

const EMPTY: FormState = { name: "", email: "", date: "", time: "", duration: "30", note: "" };

export default function ScheduleForm() {
    const [step, setStep] = useState<Step>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successData, setSuccessData] = useState<SuccessState | null>(null);
    const [form, setForm] = useState<FormState>(EMPTY);

    const set =
        (field: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const dateLabel = useMemo(() => {
        if (!form.date) return "";
        return new Date(`${form.date}T12:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, [form.date]);

    const timeLabel = useMemo(() => {
        if (!form.time) return "";
        return new Date(`1970-01-01T${form.time}:00`).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }, [form.time]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Scheduling failed.");
            }

            setSuccessData({
                meetLink: data.meetLink,
                calendarLink: data.calendarLink,
                name: form.name,
                date: form.date,
                time: form.time,
                duration: form.duration,
            });
            setStep("success");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Scheduling failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === "success" && successData) {
        return (
            <div className="panel grid gap-6 p-6 text-ink sm:p-8" role="status">
                <div className="grid gap-1">
                    <h3 className="h3">Meeting confirmed</h3>
                    <p className="text-mute">A calendar invite and confirmation email are on their way to your inbox.</p>
                </div>

                <ul className="grid gap-3 rounded-md border border-line p-4">
                    <li className="grid grid-cols-[1.5rem_1fr] items-center gap-2">
                        <HiMiniCalendarDays className="text-accent" aria-hidden="true" />
                        <span>{dateLabel}</span>
                    </li>
                    <li className="grid grid-cols-[1.5rem_1fr] items-center gap-2">
                        <HiMiniClock className="text-accent" aria-hidden="true" />
                        <span>{timeLabel} · {successData.duration} minutes</span>
                    </li>
                    {successData.meetLink && (
                        <li className="grid grid-cols-[1.5rem_1fr] items-center gap-2">
                            <HiMiniVideoCamera className="text-accent" aria-hidden="true" />
                            <a href={successData.meetLink} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                                Join Google Meet
                            </a>
                        </li>
                    )}
                </ul>

                <div className="grid gap-3 sm:grid-cols-2">
                    {successData.calendarLink && (
                        <a href={successData.calendarLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            <HiMiniArrowTopRightOnSquare aria-hidden="true" />
                            View in calendar
                        </a>
                    )}
                    <button
                        type="button"
                        className="btn btn-quiet"
                        onClick={() => {
                            setStep("form");
                            setForm(EMPTY);
                            setSuccessData(null);
                        }}
                    >
                        Schedule another
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form className="panel grid gap-5 p-6 text-ink sm:p-8" onSubmit={handleSubmit}>
            {error && <p className="notice notice-error" role="alert">{error}</p>}

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="field">
                    <label htmlFor="sf-name">Full name</label>
                    <input id="sf-name" className="input" type="text" required value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" />
                </div>
                <div className="field">
                    <label htmlFor="sf-email">Email</label>
                    <input id="sf-email" className="input" type="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" />
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div className="field">
                    <label htmlFor="sf-date">Preferred date</label>
                    <input id="sf-date" className="input" type="date" required value={form.date} onChange={set("date")} min={todayStr()} max={maxDateStr(60)} />
                </div>
                <div className="field">
                    <label htmlFor="sf-time">Time slot</label>
                    <select id="sf-time" className="input" required value={form.time} onChange={set("time")}>
                        <option value="" disabled>Select a time</option>
                        {TIME_SLOTS.map((slot) => (
                            <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <fieldset className="field">
                <legend className="mb-1.5 text-sm font-semibold">Duration</legend>
                <div className="grid grid-cols-4 gap-2">
                    {DURATIONS.map((d) => {
                        const selected = form.duration === d.value;
                        return (
                            <button
                                key={d.value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setForm((prev) => ({ ...prev, duration: d.value }))}
                                className={`min-h-11 rounded-md border text-sm font-medium transition-colors ${
                                    selected
                                        ? "border-accent bg-accent-wash text-accent-deep"
                                        : "border-line bg-sheet text-mute hover:border-accent hover:text-accent"
                                }`}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>
            </fieldset>

            <div className="field">
                <label htmlFor="sf-note">
                    Agenda <span className="font-normal text-mute">(optional)</span>
                </label>
                <textarea id="sf-note" className="input" rows={3} value={form.note} onChange={set("note")} placeholder="What would you like to discuss?" />
            </div>

            <p className="text-sm text-mute">Times use your local timezone. A Google Meet link is generated automatically.</p>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary min-h-12">
                <HiMiniCalendarDays aria-hidden="true" />
                {isSubmitting ? "Scheduling…" : "Confirm meeting"}
            </button>
        </form>
    );
}
