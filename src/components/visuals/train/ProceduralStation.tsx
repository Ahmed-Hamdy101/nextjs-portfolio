import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";

const TRACK_X = [-2.4, 2.4];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function seeded(seed: number) {
    let s = seed * 9301 + 49297;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
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

export default function ProceduralStation({ shadows }: { shadows: boolean }) {
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
