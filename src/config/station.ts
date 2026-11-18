/** Use the bundled metro-station model in the cinematic scene; fall back to the procedural station if it cannot load. */
export const STATION_ENABLED = true;

/** Prefer the optimized, bundled 3D station; retain the full model as a fallback. */
export const STATION_URLS = ["/3d/station-environment.glb", "/3d/station-cinematic.glb"];
/** Files larger than this are skipped (add ?bigstation to the page URL to force one for testing). */
export const STATION_MAX_BYTES = 15 * 1024 * 1024;
/** The model is auto-scaled so its longer side is this many units, then adjusted with `scale` below. */
export const STATION_TARGET_LENGTH = 160;

/**
 * Placement of the station model and the train's track inside it. Open the site with ?calibrate=1 to tune these
 * by eye, then copy the printed values into STATION_DEFAULT.
 */
export interface StationCal {
    scale: number;
    x: number;
    y: number;
    z: number;
    /** Rotation about the vertical axis, in degrees. */
    rotY: number;
    /** Sideways position of the track the train runs on. */
    trainX: number;
    /** Height of the train's wheels above the ground. */
    trainY: number;
    /** Show guide rails along the train's track. */
    ghost: boolean;
}

export const STATION_DEFAULT: StationCal = {
    scale: 1,
    x: 0,
    y: 0,
    z: 0,
    rotY: 0,
    trainX: 0,
    trainY: 1.56,
    ghost: false,
};

export const STATION_KEY = "station-cal-v2";

/** Live values, shared by the scene and the calibration panel. */
export const stationCal: StationCal = { ...STATION_DEFAULT };

export function loadStationCal(): StationCal {
    try {
        const raw = window.localStorage.getItem(STATION_KEY);
        if (raw) return { ...STATION_DEFAULT, ...(JSON.parse(raw) as Partial<StationCal>) };
    } catch {
        /* ignore */
    }
    return { ...STATION_DEFAULT };
}
