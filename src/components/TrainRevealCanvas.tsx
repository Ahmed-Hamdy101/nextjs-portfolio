import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { MotionValue } from "framer-motion";
import { MODEL_URL, TRAIN_LENGTH, pruneScenery, setupLoader } from "@/lib/train-model";

const CYAN = "#53e0ff";
const L = TRAIN_LENGTH;
const GAP = 0.16 * L;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const keepBelow = () => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const keepAbove = () => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);

/**
 * One train, four stacked renderings of the same geometry. Each layer is clipped to a band along the
 * train's length, so a single scan boundary sweeps nose to tail: outline, flat material, clay light, finish.
 */
function TrainLayers({ progress }: { progress: MotionValue<number> }) {
    const gltf = useLoader(GLTFLoader, MODEL_URL, setupLoader);
    const scan = useRef<THREE.Group>(null);

    const rig = useMemo(() => {
        const base = gltf.scene.clone(true);
        pruneScenery(base);
        base.position.set(0, 0, 0);
        base.rotation.set(0, 0, 0);
        base.scale.set(1, 1, 1);
        base.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(base);
        const size = box.getSize(new THREE.Vector3());
        const middle = box.getCenter(new THREE.Vector3());
        const alongZ = size.z > size.x;
        const longSide = alongZ ? size.z : size.x;
        const widthSide = alongZ ? size.x : size.z;
        const focus = Math.min(longSide, widthSide * 9);
        const k = L / focus;
        const windowCentre = (alongZ ? box.max.z : box.max.x) - focus / 2;
        base.position.set(alongZ ? -middle.x : -windowCentre, -box.min.y, alongZ ? -windowCentre : -middle.z);

        const planes = {
            wire: [keepAbove(), keepBelow()],
            albedo: [keepAbove(), keepBelow()],
            clay: [keepAbove(), keepBelow()],
            finish: [keepBelow()],
        };
        const cropNear = new THREE.Plane(new THREE.Vector3(1, 0, 0), L / 2 + 0.2);
        const cropFar = new THREE.Plane(new THREE.Vector3(-1, 0, 0), L / 2 + 0.2);
        Object.values(planes).forEach((set) => set.push(cropNear, cropFar));
        const created: THREE.Material[] = [];

        const layer = (set: THREE.Plane[], make: (m: THREE.Material) => THREE.Material, order: number) => {
            const root = base.clone(true);
            root.traverse((obj) => {
                const mesh = obj as THREE.Mesh;
                if (!mesh.isMesh) return;
                const swap = (m: THREE.Material) => {
                    const next = make(m);
                    next.clippingPlanes = set;
                    created.push(next);
                    return next;
                };
                mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
                mesh.renderOrder = order;
            });
            const group = new THREE.Group();
            group.add(root);
            group.scale.setScalar(k);
            group.rotation.y = alongZ ? -Math.PI / 2 : Math.PI;
            return group;
        };

        const std = (m: THREE.Material) => m as THREE.MeshStandardMaterial;
        const group = new THREE.Group();
        group.add(
            layer(planes.wire, () => new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.3, depthWrite: false }), 1),
            layer(
                planes.albedo,
                (m) =>
                    new THREE.MeshBasicMaterial({
                        color: std(m).color ? std(m).color.clone() : new THREE.Color(0xffffff),
                        map: std(m).map ?? null,
                        side: m.side,
                    }),
                2
            ),
            layer(planes.clay, () => new THREE.MeshStandardMaterial({ color: "#a3a9b1", roughness: 0.8, metalness: 0.05 }), 3),
            layer(planes.finish, (m) => m.clone(), 4)
        );

        return { group, planes, created, height: size.y * k };
    }, [gltf]);

    useEffect(() => () => rig.created.forEach((m) => m.dispose()), [rig]);

    useFrame(() => {
        const s = clamp(progress.get(), 0, 1);
        const f1 = -L / 2 + s * 1.75 * L;
        const f2 = f1 - GAP;
        const f3 = f2 - GAP;
        const f4 = f3 - GAP;
        const { wire, albedo, clay, finish } = rig.planes;

        wire[0].constant = -f2;
        wire[1].constant = f1;
        albedo[0].constant = -f3;
        albedo[1].constant = f2;
        clay[0].constant = -f4;
        clay[1].constant = f3;
        finish[0].constant = f4;

        if (scan.current) {
            scan.current.visible = s > 0.002 && f1 < L / 2 + 0.2;
            scan.current.position.x = f1;
        }
    });

    return (
        <group>
            <primitive object={rig.group} />
            <group ref={scan} position={[0, rig.height * 0.55, 3]}>
                <mesh renderOrder={20}>
                    <planeGeometry args={[0.05, rig.height * 2.4]} />
                    <meshBasicMaterial color={CYAN} toneMapped={false} depthTest={false} transparent />
                </mesh>
                <mesh renderOrder={19}>
                    <planeGeometry args={[1.1, rig.height * 2.4]} />
                    <meshBasicMaterial color={CYAN} toneMapped={false} depthTest={false} transparent opacity={0.07} blending={THREE.AdditiveBlending} />
                </mesh>
            </group>
        </group>
    );
}

function Studio() {
    return (
        <group>
            <mesh rotation-x={-Math.PI / 2}>
                <circleGeometry args={[60, 64]} />
                <meshStandardMaterial color="#0a0d12" metalness={0.8} roughness={0.38} />
            </mesh>
            <hemisphereLight args={["#5d6b86", "#0a0d12", 0.45]} />
            <spotLight position={[-6, 12, 7]} intensity={900} angle={0.6} penumbra={1} color="#ffb347" />
            <directionalLight position={[10, 5, -10]} intensity={1.4} color="#7fb6ff" />
        </group>
    );
}

function Rig({ progress }: { progress: MotionValue<number> }) {
    const want = useRef(new THREE.Vector3());
    useFrame((state, rawDelta) => {
        const dt = Math.min(rawDelta, 0.05);
        const cam = state.camera as THREE.PerspectiveCamera;
        const aspect = state.size.width / state.size.height;
        const dist = clamp(9.4 / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * aspect), 15, 34);
        const s = clamp(progress.get(), 0, 1);
        want.current.set((s - 0.5) * 2.4 + state.pointer.x * 1.2, 3 + state.pointer.y * 0.6, dist);
        cam.position.lerp(want.current, 1 - Math.exp(-dt * 3));
        cam.lookAt(0, 1.5, 0);
    });
    return null;
}

export default function TrainRevealCanvas({ progress, active }: { progress: MotionValue<number>; active: boolean }) {
    return (
        <Canvas
            frameloop={active ? "always" : "never"}
            dpr={[1, 1.5]}
            camera={{ fov: 35, near: 0.1, far: 200, position: [0, 3, 19] }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            onCreated={({ gl, scene }) => {
                gl.localClippingEnabled = true;
                const pmrem = new THREE.PMREMGenerator(gl);
                scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
                scene.environmentIntensity = 0.4;
                pmrem.dispose();
            }}
        >
            <Studio />
            <Suspense fallback={null}>
                <TrainLayers progress={progress} />
            </Suspense>
            <Rig progress={progress} />
        </Canvas>
    );
}
