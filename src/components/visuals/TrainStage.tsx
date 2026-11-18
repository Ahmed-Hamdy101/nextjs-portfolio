import { Component, lazy, MutableRefObject, ReactNode, RefObject, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { MODEL_URL, pruneScenery, setupLoader } from "@/lib/train-model";
import { sound } from "@/lib/sound";
import { STATION_ENABLED, STATION_MAX_BYTES, STATION_TARGET_LENGTH, STATION_URLS, loadStationCal, stationCal } from "@/config/station";
import StationCalibration from "@/components/visuals/StationCalibration";
import PostProcessing from "./train/PostProcessing";
import { rigDoors } from "@/lib/train-doors";

const ProceduralStation = lazy(() => import("./train/ProceduralStation"));

/** Flip to false if the train's cab ends up at the far end instead of facing the camera. */
const NOSE_FACES_CAMERA = true;

const TRAIN_WIDTH = 2.7;
const NEAR_Z = 21;
const CAMERA_Z = 32;
const CYCLE = 38;
const CINEMA_SECONDS = 48;
const SUN: Vec3 = [-60, 20, -100];

type Vec3 = [number, number, number];

const SHOTS: { pos: Vec3; look: Vec3 }[] = [
    // Hero: square-on to the doors, standing on the platform side, level with the car's waistline.
    { pos: [10.6, 4.1, 15.0], look: [2.4, 4.1, 13.5] },
    { pos: [0.6, 2.8, 30], look: [2.4, 2.4, 8] },
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

if (typeof window !== "undefined") useLoader.preload(GLTFLoader, MODEL_URL, setupLoader);

/** Minimum ms between renders; raised by the quality governor as a last resort. */
const pace = { interval: 0 };

/** Cinematic post-processing; the quality governor switches it off first if the frame rate collapses. */
const quality = { post: true };

interface TrainState {
    z: number;
    half: number;
    visible: boolean;
    /** Ground speed in world units per second, written by the mover. */
    speed: number;
    /** True while the car is standing at the platform. */
    parked: boolean;
}

/**
 * Shared door animation state: the mover owns the target, the loaded car drives
 * its door glazing and interior light from the eased value.
 */
const doors = { open: 0, target: 0 };

/** 0..1 envelope raised when the car docks, used to puff steam harder for a moment. */
const vent = { burst: 0 };

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

/** Mounts only once everything above it in the same Suspense boundary has loaded. */
function Ready({ onReady }: { onReady: () => void }) {
    useEffect(() => {
        onReady();
    }, [onReady]);
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

/** Physically based sky (or a supplied panorama) that also lights and reflects in the train. */
function Atmosphere() {
    const { gl, scene } = useThree();

    const sky = useMemo(() => {
        const s = new Sky();
        s.scale.setScalar(450000);
        const u = s.material.uniforms;
        u.turbidity.value = 7;
        u.rayleigh.value = 1.6;
        u.mieCoefficient.value = 0.003;
        u.mieDirectionalG.value = 0.8;
        u.sunPosition.value.set(...SUN).normalize();
        s.material.fragmentShader = s.material.fragmentShader.replace(
            "gl_FragColor = vec4( texColor, 1.0 );",
            "gl_FragColor = vec4( clamp( texColor, vec3( 0.0 ), vec3( 2.2 ) ), 1.0 );"
        );
        return s;
    }, []);

    const sunGlow = useMemo(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const g = c.getContext("2d")!;
        const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        rg.addColorStop(0, "rgba(255,244,210,0.45)");
        rg.addColorStop(0.25, "rgba(255,222,150,0.16)");
        rg.addColorStop(1, "rgba(255,190,110,0)");
        g.fillStyle = rg;
        g.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    }, []);

    useEffect(() => {
        const pmrem = new THREE.PMREMGenerator(gl);
        const envScene = new THREE.Scene();
        envScene.add(sky.clone());
        const target = pmrem.fromScene(envScene, 0.04);
        scene.background = null;
        gl.toneMappingExposure = 0.55;
        scene.environment = target.texture;
        scene.environmentIntensity = 1;
        return () => {
            scene.environment = null;
            scene.background = null;
            target.dispose();
            pmrem.dispose();
        };
    }, [gl, scene, sky]);

    useEffect(
        () => () => {
            sunGlow.dispose();
        },
        [sunGlow]
    );

    const glow: Vec3 = [SUN[0] * 1.75, SUN[1] * 1.75, SUN[2] * 1.75];

    return (
        <>
            <primitive object={sky} />
            <mesh position={glow}>
                <planeGeometry args={[70, 70]} />
                <meshBasicMaterial map={sunGlow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
            </mesh>
        </>
    );
}

function Lights({ shadows }: { shadows: boolean }) {
    return (
        <>
            <hemisphereLight args={["#bcd6f0", "#7a6a52", 0.9]} />
            <directionalLight
                position={SUN}
                intensity={3.4}
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
    const hold = useRef(0);

    useFrame((_, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const half = train.current.half;
        const park = NEAR_Z - half;
        const arriveZ = park - 36;
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
            hold.current += dt;
            if (hold.current > 0.45) {
                speed.current += 55 * dt;
                z.current += speed.current * dt;
            }
            visible = z.current - half < CAMERA_Z + 6;
            left.current = true;
        } else {
            if (reel.current || left.current) {
                reel.current = false;
                left.current = false;
                speed.current = 0;
                hold.current = 0;
                z.current = arriveZ;
            }
            z.current += (park - z.current) * (1 - Math.exp(-dt * 1.8));
        }

        const velocity = Math.abs(z.current - prev.current) / Math.max(dt, 0.001);
        prev.current = z.current;
        sound.setMotion(visible ? velocity / 35 : 0);

        const parked = visible && !departRef.current && velocity < 1.2 && Math.abs(z.current - park) < 0.5;
        if (parked && !train.current.parked) {
            sound.horn();
            vent.burst = 1;
        }
        if (doors.target !== (parked ? 1 : 0)) {
            doors.target = parked ? 1 : 0;
            sound.doors(parked);
            vent.burst = Math.max(vent.burst, 0.85);
        }

        train.current.z = z.current;
        train.current.visible = visible;
        train.current.speed = velocity;
        train.current.parked = parked;
        if (group.current) {
            group.current.position.set(stationCal.trainX, stationCal.trainY, z.current);
            group.current.visible = visible;
        }
    });

    return (
        <group ref={group} visible={false}>
            <Steam train={train} />
            {children}
        </group>
    );
}

function RealTrain({ shadows, train }: { shadows: boolean; train: MutableRefObject<TrainState> }) {
    const gltf = useLoader(GLTFLoader, MODEL_URL, setupLoader);
    const interior = useRef<THREE.PointLight>(null);

    const rig = useMemo(() => {
        let scene = gltf.scene.clone(true);
        pruneScenery(scene);
        let meshes = 0;
        scene.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) meshes++;
        });
        if (meshes === 0) {
            console.warn("[TrainStage] pruning removed every train mesh, using the unpruned model");
            scene = gltf.scene.clone(true);
        }
        scene.position.set(0, 0, 0);
        scene.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const alongZ = size.z > size.x;
        const k = TRAIN_WIDTH / (alongZ ? size.x : size.z);

        const slide = rigDoors(scene, alongZ ? "z" : "x");
        console.info(slide ? `[TrainStage] sliding doors: ${slide.leaves} leaves` : "[TrainStage] door mesh did not split; keeping doors closed");
        scene.traverse((o) => {
            const mesh = o as THREE.Mesh;
            if (!mesh.isMesh) return;
            mesh.castShadow = shadows;
            mesh.receiveShadow = shadows;
            if (/asiento|seat/i.test(mesh.name)) mesh.visible = false;
        });

        scene.position.set(-center.x, -box.min.y, -center.z);
        const inner = new THREE.Group();
        inner.add(scene);
        inner.scale.setScalar(k);
        inner.rotation.y = (alongZ ? 0 : -Math.PI / 2) + (NOSE_FACES_CAMERA ? 0 : Math.PI);
        train.current.half = ((alongZ ? size.z : size.x) * k) / 2;
        return { inner, slide };
    }, [gltf, shadows, train]);

    useFrame((_, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const opening = doors.target > doors.open;
        const step = dt / (opening ? 3 : 1.2);
        doors.open = opening ? Math.min(doors.target, doors.open + step) : Math.max(doors.target, doors.open - step);
        const amount = doors.open * doors.open * (3 - 2 * doors.open);

        rig.slide?.setOpen(amount);
        if (interior.current) interior.current.intensity = rig.slide ? amount * 9 : 0;
    });

    return (
        <group>
            <primitive object={rig.inner} />
            <pointLight ref={interior} position={[0, 2.3, 0]} color="#ffd7a3" intensity={0} distance={9} decay={2} />
        </group>
    );
}

/** Soft round sprite used by the steam plume. */
function steamTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.4, "rgba(240,244,250,0.35)");
    gradient.addColorStop(1, "rgba(228,236,244,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/** Roof-vent and brake-gear exhaust that drifts back over the platform. */
const STEAM_EMITTERS: Vec3[] = [
    [0, 3.06, -2.6],
    [0, 3.02, 1.9],
    [0.92, 0.5, -5.1],
    [-0.92, 0.5, -5.1],
    [1.32, 1.1, -0.4],
    [-1.32, 1.1, -0.4],
];

function Steam({ train }: { train: MutableRefObject<TrainState> }) {
    const count = 96;
    const geometry = useMemo(() => new THREE.BufferGeometry(), []);
    const texture = useMemo(steamTexture, []);

    const puff = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const rise = new Float32Array(count);
        const drift = new Float32Array(count);
        const age = new Float32Array(count).fill(99);
        const life = new Float32Array(count).fill(1);
        return { positions, rise, drift, age, life };
    }, []);

    const material = useMemo(
        () =>
            new THREE.PointsMaterial({
                map: texture,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                size: 2.7,
                sizeAttenuation: true,
                color: new THREE.Color("#f2f6fb"),
                toneMapped: false,
            }),
        [texture]
    );

    useEffect(() => {
        geometry.setAttribute("position", new THREE.BufferAttribute(puff.positions, 3));
    }, [geometry, puff]);

    useFrame((_, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const state = train.current;
        vent.burst = Math.max(0, vent.burst - dt * 0.55);
        const base = state.visible ? clamp(1 - state.speed / 18, 0.1, 1) : 0;
        const intensity = clamp(base * 0.55 + vent.burst, 0, 1.6);
        material.opacity = 0.5 * intensity;

        const positions = puff.positions;
        for (let i = 0; i < count; i++) {
            puff.age[i] += dt;
            if (puff.age[i] > puff.life[i]) {
                const emitter = STEAM_EMITTERS[i % STEAM_EMITTERS.length];
                positions[i * 3] = emitter[0] + (Math.random() - 0.5) * 0.3;
                positions[i * 3 + 1] = emitter[1] + (Math.random() - 0.5) * 0.14;
                positions[i * 3 + 2] = emitter[2] + (Math.random() - 0.5) * 0.7;
                puff.age[i] = 0;
                puff.life[i] = 2.2 + Math.random() * 2.8;
                puff.rise[i] = 0.4 + Math.random() * 0.8;
                puff.drift[i] = 0.15 + Math.random() * 0.4;
                continue;
            }
            const lift = 0.6 + 0.7 * intensity;
            positions[i * 3 + 1] += puff.rise[i] * dt * lift;
            positions[i * 3 + 2] += puff.drift[i] * dt * (0.7 + intensity * 0.5);
            positions[i * 3] += Math.sin((puff.age[i] + i * 0.7) * 1.6) * (0.014 + intensity * 0.008);
        }
        let attribute = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
        if (!attribute) {
            attribute = new THREE.BufferAttribute(puff.positions, 3);
            geometry.setAttribute("position", attribute);
        }
        attribute.needsUpdate = true;
    });

    return <points geometry={geometry} material={material} frustumCulled={false} />;
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
            <mesh position={[0, 2.55, 6.45]}>
                <boxGeometry args={[2.15, 0.78, 0.08]} />
                <meshStandardMaterial color="#101923" metalness={0.55} roughness={0.16} />
            </mesh>
            <mesh position={[0, 1.35, 0]}>
                <boxGeometry args={[2.92, 0.16, 11.5]} />
                <meshStandardMaterial color="#2a8fb8" metalness={0.5} roughness={0.35} />
            </mesh>
            {[-1.42, 1.42].flatMap((x) => [-4.5, -2.4, -0.3, 1.8, 3.9].map((z) => (
                <mesh key={`${x}-${z}`} position={[x, 2.25, z]}>
                    <boxGeometry args={[0.07, 0.5, 1.35]} />
                    <meshStandardMaterial color="#172633" metalness={0.45} roughness={0.2} />
                </mesh>
            )))}
            {[-0.78, 0.78].map((x) => (
                <mesh key={x} position={[x, 1.45, 7.18]}>
                    <sphereGeometry args={[0.13, 12, 8]} />
                    <meshBasicMaterial color="#ffd992" toneMapped={false} />
                </mesh>
            ))}
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

/** Keep the canvas live only for the visible hero/reel; wake briefly for input and camera settling. */
function Pacer({ routeRef, cinemaRef }: { routeRef: MutableRefObject<string>; cinemaRef: MutableRefObject<boolean> }) {
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        let raf = 0;
        let last = 0;
        let settleUntil = performance.now() + 3500;
        let heroVisible = false;
        let departedAt = 0;
        let observer: IntersectionObserver | undefined;

        const loop = (now: number) => {
            const continuous = cinemaRef.current || heroVisible;
            const active = document.visibilityState !== "hidden" && (continuous || now < settleUntil);
            if (!active) {
                raf = 0;
                return;
            }
            const covered = document.documentElement.classList.contains("transit") && now - departedAt > 600;
            if (!covered && now - last >= Math.max(0, (continuous ? pace.interval : 32) - 2)) {
                last = now;
                invalidate();
            }
            raf = requestAnimationFrame(loop);
        };

        const wake = (settleMs = 800) => {
            settleUntil = Math.max(settleUntil, performance.now() + settleMs);
            if (!raf && document.visibilityState !== "hidden") raf = requestAnimationFrame(loop);
        };

        const observeHero = () => {
            observer?.disconnect();
            observer = undefined;
            heroVisible = false;
            if (routeRef.current !== "/") return;
            const hero = document.getElementById("overview");
            if (hero && "IntersectionObserver" in window) {
                observer = new IntersectionObserver((entries) => {
                    heroVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.15);
                    wake(heroVisible ? 800 : 900);
                }, { threshold: [0, 0.15] });
                observer.observe(hero);
            } else {
                heroVisible = window.scrollY < window.innerHeight * 1.2;
            }
        };

        const onScroll = () => {
            if (!observer) heroVisible = routeRef.current === "/" && window.scrollY < window.innerHeight * 1.2;
            wake(900);
        };
        const onPointerMove = () => wake(220);
        const onCinema = (event: Event) => wake((event as CustomEvent<boolean>).detail ? 1400 : 800);
        const onTransition = (event: Event) => {
            if (event.type === "train-depart") departedAt = performance.now();
            wake(3500);
        };
        const onRoute = () => {
            observeHero();
            wake(3500);
        };
        const onVisibility = () => {
            if (document.visibilityState === "hidden") {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
            } else {
                wake(800);
            }
        };

        observeHero();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("cinema", onCinema);
        window.addEventListener("train-depart", onTransition);
        window.addEventListener("train-arrive", onTransition);
        window.addEventListener("stage-route-change", onRoute);
        document.addEventListener("visibilitychange", onVisibility);
        wake(3500);

        return () => {
            if (raf) cancelAnimationFrame(raf);
            observer?.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("cinema", onCinema);
            window.removeEventListener("train-depart", onTransition);
            window.removeEventListener("train-arrive", onTransition);
            window.removeEventListener("stage-route-change", onRoute);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [invalidate, routeRef, cinemaRef]);
    return null;
}

/** Steps quality down when the active hero cannot hold 28fps. */
function Governor({ routeRef, cinemaRef }: { routeRef: MutableRefObject<string>; cinemaRef: MutableRefObject<boolean> }) {
    const { gl, scene, setDpr } = useThree();
    const born = useRef(performance.now());
    const since = useRef(performance.now());
    const frames = useRef(0);
    const bad = useRef(0);
    const level = useRef(0);

    useFrame(() => {
        const now = performance.now();
        const hero = cinemaRef.current || (routeRef.current === "/" && window.scrollY < window.innerHeight * 1.2);
        if (!hero) {
            since.current = now;
            frames.current = 0;
            bad.current = 0;
            return;
        }
        if (now - since.current > 2500) {
            since.current = now;
            frames.current = 0;
            bad.current = 0;
            return;
        }
        if (now - born.current < 5000) {
            since.current = now;
            frames.current = 0;
            return;
        }
        frames.current++;
        if (now - since.current < 1800) return;

        const elapsed = now - since.current;
        const fps = (frames.current * 1000) / elapsed;
        frames.current = 0;
        since.current = now;

        bad.current = fps < 28 ? bad.current + 1 : 0;
        if (bad.current < 2 || level.current >= 4) return;

        bad.current = 0;
        level.current++;
        console.info(`[TrainStage] low fps (${fps.toFixed(0)}), quality level ${level.current}`);
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
    const train = useRef<TrainState>({ z: -999, half: 7.5, visible: false, speed: 0, parked: false });
    const spots = useRef<(HTMLDivElement | null)[]>([]);
    const [ready, setReady] = useState(false);
    const [small, setSmall] = useState(false);
    const [cinema, setCinema] = useState(false);
    const [station, setStation] = useState<string | null | undefined>(undefined);
    const [stationReady, setStationReady] = useState(false);
    const [trainReady, setTrainReady] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [calibrate, setCalibrate] = useState(false);

    useEffect(() => {
        routeRef.current = router.pathname;
        window.dispatchEvent(new Event("stage-route-change"));
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
                    useLoader.preload(GLTFLoader, url, setupLoader);
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
        const id = window.setTimeout(() => setTimedOut(true), 8000);
        return () => window.clearTimeout(id);
    }, []);

    useEffect(() => {
        setSmall(window.matchMedia("(max-width: 767px)").matches);
        const start = () => {
            console.info("[TrainStage] starting scene");
            setReady(true);
        };

        const id = window.requestAnimationFrame(start);
        return () => window.cancelAnimationFrame(id);
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

    // Browsers block audio until a gesture: the first time sound is switched on while the
    // car is standing at the platform, greet the listener with the horn so it is audible.
    useEffect(() => {
        const unsubscribe = sound.subscribe(() => {
            if (!sound.isEnabled()) return;
            window.setTimeout(() => sound.horn(), 350);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    if (!ready) return null;

    const shadows = false;
    const onStationReady = () => setStationReady(true);
    const onTrainReady = () => setTrainReady(true);
    const shown = timedOut || ((station === null || stationReady) && trainReady);
    const moved = (child: ReactNode) => (
        <Mover train={train} routeRef={routeRef} cinemaRef={cinemaRef} departRef={departRef}>
            {child}
        </Mover>
    );

    return (
        <>
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[#05070b]"
                style={{ opacity: shown ? 1 : 0, transition: "opacity 1.1s ease-out" }}
            >
                <Canvas
                    shadows={shadows ? "percentage" : false}
                    frameloop="demand"
                    dpr={1}
                    gl={{ antialias: !small, powerPreference: "high-performance" }}
                    camera={{ fov: 44, near: 0.1, far: 500, position: SHOTS[0].pos }}
                    eventSource={document.body}
                    eventPrefix="client"
                >
                    <fog attach="fog" args={["#e3c79e", 45, 230]} />
                    <Atmosphere />
                    <Lights shadows={shadows} />
                    {station === null && <Suspense fallback={null}><ProceduralStation shadows={shadows} /></Suspense>}
                    {station && (
                        <>
                            <mesh position={[0, -0.05, 0]} rotation-x={-Math.PI / 2}>
                                <planeGeometry args={[600, 600]} />
                                <meshStandardMaterial color="#4f483f" roughness={1} />
                            </mesh>
                            <Boundary
                                fallback={
                                    <>
                                        <Suspense fallback={null}>
                                            <ProceduralStation shadows={shadows} />
                                        </Suspense>
                                        <Ready onReady={onStationReady} />
                                    </>
                                }
                            >
                                <Suspense fallback={null}>
                                    <StationModel url={station} />
                                    <Ready onReady={onStationReady} />
                                </Suspense>
                            </Boundary>
                        </>
                    )}
                    <Ghost />
                    <Boundary
                        fallback={
                            <>
                                {moved(<ProxyTrain train={train} />)}
                                <Ready onReady={onTrainReady} />
                            </>
                        }
                    >
                        <Suspense fallback={moved(<ProxyTrain train={train} />)}>
                            {moved(<RealTrain shadows={shadows} train={train} />)}
                            <Ready onReady={onTrainReady} />
                        </Suspense>
                    </Boundary>
                    <Rig routeRef={routeRef} cinemaRef={cinemaRef} transitRef={transitRef} overlay={overlay} train={train} spots={spots} />
                    <Pacer routeRef={routeRef} cinemaRef={cinemaRef} />
                    <Governor routeRef={routeRef} cinemaRef={cinemaRef} />
                    <PostProcessing quality={quality} sun={SUN} />
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
                        <span className="absolute -left-2.5 -top-2.5 grid size-5 place-items-center rounded-full border border-[#8fe8ff] bg-[#8fe8ff]/20 shadow-[0_0_12px_#5fd8ff]">
                            <span className="size-2 rounded-full bg-white/90" />
                        </span>
                        {h.label && (
                            <span className="absolute left-5 -top-3 w-44 text-[0.6875rem] font-semibold uppercase leading-tight tracking-wide text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
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
