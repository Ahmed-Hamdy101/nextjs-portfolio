import { useEffect, useMemo, useRef, useState, MutableRefObject } from "react";
import { useRouter } from "next/router";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BRASS = "#d9a441";
const BRASS_DEEP = "#ecc06b";
const NIGHT = "#05070b";
const GROUND_Y = -2.6;

const ROUTE_STOPS: Record<string, number> = {
    "/": 0.1,
    "/projects": 0.3,
    "/projects/[slug]": 0.36,
    "/work": 0.44,
    "/skills": 0.53,
    "/services": 0.62,
    "/about": 0.71,
    "/testimonials": 0.8,
    "/schedule": 0.88,
    "/contact": 0.95,
};
const HOME_RANGE: [number, number] = [0.08, 0.27];
const STATION_AT = Array.from(new Set(Object.values(ROUTE_STOPS))).filter((u) => u > 0.1);

const UP = new THREE.Vector3(0, 1, 0);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function seeded(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function sideOf(tangent: THREE.Vector3) {
    return new THREE.Vector3().crossVectors(UP, tangent).normalize();
}

function useTrack() {
    return useMemo(() => {
        const points = Array.from(
            { length: 16 },
            (_, i) => new THREE.Vector3(Math.sin(i * 0.85) * 16, Math.sin(i * 0.5) * 1.6, i * 26)
        );
        const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
        return { curve, length: curve.getLength() };
    }, []);
}

type Track = ReturnType<typeof useTrack>;

function Rails({ curve }: { curve: THREE.CatmullRomCurve3 }) {
    const { geometries, sleepers } = useMemo(() => {
        const N = 900;
        const left: THREE.Vector3[] = [];
        const right: THREE.Vector3[] = [];
        for (let i = 0; i <= N; i++) {
            const t = i / N;
            const p = curve.getPointAt(t);
            const side = sideOf(curve.getTangentAt(t));
            left.push(p.clone().addScaledVector(side, 0.72));
            right.push(p.clone().addScaledVector(side, -0.72));
        }
        const tube = (pts: THREE.Vector3[]) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, 0.07, 5, false);
        return { geometries: [tube(left), tube(right)], sleepers: 720 };
    }, [curve]);

    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const mesh = ref.current;
        if (!mesh) return;
        const dummy = new THREE.Object3D();
        for (let i = 0; i < sleepers; i++) {
            const t = i / (sleepers - 1);
            const p = curve.getPointAt(t);
            dummy.position.copy(p).add(new THREE.Vector3(0, -0.12, 0));
            dummy.lookAt(p.clone().add(curve.getTangentAt(t)));
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [curve, sleepers]);

    return (
        <group>
            {geometries.map((g, i) => (
                <mesh key={i} geometry={g}>
                    <meshStandardMaterial color="#8d97a6" metalness={0.9} roughness={0.35} />
                </mesh>
            ))}
            <instancedMesh ref={ref} args={[undefined, undefined, sleepers]}>
                <boxGeometry args={[2.2, 0.12, 0.34]} />
                <meshStandardMaterial color="#141922" roughness={0.9} />
            </instancedMesh>
        </group>
    );
}

function Scenery({ curve }: { curve: THREE.CatmullRomCurve3 }) {
    const trees = useRef<THREE.InstancedMesh>(null);
    const lamps = useRef<THREE.InstancedMesh>(null);
    const poles = useRef<THREE.InstancedMesh>(null);
    const TREES = 260;
    const LAMPS = 44;

    useEffect(() => {
        const rand = seeded(7);
        const dummy = new THREE.Object3D();

        if (trees.current) {
            for (let i = 0; i < TREES; i++) {
                const t = rand();
                const p = curve.getPointAt(t);
                const side = sideOf(curve.getTangentAt(t));
                const offset = (7 + rand() * 48) * (rand() < 0.5 ? -1 : 1);
                const h = 3 + rand() * 6;
                dummy.position.set(p.x + side.x * offset, GROUND_Y + h / 2, p.z + side.z * offset);
                dummy.rotation.set(0, rand() * Math.PI, 0);
                dummy.scale.set(1 + rand() * 0.8, h / 4, 1 + rand() * 0.8);
                dummy.updateMatrix();
                trees.current.setMatrixAt(i, dummy.matrix);
            }
            trees.current.instanceMatrix.needsUpdate = true;
        }

        for (let i = 0; i < LAMPS; i++) {
            const t = (i + 0.5) / LAMPS;
            const p = curve.getPointAt(t);
            const side = sideOf(curve.getTangentAt(t));
            const x = p.x + side.x * 2.6;
            const z = p.z + side.z * 2.6;
            if (poles.current) {
                dummy.position.set(x, (p.y + GROUND_Y) / 2 + 1.2, z);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(1, (p.y - GROUND_Y + 2.4) / 3, 1);
                dummy.updateMatrix();
                poles.current.setMatrixAt(i, dummy.matrix);
            }
            if (lamps.current) {
                dummy.position.set(x, p.y + 2.4, z);
                dummy.scale.set(1, 1, 1);
                dummy.updateMatrix();
                lamps.current.setMatrixAt(i, dummy.matrix);
            }
        }
        if (poles.current) poles.current.instanceMatrix.needsUpdate = true;
        if (lamps.current) lamps.current.instanceMatrix.needsUpdate = true;
    }, [curve]);

    return (
        <group>
            <instancedMesh ref={trees} args={[undefined, undefined, TREES]}>
                <coneGeometry args={[1.4, 4, 6]} />
                <meshStandardMaterial color="#0e1822" flatShading roughness={1} />
            </instancedMesh>
            <instancedMesh ref={poles} args={[undefined, undefined, LAMPS]}>
                <cylinderGeometry args={[0.06, 0.08, 3, 6]} />
                <meshStandardMaterial color="#1b2230" />
            </instancedMesh>
            <instancedMesh ref={lamps} args={[undefined, undefined, LAMPS]}>
                <sphereGeometry args={[0.22, 10, 10]} />
                <meshBasicMaterial color={BRASS_DEEP} toneMapped={false} />
            </instancedMesh>
        </group>
    );
}

function Station({ curve, at }: { curve: THREE.CatmullRomCurve3; at: number }) {
    const { position, quaternion } = useMemo(() => {
        const p = curve.getPointAt(at);
        const tangent = curve.getTangentAt(at);
        const side = sideOf(tangent);
        const holder = new THREE.Object3D();
        holder.position.copy(p).addScaledVector(side, 3.7);
        holder.position.y = p.y - 0.3;
        holder.lookAt(holder.position.clone().add(tangent));
        return { position: holder.position, quaternion: holder.quaternion };
    }, [curve, at]);

    return (
        <group position={position} quaternion={quaternion}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3, 0.5, 16]} />
                <meshStandardMaterial color="#10151d" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.27, 0]}>
                <boxGeometry args={[2.9, 0.04, 15.9]} />
                <meshBasicMaterial color={BRASS} toneMapped={false} />
            </mesh>
            <mesh position={[0.9, 3.3, 0]}>
                <boxGeometry args={[1.7, 0.14, 12]} />
                <meshStandardMaterial color="#1b2230" />
            </mesh>
            {[-5.5, 0, 5.5].map((z) => (
                <mesh key={z} position={[1.6, 1.7, z]}>
                    <boxGeometry args={[0.12, 3.2, 0.12]} />
                    <meshStandardMaterial color="#1b2230" />
                </mesh>
            ))}
            <mesh position={[0.9, 3.15, 0]}>
                <boxGeometry args={[1.5, 0.05, 11.4]} />
                <meshBasicMaterial color={BRASS_DEEP} toneMapped={false} />
            </mesh>
        </group>
    );
}

function Wheel({ roll, radius = 0.45 }: { roll: MutableRefObject<number>; radius?: number }) {
    const ref = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, 0.14, 20).rotateZ(Math.PI / 2), [radius]);
    useFrame(() => {
        if (ref.current) ref.current.rotation.x = roll.current / radius;
    });
    return (
        <mesh ref={ref} geometry={geometry}>
            <meshStandardMaterial color="#0b0e13" metalness={0.7} roughness={0.4} />
            <mesh>
                <boxGeometry args={[0.18, radius * 1.5, 0.1]} />
                <meshStandardMaterial color={BRASS} metalness={0.8} roughness={0.3} />
            </mesh>
        </mesh>
    );
}

function Smoke() {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        refs.current.forEach((m, i) => {
            if (!m) return;
            const t = (clock.elapsedTime * 0.55 + i / 10) % 1;
            m.position.set(0, 2.6 + t * 3.2, 2.1 - t * 3.5);
            m.scale.setScalar(0.25 + t * 0.9);
            (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.32;
        });
    });
    return (
        <group>
            {Array.from({ length: 10 }, (_, i) => (
                <mesh key={i} ref={(el) => { refs.current[i] = el; }}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshBasicMaterial color="#8b94a3" transparent opacity={0} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

function Locomotive({ roll }: { roll: MutableRefObject<number> }) {
    return (
        <group>
            <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[1.5, 0.35, 5.4]} />
                <meshStandardMaterial color="#14181f" metalness={0.6} roughness={0.5} />
            </mesh>
            <mesh position={[0, 1.35, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 3.3, 24]} />
                <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.35, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.66, 0.66, 0.5, 24]} />
                <meshStandardMaterial color="#1b2230" metalness={0.5} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.2, 2.0]}>
                <cylinderGeometry args={[0.15, 0.22, 0.8, 12]} />
                <meshStandardMaterial color="#10141b" />
            </mesh>
            <mesh position={[0, 1.55, -1.6]}>
                <boxGeometry args={[1.5, 1.7, 1.5]} />
                <meshStandardMaterial color="#1b2230" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 2.46, -1.6]}>
                <boxGeometry args={[1.75, 0.12, 1.9]} />
                <meshStandardMaterial color={BRASS_DEEP} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.4, 2.78]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshBasicMaterial color="#fff3c4" toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.6, 4]} intensity={60} distance={34} color="#ffe2a0" />
            {[-1.7, 0, 1.7].flatMap((z) =>
                [-0.82, 0.82].map((x) => (
                    <group key={`${z}${x}`} position={[x, 0.45, z]}>
                        <Wheel roll={roll} />
                    </group>
                ))
            )}
            <Smoke />
        </group>
    );
}

function Wagon({ roll, tint }: { roll: MutableRefObject<number>; tint: string }) {
    return (
        <group>
            <mesh position={[0, 1.1, 0]}>
                <boxGeometry args={[1.6, 1.3, 3.8]} />
                <meshStandardMaterial color={tint} metalness={0.4} roughness={0.55} />
            </mesh>
            <mesh position={[0, 1.8, 0]}>
                <boxGeometry args={[1.7, 0.1, 3.9]} />
                <meshStandardMaterial color="#0e1219" />
            </mesh>
            {[-0.81, 0.81].map((x) => (
                <mesh key={x} position={[x, 1.3, 0]}>
                    <boxGeometry args={[0.03, 0.34, 3.1]} />
                    <meshBasicMaterial color={BRASS} toneMapped={false} />
                </mesh>
            ))}
            {[-1.2, 1.2].flatMap((z) =>
                [-0.82, 0.82].map((x) => (
                    <group key={`${z}${x}`} position={[x, 0.45, z]}>
                        <Wheel roll={roll} />
                    </group>
                ))
            )}
        </group>
    );
}

const WAGON_TINTS = ["#172131", "#1d2838", "#172131"];
const CAR_GAP = [6.4, 11.4, 16.4];

function Scene({ track, routeRef }: { track: Track; routeRef: MutableRefObject<string> }) {
    const { curve, length } = track;
    const u = useRef(HOME_RANGE[0]);
    const roll = useRef(0);
    const cars = useRef<(THREE.Group | null)[]>([]);
    const stars = useRef<THREE.Points>(null);
    const grid = useRef<THREE.GridHelper>(null);
    const camPos = useRef(new THREE.Vector3());
    const camReady = useRef(false);

    const starPositions = useMemo(() => {
        const rand = seeded(11);
        const arr = new Float32Array(900 * 3);
        for (let i = 0; i < 900; i++) {
            const theta = rand() * Math.PI * 2;
            const phi = Math.acos(0.05 + rand() * 0.95);
            const r = 320;
            arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            arr[i * 3 + 1] = r * Math.cos(phi);
            arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return arr;
    }, []);

    const place = (obj: THREE.Object3D, at: number) => {
        const t = clamp(at, 0, 1);
        const p = curve.getPointAt(t);
        obj.position.set(p.x, p.y + 0.02, p.z);
        obj.lookAt(p.clone().add(curve.getTangentAt(t)));
    };

    useFrame((state, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const { scrollY } = window;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? clamp(scrollY / maxScroll, 0, 1) : 0;

        const route = routeRef.current;
        const target =
            route === "/"
                ? HOME_RANGE[0] + (HOME_RANGE[1] - HOME_RANGE[0]) * progress
                : (ROUTE_STOPS[route] ?? 0.5) + (progress - 0.5) * 0.03;

        const prev = u.current;
        const step = (target - prev) * (1 - Math.exp(-dt * 1.5));
        u.current = clamp(prev + clamp(step, -0.3 * dt, 0.3 * dt), HOME_RANGE[0] - 0.02, 0.98);
        const velocity = dt > 0 ? ((u.current - prev) / dt) * length : 0;
        roll.current += velocity * dt;

        cars.current.forEach((car, i) => {
            if (!car) return;
            place(car, u.current - (i === 0 ? 0 : CAR_GAP[i - 1]) / length);
        });

        const head = curve.getPointAt(u.current);
        const tangent = curve.getTangentAt(u.current);
        const side = sideOf(tangent);
        const behind = curve.getPointAt(clamp(u.current - 15 / length, 0, 1));
        const sway = Math.sin(state.clock.elapsedTime * 0.3);

        const desired = behind
            .clone()
            .addScaledVector(side, 3.4 + sway * 1.1 + state.pointer.x * 1.4)
            .addScaledVector(UP, 4.6 + state.pointer.y * 0.8);

        if (!camReady.current) {
            camPos.current.copy(desired);
            camReady.current = true;
        }
        camPos.current.lerp(desired, 1 - Math.exp(-dt * 3.2));
        state.camera.position.copy(camPos.current);
        state.camera.lookAt(head.clone().addScaledVector(tangent, 5).addScaledVector(UP, 1.2));

        const cam = state.camera as THREE.PerspectiveCamera;
        cam.fov += (46 + Math.min(Math.abs(velocity) * 0.12, 18) - cam.fov) * (1 - Math.exp(-dt * 4));
        cam.updateProjectionMatrix();

        if (stars.current) stars.current.position.copy(cam.position);
        if (grid.current) grid.current.position.set(Math.round(cam.position.x / 10) * 10, GROUND_Y, Math.round(cam.position.z / 10) * 10);
    });

    return (
        <>
            <color attach="background" args={[NIGHT]} />
            <fog attach="fog" args={[NIGHT, 30, 170]} />
            <hemisphereLight args={["#6a7a99", "#0b0f16", 0.7]} />
            <directionalLight position={[30, 50, 10]} intensity={0.9} color="#b7c4e0" />

            <points ref={stars}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
                </bufferGeometry>
                <pointsMaterial color="#c9d3e6" size={1.4} sizeAttenuation={false} fog={false} />
            </points>

            <gridHelper ref={grid} args={[700, 70, "#3a2f17", "#121821"]} />

            <Rails curve={curve} />
            <Scenery curve={curve} />
            {STATION_AT.map((at) => (
                <Station key={at} curve={curve} at={at} />
            ))}

            <group ref={(el) => { cars.current[0] = el; }}>
                <Locomotive roll={roll} />
            </group>
            {WAGON_TINTS.map((tint, i) => (
                <group key={i} ref={(el) => { cars.current[i + 1] = el; }}>
                    <Wagon roll={roll} tint={tint} />
                </group>
            ))}
        </>
    );
}

export default function TrainStage() {
    const router = useRouter();
    const routeRef = useRef(router.pathname);
    const [ready, setReady] = useState(false);
    const track = useTrack();

    useEffect(() => {
        routeRef.current = router.pathname;
    }, [router.pathname]);

    useEffect(() => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const small = window.matchMedia("(max-width: 767px)").matches;
        if (reduced || small) return;

        let cancel: () => void;
        if ("requestIdleCallback" in window) {
            const id = window.requestIdleCallback(() => setReady(true), { timeout: 2500 });
            cancel = () => window.cancelIdleCallback(id);
        } else {
            const id = window.setTimeout(() => setReady(true), 1200);
            cancel = () => window.clearTimeout(id);
        }
        return cancel;
    }, []);

    if (!ready) return null;

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
            <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "high-performance" }} camera={{ fov: 46, near: 0.1, far: 500 }}>
                <Scene track={track} routeRef={routeRef} />
            </Canvas>
            <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to bottom, rgba(5,7,11,0.5), rgba(5,7,11,0.78) 60%, rgba(5,7,11,0.9))" }}
            />
        </div>
    );
}
