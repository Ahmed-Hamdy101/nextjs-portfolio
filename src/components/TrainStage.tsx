import { Component, MutableRefObject, ReactNode, RefObject, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { MODEL_URL, pruneScenery, setupLoader } from "@/lib/train-model";
import { sound } from "@/lib/sound";
import { STATION_ENABLED, STATION_MAX_BYTES, STATION_TARGET_LENGTH, STATION_URLS, loadStationCal, stationCal } from "@/lib/station-config";
import StationCalibration from "./StationCalibration";

/** Flip to false if the train's cab ends up at the far end instead of facing the camera. */
const NOSE_FACES_CAMERA = true;
/** Optional equirectangular photo (jpg/png). If this file exists it replaces the generated sky and lights the train. */
const ENV_URL = "/3d/env/hero.jpg";

const TRACK_X = [-2.4, 2.4];
const TRAIN_WIDTH = 2.7;
const NEAR_Z = 15;
const CAMERA_Z = 32;
const CYCLE = 38;
const CINEMA_SECONDS = 48;
const SUN: Vec3 = [-60, 20, -100];

type Vec3 = [number, number, number];

const SHOTS: { pos: Vec3; look: Vec3 }[] = [
    { pos: [-2.6, 1.7, CAMERA_Z], look: [2.2, 3.0, -10] },
    { pos: [-4, 2.6, 26], look: [2.4, 2.4, 6] },
    { pos: [11, 3, 24], look: [2.4, 2.4, 4] },
    { pos: [16, 4, 10], look: [2.4, 2.2, 0] },
    { pos: [7, 12, 18], look: [2.4, 1, 0] },
    { pos: [-1, 1.6, 12], look: [2.4, 2.4, -8] },
    { pos: [-10, 4, -14], look: [2.4, 2.4, -4] },
];

const ROUTE_SHOT: Record<string, number> = {
    "/projects": 0.18,
    "/projects/[slug]": 0.26,
    "/work": 0.34,
    "/skills": 0.45,
    "/services": 0.56,
    "/about": 0.68,
    "/testimonials": 0.8,
    "/schedule": 0.9,
    "/contact": 0.97,
};

/** Positions are measured back from the train's near end. */
const HOTSPOTS: { fromNose: number; y: number; label: string }[] = [
    { fromNose: 9, y: 2.2, label: "Aerodynamic design (CGI model)" },
    { fromNose: 17, y: 3.0, label: "Interior render available" },
    { fromNose: 2, y: 1.3, label: "" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Minimum ms between renders; raised by the quality governor as a last resort. */
const pace = { interval: 0 };

/** Cinematic post-processing; the quality governor switches it off first if the frame rate collapses. */
const quality = { post: true };

function seeded(seed: number) {
    let s = seed * 9301 + 49297;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

interface TrainState {
    z: number;
    half: number;
    visible: boolean;
}

function cycleZ(t: number, park: number, half: number): number | null {
    if (t < 12) {
        const k = t / 12;
        const from = park - 130;
        return from + (park - from) * (1 - Math.pow(1 - k, 3));
    }
    if (t < 20) return park;
    if (t < 29) {
        const k = (t - 20) / 9;
        const out = CAMERA_Z + half + 30;
        return park + (out - park) * k * k * k;
    }
    return null;
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error: unknown) {
        console.error("[TrainStage] model failed to load", error);
    }
    render() {
        return this.state.failed ? this.props.fallback : this.props.children;
    }
}

/* ---------- procedural textures ---------- */

function noiseCanvas(size: number, base: [number, number, number], variance: number, extra?: (g: CanvasRenderingContext2D, s: number) => void) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    const img = g.createImageData(size, size);
    const d = img.data;
    const rand = seeded(size + base[0]);
    for (let i = 0; i < d.length; i += 4) {
        const n = (rand() - 0.5) * variance;
        d[i] = clamp(base[0] + n, 0, 255);
        d[i + 1] = clamp(base[1] + n, 0, 255);
        d[i + 2] = clamp(base[2] + n, 0, 255);
        d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    extra?.(g, size);
    return c;
}

function toTexture(c: HTMLCanvasElement, rx: number, ry: number, srgb = true) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function signTexture(text: string) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#12315a";
    g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#f2c230";
    g.fillRect(0, 112, 512, 16);
    g.fillStyle = "#ffffff";
    g.font = "700 60px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 256, 54);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
}

/** A dense tree line silhouette: overlapping foliage blobs, tileable along its length. */
function treelineCanvas(seed: number) {
    const rand = seeded(seed);
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 128;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 260; i++) {
        const x = rand() * 1024;
        const r = 9 + rand() * 24;
        const y = 128 - rand() * 26 - r * 0.45;
        const shade = 22 + rand() * 30;
        g.fillStyle = `rgb(${shade},${shade + 24},${shade - 2})`;
        for (const dx of [0, -1024, 1024]) {
            g.beginPath();
            g.arc(x + dx, y, r, 0, Math.PI * 2);
            g.fill();
        }
    }
    g.fillStyle = "rgb(24,40,22)";
    g.fillRect(0, 104, 1024, 24);
    return c;
}

/** A distant city skyline with lit windows. */
function skylineCanvas() {
    const rand = seeded(19);
    const c = document.createElement("canvas");
    c.width = 2048;
    c.height = 256;
    const g = c.getContext("2d")!;
    let x = 0;
    while (x < 2048) {
        const w = 34 + rand() * 70;
        const h = 50 + rand() * 170 * (rand() > 0.82 ? 1.4 : 1);
        const tone = 52 + rand() * 26;
        g.fillStyle = `rgb(${tone},${tone + 8},${tone + 20})`;
        g.fillRect(x, 256 - h, w, h);
        for (let wy = 256 - h + 8; wy < 248; wy += 12) {
            for (let wx = x + 6; wx < x + w - 8; wx += 10) {
                g.fillStyle = rand() > 0.6 ? "rgba(255,206,130,0.9)" : "rgba(40,52,70,0.8)";
                g.fillRect(wx, wy, 4, 6);
            }
        }
        x += w + rand() * 8;
    }
    return c;
}

function makeTextures() {
    const rand = seeded(7);
    const concreteC = noiseCanvas(256, [150, 146, 140], 34, (g, s) => {
        g.strokeStyle = "rgba(40,38,34,0.55)";
        g.lineWidth = 3;
        g.strokeRect(0, 0, s, s);
        for (let i = 0; i < 16; i++) {
            const x = rand() * s;
            const y = rand() * s;
            const r = 20 + rand() * 50;
            const rg = g.createRadialGradient(x, y, 0, x, y, r);
            rg.addColorStop(0, "rgba(60,55,48,0.18)");
            rg.addColorStop(1, "rgba(60,55,48,0)");
            g.fillStyle = rg;
            g.fillRect(x - r, y - r, r * 2, r * 2);
        }
    });
    const ballastC = noiseCanvas(256, [92, 86, 78], 80, (g, s) => {
        for (let i = 0; i < 900; i++) {
            const l = 60 + rand() * 90;
            g.fillStyle = `rgb(${l},${l - 4},${l - 10})`;
            g.beginPath();
            g.ellipse(rand() * s, rand() * s, 1.5 + rand() * 3, 1 + rand() * 2.2, rand() * 3, 0, Math.PI * 2);
            g.fill();
        }
    });
    const asphaltC = noiseCanvas(256, [72, 70, 66], 30);
    const tactileC = noiseCanvas(128, [226, 190, 52], 14, (g, s) => {
        g.fillStyle = "rgba(120,92,10,0.75)";
        for (let x = 8; x < s; x += 16) {
            for (let y = 8; y < s; y += 16) {
                g.beginPath();
                g.arc(x, y, 3.2, 0, Math.PI * 2);
                g.fill();
            }
        }
    });

    return {
        concrete: toTexture(concreteC, 2, 50),
        ballast: toTexture(ballastC, 3, 100),
        asphalt: toTexture(asphaltC, 120, 120),
        tactile: toTexture(tactileC, 1, 100),
        treeNear: toTexture(treelineCanvas(3), 3, 1),
        treeFar: toTexture(treelineCanvas(9), 2, 1),
        skyline: toTexture(skylineCanvas(), 1, 1),
        signs: [signTexture("PLATFORM 1"), signTexture("PLATFORM 2")],
    };
}

function Instanced({
    count,
    place,
    shadow,
    children,
}: {
    count: number;
    place: (i: number, d: THREE.Object3D) => void;
    shadow?: boolean;
    children: ReactNode;
}) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        const d = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            d.position.set(0, 0, 0);
            d.rotation.set(0, 0, 0);
            d.scale.set(1, 1, 1);
            place(i, d);
            d.updateMatrix();
            mesh.setMatrixAt(i, d.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [count, place]);
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false} castShadow={shadow} receiveShadow={shadow}>
            {children}
        </instancedMesh>
    );
}

const SLEEPERS = 440;
const placeSleeper = (i: number, d: THREE.Object3D) => d.position.set(0, 0.17, -200 + i * 0.91);
const placeFastener = (i: number, d: THREE.Object3D) => d.position.set(i & 1 ? 0.72 : -0.72, 0.245, -200 + (i >> 1) * 0.91);

const COLUMN_Z = Array.from({ length: 21 }, (_, i) => -150 + i * 10);
const placeColumn = (i: number, d: THREE.Object3D) => d.position.set(i < 21 ? -5.3 : 5.3, 3.2, COLUMN_Z[i % 21]);
const placeColumnBase = (i: number, d: THREE.Object3D) => d.position.set(i < 21 ? -5.3 : 5.3, 1.1, COLUMN_Z[i % 21]);
const placeBeam = (i: number, d: THREE.Object3D) => d.position.set(i < 21 ? -8.9 : 8.9, 5.35, COLUMN_Z[i % 21]);

const RIBS = 80;
const placeRib = (i: number, d: THREE.Object3D) => d.position.set(i < RIBS ? -8.9 : 8.9, 5.66, -150 + (i % RIBS) * 2.5);

/** People waiting on the platforms, as simple silhouettes: [x, z]. */
const PEOPLE: [number, number][] = [
    [-10.5, -8], [-10.2, -9.1], [-7.2, -30], [-11, -60], [-8, -85], [-6.8, -120], [-9, -45],
    [7.5, -20], [10.8, -35], [10.4, -36.2], [7, -70], [9, -95], [11, -130], [8.5, -55],
];
const placePerson = (i: number, d: THREE.Object3D) => {
    const s = 0.95 + (i % 4) * 0.05;
    d.position.set(PEOPLE[i][0], 1 + 0.77 * s, PEOPLE[i][1]);
    d.scale.set(1, s, 1);
};

/** Wet patches on the ground between the tracks: [z, width, length]. */
const PUDDLES: [number, number, number][] = [
    [-10, 1.0, 10],
    [-35, 0.9, 14],
    [-70, 1.1, 18],
    [-110, 1.0, 20],
];

const LAMP_Z = Array.from({ length: 40 }, (_, i) => -150 + i * 5);
const placeLamp = (i: number, d: THREE.Object3D) => d.position.set(i < 40 ? -6.6 : 6.6, 5.4, LAMP_Z[i % 40]);

const placeBench = (i: number, d: THREE.Object3D) => d.position.set(i < 12 ? -10.6 : 10.6, 1.3, -140 + (i % 12) * 14);
const placeAdBox = (i: number, d: THREE.Object3D) => d.position.set(i < 12 ? -12.5 : 12.5, 2.9, -134 + (i % 12) * 14);

const MAST_Z = Array.from({ length: 12 }, (_, i) => -190 + i * 30);
const placeMast = (i: number, d: THREE.Object3D) => d.position.set(0, 3.8, MAST_Z[i]);
const placeBar = (i: number, d: THREE.Object3D) => d.position.set(0, 7, MAST_Z[i]);
const DROPPERS = 66;
const placeDropper = (i: number, d: THREE.Object3D) => d.position.set(i < 33 ? -2.4 : 2.4, 6.15, -190 + (i % 33) * 6);

function Track({ x, ballast }: { x: number; ballast: THREE.Texture }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <boxGeometry args={[3.6, 0.16, 400]} />
                <meshStandardMaterial color="#5d574f" roughness={1} />
            </mesh>
            <mesh position={[0, 0.133, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[3.6, 400]} />
                <meshStandardMaterial map={ballast} roughness={1} />
            </mesh>
            <Instanced count={SLEEPERS} place={placeSleeper}>
                <boxGeometry args={[2.5, 0.12, 0.26]} />
                <meshStandardMaterial color="#8d887f" roughness={0.95} />
            </Instanced>
            {[-0.72, 0.72].map((rx) => (
                <group key={rx}>
                    <mesh position={[rx, 0.31, 0]}>
                        <boxGeometry args={[0.075, 0.12, 400]} />
                        <meshStandardMaterial color="#c3c9d1" metalness={1} roughness={0.2} />
                    </mesh>
                    <mesh position={[rx, 0.24, 0]}>
                        <boxGeometry args={[0.14, 0.03, 400]} />
                        <meshStandardMaterial color="#8a9099" metalness={1} roughness={0.35} />
                    </mesh>
                </group>
            ))}
            <Instanced count={SLEEPERS * 2} place={placeFastener}>
                <boxGeometry args={[0.2, 0.05, 0.1]} />
                <meshStandardMaterial color="#20232a" metalness={0.6} roughness={0.5} />
            </Instanced>
        </group>
    );
}

function Station({ shadows }: { shadows: boolean }) {
    const tx = useMemo(makeTextures, []);
    useEffect(
        () => () => {
            [tx.concrete, tx.ballast, tx.asphalt, tx.tactile, tx.treeNear, tx.treeFar, tx.skyline, ...tx.signs].forEach((t) => t.dispose());
        },
        [tx]
    );

    return (
        <group>
            <mesh position={[0, -0.02, 0]} rotation-x={-Math.PI / 2} receiveShadow>
                <planeGeometry args={[500, 500]} />
                <meshStandardMaterial map={tx.asphalt} roughness={1} />
            </mesh>

            {TRACK_X.map((x) => (
                <Track key={x} x={x} ballast={tx.ballast} />
            ))}

            {[-1, 1].map((sx) => (
                <group key={sx}>
                    <mesh position={[sx * 8.6, 0.5, -50]} receiveShadow castShadow={shadows}>
                        <boxGeometry args={[8, 1, 200]} />
                        <meshStandardMaterial color="#8f8a82" roughness={0.9} />
                    </mesh>
                    <mesh position={[sx * 8.6, 1.003, -50]} rotation-x={-Math.PI / 2} receiveShadow>
                        <planeGeometry args={[8, 200]} />
                        <meshStandardMaterial map={tx.concrete} roughness={0.85} />
                    </mesh>
                    <mesh position={[sx * 4.95, 1.006, -50]} rotation-x={-Math.PI / 2}>
                        <planeGeometry args={[0.6, 200]} />
                        <meshStandardMaterial map={tx.tactile} roughness={0.7} />
                    </mesh>
                    <mesh position={[sx * 4.62, 0.5, -50]}>
                        <boxGeometry args={[0.06, 1, 200]} />
                        <meshStandardMaterial color="#6f6b64" roughness={0.9} />
                    </mesh>

                    <mesh position={[sx * 8.9, 5.74, -50]}>
                        <boxGeometry args={[8.6, 0.05, 200]} />
                        <meshStandardMaterial color="#9fd0cc" transparent opacity={0.4} roughness={0.05} metalness={0.2} envMapIntensity={1.6} depthWrite={false} />
                    </mesh>
                    {[-3, 0, 3].map((dx) => (
                        <mesh key={dx} position={[sx * 8.9 + dx, 5.62, -50]}>
                            <boxGeometry args={[0.14, 0.16, 200]} />
                            <meshStandardMaterial color="#3a3f46" roughness={0.45} metalness={0.6} />
                        </mesh>
                    ))}
                    <mesh position={[sx * 4.6, 5.55, -50]}>
                        <boxGeometry args={[0.12, 0.6, 200]} />
                        <meshStandardMaterial color="#2b2f35" roughness={0.5} metalness={0.5} />
                    </mesh>
                    <mesh position={[sx * 8.9, 5.5, -50]}>
                        <boxGeometry args={[8.2, 0.04, 200]} />
                        <meshStandardMaterial color="#2c3036" roughness={0.8} />
                    </mesh>

                    <mesh position={[sx * 12.8, 3, -50]} receiveShadow>
                        <boxGeometry args={[0.3, 4, 200]} />
                        <meshStandardMaterial color="#a8a299" roughness={0.9} />
                    </mesh>

                    <mesh position={[sx * 30, 9, -50]} rotation-y={sx < 0 ? Math.PI / 2 : -Math.PI / 2}>
                        <planeGeometry args={[320, 18]} />
                        <meshBasicMaterial map={tx.treeNear} transparent alphaTest={0.45} />
                    </mesh>
                    <mesh position={[sx * 62, 15, -50]} rotation-y={sx < 0 ? Math.PI / 2 : -Math.PI / 2}>
                        <planeGeometry args={[420, 30]} />
                        <meshBasicMaterial map={tx.treeFar} transparent alphaTest={0.45} color="#b8c2a8" />
                    </mesh>
                </group>
            ))}

            <mesh position={[0, 30, -195]}>
                <planeGeometry args={[460, 60]} />
                <meshBasicMaterial map={tx.skyline} transparent alphaTest={0.3} />
            </mesh>

            <Instanced count={COLUMN_Z.length * 2} place={placeColumn} shadow={shadows}>
                <boxGeometry args={[0.38, 4.4, 0.38]} />
                <meshStandardMaterial color="#30343a" roughness={0.55} metalness={0.5} />
            </Instanced>
            <Instanced count={COLUMN_Z.length * 2} place={placeColumnBase}>
                <boxGeometry args={[0.6, 0.3, 0.6]} />
                <meshStandardMaterial color="#1f2226" roughness={0.6} metalness={0.4} />
            </Instanced>
            <Instanced count={COLUMN_Z.length * 2} place={placeBeam}>
                <boxGeometry args={[8.4, 0.28, 0.22]} />
                <meshStandardMaterial color="#3a3f46" roughness={0.5} metalness={0.5} />
            </Instanced>
            <Instanced count={RIBS * 2} place={placeRib}>
                <boxGeometry args={[8.6, 0.12, 0.1]} />
                <meshStandardMaterial color="#2f343b" roughness={0.45} metalness={0.6} />
            </Instanced>
            <Instanced count={PEOPLE.length} place={placePerson} shadow={shadows}>
                <capsuleGeometry args={[0.22, 1.1, 4, 10]} />
                <meshStandardMaterial color="#262a31" roughness={0.9} />
            </Instanced>
            {PUDDLES.map(([z, w, l]) => (
                <mesh key={z} rotation-x={-Math.PI / 2} position={[0, 0.006, z]}>
                    <planeGeometry args={[w, l]} />
                    <meshStandardMaterial color="#2c2e31" roughness={0.04} metalness={0.4} envMapIntensity={1.4} transparent opacity={0.85} />
                </mesh>
            ))}
            <Instanced count={LAMP_Z.length * 2} place={placeLamp}>
                <boxGeometry args={[1.5, 0.05, 0.3]} />
                <meshBasicMaterial color="#fff0cf" toneMapped={false} />
            </Instanced>
            <Instanced count={24} place={placeBench} shadow={shadows}>
                <boxGeometry args={[0.5, 0.45, 2.2]} />
                <meshStandardMaterial color="#5b3f2a" roughness={0.7} />
            </Instanced>
            <Instanced count={24} place={placeAdBox}>
                <boxGeometry args={[0.12, 2.3, 3.2]} />
                <meshStandardMaterial color="#fff2d6" emissive="#ffe0a8" emissiveIntensity={0.9} roughness={0.4} />
            </Instanced>

            {[-1, 1].flatMap((sx) =>
                [-6, -46].map((z, i) => (
                    <mesh key={`${sx}${z}`} position={[sx * 6.3, 4.5, z]}>
                        <planeGeometry args={[2.6, 0.65]} />
                        <meshBasicMaterial map={tx.signs[i % 2]} toneMapped={false} />
                    </mesh>
                ))
            )}

            <Instanced count={MAST_Z.length} place={placeMast} shadow={shadows}>
                <boxGeometry args={[0.25, 7.6, 0.25]} />
                <meshStandardMaterial color="#3a3d43" metalness={0.6} roughness={0.45} />
            </Instanced>
            <Instanced count={MAST_Z.length} place={placeBar}>
                <boxGeometry args={[7.2, 0.15, 0.15]} />
                <meshStandardMaterial color="#3a3d43" metalness={0.6} roughness={0.45} />
            </Instanced>
            {TRACK_X.map((x) => (
                <group key={x}>
                    <mesh position={[x, 5.9, 0]}>
                        <boxGeometry args={[0.03, 0.03, 400]} />
                        <meshStandardMaterial color="#b3894d" metalness={0.9} roughness={0.35} />
                    </mesh>
                    <mesh position={[x, 6.4, 0]}>
                        <boxGeometry args={[0.025, 0.025, 400]} />
                        <meshStandardMaterial color="#2a2c30" metalness={0.8} roughness={0.5} />
                    </mesh>
                </group>
            ))}
            <Instanced count={DROPPERS} place={placeDropper}>
                <boxGeometry args={[0.012, 0.5, 0.012]} />
                <meshBasicMaterial color="#26282c" />
            </Instanced>
        </group>
    );
}

/** Physically based sky (or a supplied panorama) that also lights and reflects in the train. */
function Atmosphere() {
    const { gl, scene } = useThree();
    const [panorama, setPanorama] = useState<THREE.Texture | null>(null);

    const sky = useMemo(() => {
        const s = new Sky();
        s.scale.setScalar(450000);
        const u = s.material.uniforms;
        u.turbidity.value = 7;
        u.rayleigh.value = 1.6;
        u.mieCoefficient.value = 0.006;
        u.mieDirectionalG.value = 0.9;
        u.sunPosition.value.set(...SUN).normalize();
        return s;
    }, []);

    const sunGlow = useMemo(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        rg.addColorStop(0, "rgba(255,244,210,0.9)");
        rg.addColorStop(0.25, "rgba(255,222,150,0.45)");
        rg.addColorStop(1, "rgba(255,190,110,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);

    useEffect(() => {
        let cancelled = false;
        let loaded: THREE.Texture | null = null;
        fetch(ENV_URL, { method: "HEAD" })
            .then((r) => {
                if (!r.ok || cancelled) return;
                new THREE.TextureLoader().load(ENV_URL, (t) => {
                    if (cancelled) {
                        t.dispose();
                        return;
                    }
                    t.mapping = THREE.EquirectangularReflectionMapping;
                    t.colorSpace = THREE.SRGBColorSpace;
                    loaded = t;
                    setPanorama(t);
                });
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
            loaded?.dispose();
        };
    }, []);

    useEffect(() => {
        const pmrem = new THREE.PMREMGenerator(gl);
        let target: THREE.WebGLRenderTarget;
        if (panorama) {
            target = pmrem.fromEquirectangular(panorama);
            scene.background = panorama;
            gl.toneMappingExposure = 1;
        } else {
            const envScene = new THREE.Scene();
            envScene.add(sky.clone());
            target = pmrem.fromScene(envScene, 0.04);
            scene.background = null;
            gl.toneMappingExposure = 0.55;
        }
        scene.environment = target.texture;
        scene.environmentIntensity = 1;
        return () => {
            scene.environment = null;
            scene.background = null;
            target.dispose();
            pmrem.dispose();
        };
    }, [gl, scene, sky, panorama]);

    useEffect(
        () => () => {
            sunGlow.dispose();
        },
        [sunGlow]
    );

    const glow: Vec3 = [SUN[0] * 1.75, SUN[1] * 1.75, SUN[2] * 1.75];

    return (
        <>
            {!panorama && <primitive object={sky} />}
            {!panorama && (
                <mesh position={glow}>
                    <planeGeometry args={[120, 120]} />
                    <meshBasicMaterial map={sunGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
                </mesh>
            )}
        </>
    );
}

function Lights({ shadows }: { shadows: boolean }) {
    return (
        <>
            <hemisphereLight args={["#bcd6f0", "#7a6a52", 0.9]} />
            <directionalLight
                position={SUN}
                intensity={5.4}
                color="#ffd199"
                castShadow={shadows}
                shadow-mapSize={[2048, 2048]}
                shadow-camera-near={20}
                shadow-camera-far={260}
                shadow-camera-left={-40}
                shadow-camera-right={40}
                shadow-camera-top={40}
                shadow-camera-bottom={-40}
                shadow-bias={-0.0004}
                shadow-normalBias={0.04}
            />
            <directionalLight position={[-15, 9, 30]} intensity={1.4} color="#fff0d6" />
        </>
    );
}

/** A supplied 3D station: auto-sized and centred, then placed using the calibration values. */
function StationModel({ url }: { url: string }) {
    const gltf = useLoader(GLTFLoader, url, setupLoader);
    const group = useRef<THREE.Group>(null);

    const base = useMemo(() => {
        const scene = gltf.scene.clone(true);
        scene.position.set(0, 0, 0);
        scene.rotation.set(0, 0, 0);
        scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        const k = STATION_TARGET_LENGTH / Math.max(size.x, size.z);

        scene.position.set(-centre.x, -box.min.y, -centre.z);
        const wrapper = new THREE.Group();
        wrapper.add(scene);
        wrapper.scale.setScalar(k);
        wrapper.rotation.y = size.x > size.z ? Math.PI / 2 : 0;
        console.warn(`[TrainStage] station model ready, ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`);
        return wrapper;
    }, [gltf]);

    useFrame(() => {
        const g = group.current;
        if (!g) return;
        g.position.set(stationCal.x, stationCal.y, stationCal.z);
        g.rotation.y = THREE.MathUtils.degToRad(stationCal.rotY);
        g.scale.setScalar(stationCal.scale);
    });

    return (
        <group ref={group}>
            <primitive object={base} />
        </group>
    );
}

/** Guide rails along the train's track, shown while calibrating. */
function Ghost() {
    const group = useRef<THREE.Group>(null);
    useFrame(() => {
        const g = group.current;
        if (!g) return;
        g.visible = stationCal.ghost;
        g.position.set(stationCal.trainX, stationCal.trainY - 0.15, 0);
    });
    return (
        <group ref={group} visible={false}>
            {[-0.7175, 0.7175].map((x) => (
                <mesh key={x} position={[x, 0.2, -100]} renderOrder={50}>
                    <boxGeometry args={[0.06, 0.04, 400]} />
                    <meshBasicMaterial color="#53e0ff" transparent depthTest={false} fog={false} toneMapped={false} />
                </mesh>
            ))}
        </group>
    );
}

interface MotionProps {
    train: MutableRefObject<TrainState>;
    routeRef: MutableRefObject<string>;
    cinemaRef: MutableRefObject<boolean>;
    departRef: MutableRefObject<boolean>;
}

function Mover({ train, cinemaRef, departRef, children }: MotionProps & { children: ReactNode }) {
    const group = useRef<THREE.Group>(null);
    const t = useRef(0);
    const z = useRef(Number.NaN);
    const prev = useRef(0);
    const reel = useRef(false);
    const speed = useRef(0);
    const left = useRef(false);

    useFrame((_, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const half = train.current.half;
        const park = NEAR_Z - half;
        const arriveZ = park - 110;
        if (Number.isNaN(z.current)) {
            z.current = arriveZ;
            prev.current = arriveZ;
        }
        let visible = true;

        if (cinemaRef.current) {
            if (!reel.current) {
                reel.current = true;
                t.current = 0;
            }
            t.current = (t.current + dt) % CYCLE;
            const cz = cycleZ(t.current, park, half);
            visible = cz !== null && cz - half < CAMERA_Z + 6;
            z.current = cz ?? arriveZ;
        } else if (departRef.current) {
            speed.current += 55 * dt;
            z.current += speed.current * dt;
            visible = z.current - half < CAMERA_Z + 6;
            left.current = true;
        } else {
            if (reel.current || left.current) {
                reel.current = false;
                left.current = false;
                speed.current = 0;
                z.current = arriveZ;
            }
            z.current += (park - z.current) * (1 - Math.exp(-dt * 0.9));
        }

        const velocity = Math.abs(z.current - prev.current) / Math.max(dt, 0.001);
        prev.current = z.current;
        sound.setMotion(visible ? velocity / 35 : 0);

        train.current.z = z.current;
        train.current.visible = visible;
        if (group.current) {
            group.current.position.set(stationCal.trainX, stationCal.trainY, z.current);
            group.current.visible = visible;
        }
    });

    return (
        <group ref={group} visible={false}>
            {children}
        </group>
    );
}

function RealTrain({ shadows, train }: { shadows: boolean; train: MutableRefObject<TrainState> }) {
    const gltf = useLoader(GLTFLoader, MODEL_URL, setupLoader);

    const wrapper = useMemo(() => {
        const scene = gltf.scene.clone(true);
        pruneScenery(scene);
        scene.position.set(0, 0, 0);
        scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const alongZ = size.z > size.x;
        const k = TRAIN_WIDTH / (alongZ ? size.x : size.z);

        scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (mesh.isMesh) {
                mesh.castShadow = shadows;
                mesh.receiveShadow = shadows;
            }
        });

        scene.position.set(-center.x, -box.min.y, -center.z);
        const inner = new THREE.Group();
        inner.add(scene);
        inner.scale.setScalar(k);
        inner.rotation.y = (alongZ ? 0 : -Math.PI / 2) + (NOSE_FACES_CAMERA ? 0 : Math.PI);
        train.current.half = ((alongZ ? size.z : size.x) * k) / 2;
        return inner;
    }, [gltf, shadows, train]);

    useEffect(() => {
        console.warn(`[TrainStage] real model ready, length ${(train.current.half * 2).toFixed(0)}`);
    }, [wrapper, train]);

    return <primitive object={wrapper} />;
}

/** Stand-in while the model decodes, or if it fails to load. */
function ProxyTrain({ train }: { train: MutableRefObject<TrainState> }) {
    useEffect(() => {
        train.current.half = 7.5;
    }, [train]);

    return (
        <group>
            <mesh position={[0, 1.95, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <capsuleGeometry args={[1.45, 12, 8, 24]} />
                <meshStandardMaterial color="#dfe3e8" metalness={0.75} roughness={0.22} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
                <boxGeometry args={[2.96, 0.5, 11]} />
                <meshStandardMaterial color="#0e131a" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <boxGeometry args={[2.92, 0.16, 11.5]} />
                <meshStandardMaterial color="#2a8fb8" metalness={0.5} roughness={0.35} />
            </mesh>
        </group>
    );
}

interface RigProps {
    routeRef: MutableRefObject<string>;
    cinemaRef: MutableRefObject<boolean>;
    transitRef: MutableRefObject<boolean>;
    overlay: RefObject<HTMLDivElement | null>;
    train: MutableRefObject<TrainState>;
    spots: MutableRefObject<(HTMLDivElement | null)[]>;
}

function Rig({ routeRef, cinemaRef, transitRef, overlay, train, spots }: RigProps) {
    const posCurve = useMemo(() => new THREE.CatmullRomCurve3(SHOTS.map((s) => new THREE.Vector3(...s.pos))), []);
    const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(SHOTS.map((s) => new THREE.Vector3(...s.look))), []);
    const pos = useRef(new THREE.Vector3(...SHOTS[0].pos));
    const look = useRef(new THREE.Vector3(...SHOTS[0].look));
    const tmp = useRef(new THREE.Vector3());
    const fade = useRef(HOTSPOTS.map(() => 0));
    const dim = useRef(0.03);
    const p = useRef(0);
    const moving = useRef(false);

    useFrame((state, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const route = routeRef.current;
        const cinema = cinemaRef.current;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;

        let target: number;
        if (cinema) target = 0.5 - 0.5 * Math.cos(((state.clock.elapsedTime % CINEMA_SECONDS) / CINEMA_SECONDS) * Math.PI * 2);
        else if (route === "/") target = scrolled;
        else target = clamp((ROUTE_SHOT[route] ?? 0.5) + (scrolled - 0.5) * 0.06, 0, 1);

        const gap = Math.abs(target - p.current);
        if (!moving.current && gap > 0.08) {
            moving.current = true;
            sound.whoosh();
        } else if (moving.current && gap < 0.02) {
            moving.current = false;
        }

        p.current += (target - p.current) * (1 - Math.exp(-dt * (cinema ? 4 : 2.2)));

        const wantPos = posCurve.getPoint(p.current);
        const wantLook = lookCurve.getPoint(p.current);
        wantPos.x += state.pointer.x * 0.9 + (stationCal.trainX - 2.4);
        wantLook.x += stationCal.trainX - 2.4;
        const drift = state.clock.elapsedTime;
        wantPos.x += Math.sin(drift * 0.6) * 0.05;
        wantPos.y += Math.sin(drift * 0.9) * 0.03;
        wantPos.y += state.pointer.y * 0.35;

        const k = 1 - Math.exp(-dt * 3);
        pos.current.lerp(wantPos, k);
        look.current.lerp(wantLook, k);
        state.camera.position.copy(pos.current);
        state.camera.lookAt(look.current);
        state.camera.rotation.z += Math.sin(state.clock.elapsedTime * 0.5) * 0.004;

        const wantDim = cinema || transitRef.current ? 0 : route === "/" ? 0.03 + clamp(window.scrollY / (window.innerHeight * 0.9), 0, 1) * 0.83 : 0.82;
        dim.current += (wantDim - dim.current) * (1 - Math.exp(-dt * 4));
        if (overlay.current) overlay.current.style.opacity = dim.current.toFixed(3);

        const { width, height } = state.size;
        const { half } = train.current;
        const park = NEAR_Z - half;
        const dwell = !cinema && !transitRef.current && route === "/" && window.scrollY < 40 && train.current.visible && Math.abs(train.current.z - park) < 0.4;
        HOTSPOTS.forEach((hs, i) => {
            const el = spots.current[i];
            if (!el) return;
            tmp.current.set(stationCal.trainX - 1.4, stationCal.trainY + hs.y, train.current.z + half - hs.fromNose).project(state.camera);
            const x = (tmp.current.x * 0.5 + 0.5) * width;
            const y = (-tmp.current.y * 0.5 + 0.5) * height;
            const want = dwell && tmp.current.z < 1 ? 1 : 0;
            fade.current[i] += (want - fade.current[i]) * (1 - Math.exp(-dt * 4));
            el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            el.style.opacity = fade.current[i].toFixed(2);
        });
    });

    return null;
}

const FinishShader = {
    uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        time: { value: 0 },
        sun: { value: new THREE.Vector2(0.5, 0.5) },
        rays: { value: 0 },
        res: { value: new THREE.Vector2(1, 1) },
        grain: { value: 0.02 },
    },
    vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform vec2 sun;
        uniform float rays;
        uniform vec2 res;
        uniform float grain;
        varying vec2 vUv;

        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453);
        }

        void main() {
            vec2 uv = vUv;
            vec2 d = uv - 0.5;
            float r = dot(d, d);
            vec2 off = d * r * 0.012;
            vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);

            if (rays > 0.0) {
                vec2 delta = (uv - sun) * (0.9 / 20.0);
                vec2 p = uv;
                float illum = 1.0;
                vec3 acc = vec3(0.0);
                for (int i = 0; i < 20; i++) {
                    p -= delta;
                    vec3 s = texture2D(tDiffuse, p).rgb;
                    float l = smoothstep(0.9, 1.7, max(max(s.r, s.g), s.b));
                    acc += s * l * illum;
                    illum *= 0.95;
                }
                col += acc * rays * 0.05 * vec3(1.0, 0.82, 0.6);
            }

            float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
            col = mix(col, col * vec3(0.92, 1.0, 1.06), smoothstep(0.35, 0.0, lum) * 0.5);
            col = mix(col, col * vec3(1.06, 1.0, 0.9), smoothstep(0.3, 1.0, lum) * 0.5);

            float v = smoothstep(0.95, 0.25, length(d * vec2(res.x / res.y, 1.0) * 0.9));
            col *= mix(0.55, 1.0, v);

            col += (hash(uv * res) - 0.5) * grain;
            gl_FragColor = vec4(col, 1.0);
        }
    `,
};

/** Bloom, sun shafts, colour grade, chromatic edge and vignette: the cinematic finish. */
function Post() {
    const { gl, scene, camera, size } = useThree();
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const sunFar = useMemo(() => new THREE.Vector3(...SUN).normalize().multiplyScalar(500), []);

    const fx = useMemo(() => {
        const target = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType, samples: 2 });
        const composer = new EffectComposer(gl, target);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.45, 0.65, 0.9));
        const finish = new ShaderPass(FinishShader);
        composer.addPass(finish);
        composer.addPass(new OutputPass());
        return { composer, finish };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gl, scene, camera]);

    useEffect(() => {
        const ratio = gl.getPixelRatio();
        fx.composer.setPixelRatio(ratio);
        fx.composer.setSize(size.width, size.height);
        fx.finish.uniforms.res.value.set(size.width * ratio, size.height * ratio);
    }, [fx, gl, size]);

    useEffect(() => () => fx.composer.dispose(), [fx]);

    useFrame((_, delta) => {
        if (!quality.post) {
            gl.render(scene, camera);
            return;
        }
        const u = fx.finish.uniforms;
        u.time.value += delta;
        tmp.copy(camera.position).add(sunFar).project(camera);
        u.sun.value.set(tmp.x * 0.5 + 0.5, tmp.y * 0.5 + 0.5);
        u.rays.value = tmp.z < 1 && Math.abs(tmp.x) < 1.8 && Math.abs(tmp.y) < 1.8 ? 1 : 0;
        fx.composer.render(delta);
    }, 1);

    return null;
}

/** Renders every frame on the hero, at ~30fps once the visitor has scrolled past it. */
function Pacer({ routeRef, cinemaRef }: { routeRef: MutableRefObject<string>; cinemaRef: MutableRefObject<boolean> }) {
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        let raf = 0;
        let last = 0;
        const loop = (now: number) => {
            raf = requestAnimationFrame(loop);
            const hero = cinemaRef.current || (routeRef.current === "/" && window.scrollY < window.innerHeight * 1.2);
            if (now - last >= Math.max(pace.interval, hero ? 0 : 32) - 2) {
                last = now;
                invalidate();
            }
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [invalidate, routeRef, cinemaRef]);
    return null;
}

/** Steps quality down if the hero can't hold ~40fps while the display itself runs faster: shadows, then pixel ratio, then a 30fps cap. */
function Governor({ routeRef, cinemaRef }: { routeRef: MutableRefObject<string>; cinemaRef: MutableRefObject<boolean> }) {
    const { gl, scene, setDpr } = useThree();
    const born = useRef(performance.now());
    const since = useRef(performance.now());
    const frames = useRef(0);
    const bad = useRef(0);
    const level = useRef(0);
    const ticks = useRef(0);

    useEffect(() => {
        let raf = 0;
        const loop = () => {
            ticks.current++;
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);

    useFrame(() => {
        const now = performance.now();
        if (now - born.current < 5000) {
            since.current = now;
            frames.current = 0;
            ticks.current = 0;
            return;
        }
        frames.current++;
        if (now - since.current < 1800) return;

        const elapsed = now - since.current;
        const fps = (frames.current * 1000) / elapsed;
        const display = (ticks.current * 1000) / elapsed;
        frames.current = 0;
        ticks.current = 0;
        since.current = now;

        const hero = cinemaRef.current || (routeRef.current === "/" && window.scrollY < window.innerHeight * 1.2);
        if (!hero) return;
        bad.current = fps < 40 && fps < display * 0.8 ? bad.current + 1 : 0;
        if (bad.current < 2 || level.current >= 4) return;

        bad.current = 0;
        level.current++;
        console.warn(`[TrainStage] low fps (${fps.toFixed(0)}), quality level ${level.current}`);
        if (level.current === 1) quality.post = false;
        else if (level.current === 3) setDpr(1);
        else if (level.current === 4) pace.interval = 33;
        if (level.current === 2) {
            gl.shadowMap.enabled = false;
            scene.traverse((o) => {
                const material = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
                if (!material) return;
                (Array.isArray(material) ? material : [material]).forEach((m) => {
                    m.needsUpdate = true;
                });
            });
        }
    });
    return null;
}

export default function TrainStage() {
    const router = useRouter();
    const routeRef = useRef(router.pathname);
    const cinemaRef = useRef(false);
    const departRef = useRef(false);
    const transitRef = useRef(false);
    const overlay = useRef<HTMLDivElement>(null);
    const train = useRef<TrainState>({ z: -999, half: 7.5, visible: false });
    const spots = useRef<(HTMLDivElement | null)[]>([]);
    const [ready, setReady] = useState(false);
    const [small, setSmall] = useState(false);
    const [cinema, setCinema] = useState(false);
    const [station, setStation] = useState<string | null | undefined>(undefined);
    const [calibrate, setCalibrate] = useState(false);

    useEffect(() => {
        routeRef.current = router.pathname;
    }, [router.pathname]);

    useEffect(() => {
        Object.assign(stationCal, loadStationCal());
        const wants = new URLSearchParams(window.location.search).has("calibrate");
        if (wants) stationCal.ghost = true;
        setCalibrate(wants);
        let off = false;
        const params = new URLSearchParams(window.location.search);
        const force = params.has("bigstation");
        if (!STATION_ENABLED && !params.has("station") && !force) {
            setStation(null);
            return;
        }
        (async () => {
            for (const url of STATION_URLS) {
                try {
                    const r = await fetch(url, { method: "HEAD" });
                    if (!r.ok) continue;
                    const bytes = Number(r.headers.get("content-length") ?? 0);
                    if (bytes > STATION_MAX_BYTES && !force) {
                        console.warn(
                            `[TrainStage] ${url} is ${(bytes / 1048576).toFixed(0)} MB, too large to load. Shrink it with scripts/prepare-station.mjs, or add ?bigstation to force it.`
                        );
                        continue;
                    }
                    if (!off) setStation(url);
                    return;
                } catch {
                    /* try the next one */
                }
            }
            if (!off) setStation(null);
        })();
        return () => {
            off = true;
        };
    }, []);

    useEffect(() => {
        setSmall(window.matchMedia("(max-width: 767px)").matches);
        const start = () => {
            console.info("[TrainStage] starting scene");
            setReady(true);
        };

        let cancel: () => void;
        if ("requestIdleCallback" in window) {
            const id = window.requestIdleCallback(start, { timeout: 1500 });
            cancel = () => window.cancelIdleCallback(id);
        } else {
            const id = window.setTimeout(start, 800);
            cancel = () => window.clearTimeout(id);
        }
        return cancel;
    }, []);

    useEffect(() => {
        const onCinema = (e: Event) => setCinema(Boolean((e as CustomEvent<boolean>).detail));
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCinema(false);
        const onDepart = () => {
            departRef.current = true;
            transitRef.current = true;
        };
        const onArrive = () => {
            departRef.current = false;
            transitRef.current = false;
        };
        window.addEventListener("cinema", onCinema);
        window.addEventListener("keydown", onKey);
        window.addEventListener("train-depart", onDepart);
        window.addEventListener("train-arrive", onArrive);
        return () => {
            window.removeEventListener("cinema", onCinema);
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("train-depart", onDepart);
            window.removeEventListener("train-arrive", onArrive);
        };
    }, []);

    useEffect(() => {
        cinemaRef.current = cinema;
        document.documentElement.classList.toggle("cinema", cinema);
        return () => document.documentElement.classList.remove("cinema");
    }, [cinema]);

    if (!ready) return null;

    const shadows = !small;
    const moved = (child: ReactNode) => (
        <Mover train={train} routeRef={routeRef} cinemaRef={cinemaRef} departRef={departRef}>
            {child}
        </Mover>
    );

    return (
        <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
                <Canvas
                    shadows={shadows ? "percentage" : false}
                    frameloop="demand"
                    dpr={[1, 1.25]}
                    gl={{ antialias: !small, powerPreference: "high-performance" }}
                    camera={{ fov: 44, near: 0.1, far: 500, position: SHOTS[0].pos }}
                    eventSource={document.body}
                    eventPrefix="client"
                >
                    <fog attach="fog" args={["#e3c79e", 45, 230]} />
                    <Atmosphere />
                    <Lights shadows={shadows} />
                    {station === null && <Station shadows={shadows} />}
                    {station && (
                        <>
                            <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
                                <planeGeometry args={[600, 600]} />
                                <meshStandardMaterial color="#4f483f" roughness={1} />
                            </mesh>
                            <Boundary fallback={<Station shadows={shadows} />}>
                                <Suspense fallback={null}>
                                    <StationModel url={station} />
                                </Suspense>
                            </Boundary>
                        </>
                    )}
                    <Ghost />
                    <Boundary fallback={moved(<ProxyTrain train={train} />)}>
                        <Suspense fallback={moved(<ProxyTrain train={train} />)}>{moved(<RealTrain shadows={shadows} train={train} />)}</Suspense>
                    </Boundary>
                    <Rig routeRef={routeRef} cinemaRef={cinemaRef} transitRef={transitRef} overlay={overlay} train={train} spots={spots} />
                    <Pacer routeRef={routeRef} cinemaRef={cinemaRef} />
                    <Governor routeRef={routeRef} cinemaRef={cinemaRef} />
                    <Post />
                </Canvas>

                <div ref={overlay} className="absolute inset-0" style={{ background: "#05070b", opacity: 0.03 }} />
                <div
                    className="absolute inset-0"
                    style={{ background: "radial-gradient(ellipse at 55% 50%, transparent 45%, rgba(0,0,0,0.4) 100%)" }}
                />

                {HOTSPOTS.map((h, i) => (
                    <div
                        key={i}
                        ref={(el) => {
                            spots.current[i] = el;
                        }}
                        className="absolute left-0 top-0 will-change-transform"
                        style={{ opacity: 0 }}
                    >
                        <span className="absolute -left-4 -top-4 grid size-8 place-items-center rounded-full border border-[#8fe8ff] bg-[#8fe8ff]/20 shadow-[0_0_22px_#5fd8ff]">
                            <span className="size-3.5 rounded-full bg-white/90" />
                        </span>
                        {h.label && (
                            <span className="absolute left-7 -top-3 w-44 text-[0.6875rem] font-semibold uppercase leading-tight tracking-wide text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                                {h.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {calibrate && <StationCalibration />}

            {cinema && (
                <button
                    type="button"
                    className="btn btn-quiet pointer-events-auto fixed bottom-8 left-1/2 z-[70] -translate-x-1/2 bg-deep/70 backdrop-blur"
                    onClick={() => setCinema(false)}
                >
                    Exit reel · Esc
                </button>
            )}
        </>
    );
}
