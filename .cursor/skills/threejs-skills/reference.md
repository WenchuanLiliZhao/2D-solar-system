# threejs-skills — reference

Extended patterns for Three.js work in Cursor. Start from [SKILL.md](SKILL.md) for the core workflow.

## Advanced Techniques

### Visual Polish for Portfolio-Grade Rendering

**Shadows:**

```javascript
// Enable shadows on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

// Light that casts shadows
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;

// Configure shadow quality
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

scene.add(directionalLight);

// Objects cast and receive shadows
mesh.castShadow = true;
mesh.receiveShadow = true;

// Ground plane receives shadows
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
```

**Environment Maps & Reflections:**

```javascript
// Create environment map from cubemap
const loader = new THREE.CubeTextureLoader();
const envMap = loader.load([
  "px.jpg",
  "nx.jpg", // positive x, negative x
  "py.jpg",
  "ny.jpg", // positive y, negative y
  "pz.jpg",
  "nz.jpg", // positive z, negative z
]);

scene.environment = envMap; // Affects all PBR materials
scene.background = envMap; // Optional: use as skybox

// Or apply to specific materials
const material = new THREE.MeshStandardMaterial({
  metalness: 1.0,
  roughness: 0.1,
  envMap: envMap,
});
```

**Tone Mapping & Output Encoding:**

```javascript
// Improve color accuracy and HDR rendering
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace; // Was outputEncoding in older versions

// Makes colors more vibrant and realistic
```

**Fog for Depth:**

```javascript
// Linear fog
scene.fog = new THREE.Fog(0xcccccc, 10, 50); // color, near, far

// Or exponential fog (more realistic)
scene.fog = new THREE.FogExp2(0xcccccc, 0.02); // color, density
```

### Custom Geometry from Vertices

```javascript
const geometry = new THREE.BufferGeometry();
const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0]);
geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
```

### Post-Processing Effects

Post-processing effects are available via import maps or build tools. Use `three/addons/postprocessing/*` (for example `EffectComposer`, passes) for bloom, DOF, and similar effects.

### Group Objects

```javascript
const group = new THREE.Group();
group.add(mesh1);
group.add(mesh2);
group.rotation.y = Math.PI / 4;
scene.add(group);
```

## Modern Three.js Practices (r183)

### Modular Imports

```javascript
// With npm/vite/webpack:
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
```

### WebGPU Renderer (Alternative)

Three.js r183 includes a WebGPU renderer as an alternative to WebGL:

```javascript
import { WebGPURenderer } from "three/addons/renderers/webgpu/WebGPURenderer.js";

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init();
renderer.setSize(window.innerWidth, window.innerHeight);
```

WebGPU uses TSL (Three.js Shading Language) instead of GLSL for custom shaders. For custom shaders or TSL, follow current Three.js shader / TSL documentation and examples.

### Timer (r183 Recommended)

`THREE.Timer` is recommended over `THREE.Clock` as of r183:

```javascript
const timer = new THREE.Timer();

renderer.setAnimationLoop(() => {
  timer.update();
  const delta = timer.getDelta();
  const elapsed = timer.getElapsed();

  mesh.rotation.y += delta;
  renderer.render(scene, camera);
});
```

**Benefits over Clock:**

- Not affected by page visibility (pauses when tab is hidden)
- Cleaner API design
- Better integration with `setAnimationLoop`

### Animation Libraries (GSAP Integration)

```javascript
// Smooth timeline-based animations
import gsap from "gsap";

// Instead of manual animation loops:
gsap.to(mesh.position, {
  x: 5,
  duration: 2,
  ease: "power2.inOut",
});

// Complex sequences:
const timeline = gsap.timeline();
timeline
  .to(mesh.rotation, { y: Math.PI * 2, duration: 2 })
  .to(mesh.scale, { x: 2, y: 2, z: 2, duration: 1 }, "-=1");
```

**Why GSAP:**

- Professional easing functions
- Timeline control (pause, reverse, scrub)
- Better than manual lerping for complex animations

### Scroll-Based Interactions

```javascript
// Sync 3D animations with page scroll
let scrollY = window.scrollY;

window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

function animate() {
  requestAnimationFrame(animate);

  // Rotate based on scroll position
  mesh.rotation.y = scrollY * 0.001;

  // Move camera through scene
  camera.position.y = -(scrollY / window.innerHeight) * 10;

  renderer.render(scene, camera);
}
```

**Advanced scroll libraries:**

- ScrollTrigger (GSAP plugin)
- Locomotive Scroll
- Lenis smooth scroll

### Performance Optimization in Production

```javascript
// Level of Detail (LOD)
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0); // Close up
lod.addLevel(mediumDetailMesh, 10); // Medium distance
lod.addLevel(lowDetailMesh, 50); // Far away
scene.add(lod);

// Instanced meshes for many identical objects
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial();
const instancedMesh = new THREE.InstancedMesh(geometry, material, 1000);

// Set transforms for each instance
const matrix = new THREE.Matrix4();
for (let i = 0; i < 1000; i++) {
  matrix.setPosition(
    Math.random() * 100,
    Math.random() * 100,
    Math.random() * 100,
  );
  instancedMesh.setMatrixAt(i, matrix);
}
```

### Modern Loading Patterns

```javascript
// In production, load 3D models:
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
loader.load("model.gltf", (gltf) => {
  scene.add(gltf.scene);

  // Traverse and setup materials
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
});
```

### When to Use What

**Import Map Approach:**

- Quick prototypes and demos
- Educational content
- Artifacts and embedded experiences
- No build step required

**Production Build Approach:**

- Client projects and portfolios
- Complex applications
- Performance-critical applications
- Team collaboration with version control

### Recommended Production Stack

```
Three.js r183 + Vite
├── GSAP (animations)
├── React Three Fiber (optional - React integration)
├── Drei (helper components)
├── Leva (debug GUI)
└── Post-processing effects
```

