import { useSyncExternalStore } from "react";
import { HiMiniSpeakerWave, HiMiniSpeakerXMark } from "react-icons/hi2";
import { sound } from "@/lib/sound";

export default function SoundToggle({ className = "" }: { className?: string }) {
    const on = useSyncExternalStore(sound.subscribe, sound.isEnabled, () => false);

    return (
        <button
            type="button"
            aria-pressed={on}
            aria-label={on ? "Turn sound off" : "Turn sound on"}
            onClick={() => void sound.toggle()}
            className={`btn btn-quiet min-h-11 bg-deep/85 ${className}`}
        >
            {on ? <HiMiniSpeakerWave aria-hidden="true" /> : <HiMiniSpeakerXMark aria-hidden="true" />}
            <span>Sound {on ? "on" : "off"}</span>
        </button>
    );
}
