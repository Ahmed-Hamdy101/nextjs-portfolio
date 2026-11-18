import * as THREE from "three";
import type { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export const MODEL_URL = "/3d/r46-subway.glb";
/** Length the reveal section fits the front of the train into. */
export const TRAIN_LENGTH = 15;

const DRACO_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

export function setupLoader(loader: GLTFLoader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_PATH);
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
}

/**
 * Removes baked-in scenery so only the train is measured and drawn: anything with a track, rail or
 * ground material, and any single mesh longer than `maxExtent` (a train car is far shorter than that).
 */
export function pruneScenery(root: THREE.Object3D, maxExtent = 90) {
    root.updateMatrixWorld(true);
    const doomed: THREE.Object3D[] = [];
    const box = new THREE.Box3();
    const size = new THREE.Vector3();

    root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const scenery = /ads|plane_black|coke|cantrash|joineddecals|maleta|luggage|poster|trash/i.test(mesh.name);
        if (scenery || materials.some((m) => /track|rail|ground|floor|cantrash|joineddecals|maleta|poster|ads/i.test(m.name))) {
            doomed.push(mesh);
            return;
        }
        box.setFromObject(mesh).getSize(size);
        if (Math.max(size.x, size.y, size.z) > maxExtent) doomed.push(mesh);
    });

    doomed.forEach((o) => o.removeFromParent());
}
