import { useState } from "react";
import { STATION_DEFAULT, STATION_KEY, stationCal, type StationCal } from "@/config/station";

const FIELDS: { key: Exclude<keyof StationCal, "ghost">; label: string; min: number; max: number; step: number }[] = [
    { key: "scale", label: "Station scale", min: 0.05, max: 6, step: 0.01 },
    { key: "x", label: "Station x", min: -120, max: 120, step: 0.1 },
    { key: "y", label: "Station y", min: -20, max: 20, step: 0.05 },
    { key: "z", label: "Station z", min: -200, max: 200, step: 0.1 },
    { key: "rotY", label: "Station rotation", min: -180, max: 180, step: 0.5 },
    { key: "trainX", label: "Train track x", min: -40, max: 40, step: 0.05 },
    { key: "trainY", label: "Train height", min: -3, max: 6, step: 0.01 },
];

/** Dev tool shown with ?calibrate=1: place the station model and line the train up with its rails. */
export default function StationCalibration() {
    const [, bump] = useState(0);

    const set = <K extends keyof StationCal>(key: K, value: StationCal[K]) => {
        stationCal[key] = value;
        try {
            window.localStorage.setItem(STATION_KEY, JSON.stringify(stationCal));
        } catch {
            /* ignore */
        }
        bump((n) => n + 1);
    };

    return (
        <div className="pointer-events-auto fixed left-3 top-20 z-[80] grid max-h-[80vh] w-64 gap-2 overflow-y-auto rounded-xl border border-white/20 bg-black/85 p-3 text-[0.75rem] text-white">
            <p className="font-semibold uppercase tracking-[0.2em] text-[#8fe8ff]">Station calibration</p>
            <p className="text-white/70">Move the station until its rails sit under the cyan guides, then copy the values.</p>

            <label className="flex items-center gap-2">
                <input type="checkbox" checked={stationCal.ghost} onChange={(e) => set("ghost", e.target.checked)} />
                Show guide rails
            </label>

            {FIELDS.map((f) => (
                <label key={f.key} className="grid gap-0.5">
                    <span className="flex justify-between">
                        <span>{f.label}</span>
                        <span className="tabular-nums text-white/70">{stationCal[f.key]}</span>
                    </span>
                    <input type="range" min={f.min} max={f.max} step={f.step} value={stationCal[f.key]} onChange={(e) => set(f.key, Number(e.target.value))} />
                </label>
            ))}

            <div className="flex gap-2">
                <button
                    type="button"
                    className="rounded-md border border-white/30 px-2 py-1 hover:border-[#8fe8ff]"
                    onClick={() => {
                        const json = JSON.stringify({ ...stationCal, ghost: false }, null, 2);
                        console.warn("[station calibration]\n" + json);
                        void navigator.clipboard?.writeText(json);
                    }}
                >
                    Copy values
                </button>
                <button
                    type="button"
                    className="rounded-md border border-white/30 px-2 py-1 hover:border-[#8fe8ff]"
                    onClick={() => {
                        Object.assign(stationCal, STATION_DEFAULT, { ghost: true });
                        window.localStorage.removeItem(STATION_KEY);
                        bump((n) => n + 1);
                    }}
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
