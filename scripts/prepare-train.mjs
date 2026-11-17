// Usage: bun scripts/prepare-train.mjs [input.glb] [output.glb]
// Needs: bun add -d @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [input = "public/3d/high-speed-train.glb", output = "public/3d/train-web.glb"] = process.argv.slice(2);

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });

const doc = await io.read(input);

// The model ships with a 600-unit railway track (Plane_*). The site draws its own track.
const doomed = [];
for (const node of doc.getRoot().listNodes()) {
    if (/^Plane/i.test(node.getName())) node.traverse((n) => doomed.push(n));
}
doomed.forEach((n) => n.dispose());

await doc.transform(
    prune(),
    dedup(),
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [2048, 2048] }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" })
);

await io.write(output, doc);
console.log(`Wrote ${output}`);
