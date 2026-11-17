// Usage: bun scripts/prepare-station.mjs [input.glb] [output.glb] [triangleRatio] [maxTextureSize]
// Needs: bun add -d @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
// Example: bun scripts/prepare-station.mjs public/3d/station.glb public/3d/station-web.glb 0.35 1024
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, inspect, meshopt, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [
    input = "public/3d/station.glb",
    output = "public/3d/station-web.glb",
    ratioArg = "0.35",
    sizeArg = "1024",
] = process.argv.slice(2);
const ratio = Number(ratioArg);
const maxTexture = Number(sizeArg);

await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);

const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

function report(label, doc) {
    const r = inspect(doc);
    const scene = r.scenes?.properties?.[0];
    console.log(`\n== ${label} ==`);
    if (scene) {
        console.log(
            `vertices: ${scene.renderVertexCount ?? "?"}, meshes: ${scene.meshCount ?? "?"}, draw calls (est.): ${scene.drawCallCount ?? "?"}`
        );
    }
    const textures = (r.textures?.properties ?? []).slice().sort((a, b) => (b.size ?? 0) - (a.size ?? 0)).slice(0, 8);
    if (textures.length) {
        console.table(textures.map((t) => ({ name: t.name || t.uri, size: t.resolution, MB: ((t.size ?? 0) / 1048576).toFixed(1) })));
    }
}

const doc = await io.read(input);
report("BEFORE", doc);

await doc.transform(
    prune(),
    dedup(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio, error: 0.01 }),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [maxTexture, maxTexture], quality: 80 }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" })
);

report("AFTER", doc);
await io.write(output, doc);
console.log(`\nWrote ${output}. Aim for under about 15 MB. If it is still large, lower the ratio (e.g. 0.2) or texture size (e.g. 512).`);
