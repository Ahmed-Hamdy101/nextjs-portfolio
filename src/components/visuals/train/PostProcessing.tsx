import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

type Vec3 = [number, number, number];

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
                col += acc * rays * 0.02 * vec3(1.0, 0.82, 0.6);
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
export default function PostProcessing({ quality, sun }: { quality: { post: boolean }; sun: Vec3 }) {
    const { gl, scene, camera, size } = useThree();
    const tmp = useMemo(() => new THREE.Vector3(), []);
    const sunFar = useMemo(() => new THREE.Vector3(...sun).normalize().multiplyScalar(500), [sun]);

    const fx = useMemo(() => {
        const target = new THREE.WebGLRenderTarget(size.width, size.height, { type: THREE.HalfFloatType, samples: 2 });
        const composer = new EffectComposer(gl, target);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.26, 0.5, 1.0));
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
