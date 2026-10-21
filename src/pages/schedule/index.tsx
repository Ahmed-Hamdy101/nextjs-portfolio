import ScheduleForm from "@/components/ScheduleForm";
import SEOHead from "@/components/SEOHead";

export default function SchedulePage() {
    return (
        <>
            <SEOHead
                title="Schedule a Meeting | Ahmed Hamdy"
                description="Book a 1-on-1 meeting with Ahmed Hamdy. Pick a time that works for you and a Google Calendar invite with a Meet link is sent automatically."
                path="/schedule"
            />

            <div className="wrap grid max-w-2xl gap-10 pb-24 pt-16">
                <header className="grid gap-4">
                    <h1 className="h1">Schedule a call</h1>
                    <p className="lede">
                        Pick a date and time. A Google Calendar invite with a Meet link lands in your inbox right away.
                    </p>
                </header>
                <ScheduleForm />
            </div>
        </>
    );
}
