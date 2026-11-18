import * as THREE from "three";

export interface DoorRig {
    leaves: number;
    /** 0 = shut, 1 = fully open. */
    setOpen(amount: number): void;
}

interface Leaf {
    mesh: THREE.Mesh;
    dir: number;
    travel: number;
}

interface Piece {
    mesh: THREE.Mesh;
    box: THREE.Box3;
}

const DOOR_MESH = /puertaslaterales/i;
// The supplied R46 door-glass mesh has 180 disconnected geometry islands.
const MAX_PIECES = 512;
const CLUSTER_GAP = 0.03;
const MAX_DOOR_WIDTH = 0.15;
const TRAVEL = 0.42;

class UnionFind {
    private parent: Int32Array;

    constructor(size: number) {
        this.parent = new Int32Array(size);
        for (let i = 0; i < size; i++) this.parent[i] = i;
    }

    find(a: number): number {
        while (this.parent[a] !== a) {
            this.parent[a] = this.parent[this.parent[a]];
            a = this.parent[a];
        }
        return a;
    }

    union(a: number, b: number) {
        const ra = this.find(a);
        const rb = this.find(b);
        if (ra !== rb) this.parent[ra] = rb;
    }
}

/** Splits one merged mesh into its disconnected islands, in `root` space. */
function splitIslands(source: THREE.Mesh, quant: number, toRoot: THREE.Matrix4): Piece[] {
    const geo = source.geometry;
    const posAttr = geo.getAttribute("position");
    if (!posAttr) return [];
    const normAttr = geo.getAttribute("normal");
    const uvAttr = geo.getAttribute("uv");
    const index = geo.index;
    const count = posAttr.count;
    const triCount = index ? index.count / 3 : count / 3;
    if (triCount < 2) return [];

    const matrix = new THREE.Matrix4().multiplyMatrices(toRoot, source.matrixWorld);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);
    const world = new Float32Array(count * 3);
    const normals = normAttr ? new Float32Array(count * 3) : null;
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
        v.fromBufferAttribute(posAttr, i).applyMatrix4(matrix);
        world[i * 3] = v.x;
        world[i * 3 + 1] = v.y;
        world[i * 3 + 2] = v.z;
        if (normals && normAttr) {
            v.fromBufferAttribute(normAttr, i).applyMatrix3(normalMatrix).normalize();
            normals[i * 3] = v.x;
            normals[i * 3 + 1] = v.y;
            normals[i * 3 + 2] = v.z;
        }
    }

    const vertexOf = (tri: number, k: number) => (index ? index.getX(tri * 3 + k) : tri * 3 + k);
    const uf = new UnionFind(triCount);
    const seen = new Map<string, number>();
    for (let t = 0; t < triCount; t++) {
        for (let k = 0; k < 3; k++) {
            const i = vertexOf(t, k);
            const key = `${Math.round(world[i * 3] / quant)}|${Math.round(world[i * 3 + 1] / quant)}|${Math.round(world[i * 3 + 2] / quant)}`;
            const prev = seen.get(key);
            if (prev === undefined) seen.set(key, t);
            else uf.union(prev, t);
        }
    }

    const islands = new Map<number, number[]>();
    for (let t = 0; t < triCount; t++) {
        const r = uf.find(t);
        const list = islands.get(r);
        if (list) list.push(t);
        else islands.set(r, [t]);
    }
    if (islands.size < 2 || islands.size > MAX_PIECES) return [];

    const pieces: Piece[] = [];
    islands.forEach((tris) => {
        const p = new Float32Array(tris.length * 9);
        const n = normals ? new Float32Array(tris.length * 9) : null;
        const uv = uvAttr ? new Float32Array(tris.length * 6) : null;
        tris.forEach((t, ti) => {
            for (let k = 0; k < 3; k++) {
                const i = vertexOf(t, k);
                const o = ti * 9 + k * 3;
                p[o] = world[i * 3];
                p[o + 1] = world[i * 3 + 1];
                p[o + 2] = world[i * 3 + 2];
                if (n && normals) {
                    n[o] = normals[i * 3];
                    n[o + 1] = normals[i * 3 + 1];
                    n[o + 2] = normals[i * 3 + 2];
                }
                if (uv && uvAttr) {
                    uv[ti * 6 + k * 2] = uvAttr.getX(i);
                    uv[ti * 6 + k * 2 + 1] = uvAttr.getY(i);
                }
            }
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(p, 3));
        if (n) g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
        if (uv) g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        g.computeBoundingBox();
        const mesh = new THREE.Mesh(g, source.material);
        mesh.name = `${source.name}-leaf`;
        pieces.push({ mesh, box: g.boundingBox!.clone() });
    });
    return pieces;
}

/**
 * The model's side doors are one merged mesh. This splits it into separate leaves, pairs the leaves that sit side by side
 * into doors, and returns a handle that slides each pair apart along the train's length. Returns null when the mesh
 * is missing or does not split cleanly, so the train simply keeps its doors shut.
 */
export function rigDoors(root: THREE.Object3D, axis: "x" | "z"): DoorRig | null {
    root.updateMatrixWorld(true);
    const toRoot = root.matrixWorld.clone().invert();
    const bounds = new THREE.Box3().setFromObject(root).applyMatrix4(toRoot);
    const length = bounds.max[axis] - bounds.min[axis];
    if (!(length > 0)) return null;
    const across = axis === "x" ? "z" : "x";
    const middle = (bounds.min[across] + bounds.max[across]) / 2;
    const quant = length * 1e-5;

    const sources: THREE.Mesh[] = [];
    root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && DOOR_MESH.test(mesh.name) && !Array.isArray(mesh.material)) sources.push(mesh);
    });

    const replaced: THREE.Mesh[] = [];
    const sides: Piece[][] = [[], []];
    for (const source of sources) {
        const pieces = splitIslands(source, quant, toRoot);
        if (!pieces.length) continue;
        replaced.push(source);
        pieces.forEach((piece) => {
            const centre = piece.box.getCenter(new THREE.Vector3());
            sides[centre[across] < middle ? 0 : 1].push(piece);
        });
    }
    if (!replaced.length) return null;

    const leaves: Leaf[] = [];
    for (const side of sides) {
        side.sort((a, b) => a.box.min[axis] - b.box.min[axis]);
        let cluster: Piece[] = [];
        let clusterMax = -Infinity;
        const flush = () => {
            if (!cluster.length) return;
            const lo = Math.min(...cluster.map((p) => p.box.min[axis]));
            const hi = Math.max(...cluster.map((p) => p.box.max[axis]));
            const width = hi - lo;
            if (cluster.length > 1 && width < length * MAX_DOOR_WIDTH) {
                const mid = (lo + hi) / 2;
                cluster.forEach((p) => {
                    const c = (p.box.min[axis] + p.box.max[axis]) / 2;
                    leaves.push({ mesh: p.mesh, dir: c < mid ? -1 : 1, travel: width * TRAVEL });
                });
            }
            cluster = [];
            clusterMax = -Infinity;
        };
        for (const piece of side) {
            if (cluster.length && piece.box.min[axis] - clusterMax > length * CLUSTER_GAP) flush();
            cluster.push(piece);
            clusterMax = Math.max(clusterMax, piece.box.max[axis]);
        }
        flush();
    }

    if (!leaves.length) return null;

    replaced.forEach((mesh) => mesh.removeFromParent());
    sides.forEach((side) => side.forEach((piece) => root.add(piece.mesh)));

    return {
        leaves: leaves.length,
        setOpen(amount: number) {
            for (const leaf of leaves) leaf.mesh.position[axis] = leaf.dir * leaf.travel * amount;
        },
    };
}
