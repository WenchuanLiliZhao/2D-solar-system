---
name: threejs-skills
description: >-
  Guides Three.js WebGL scenes, controls, lighting, materials, raycasting, particles, performance, and troubleshooting. Use when building or debugging browser 3D, Three.js, WebGL, import-map demos, Vite/npm Three setups, or interactive 3D in this workspace.
---

# Three.js Skills

## Using this skill in Cursor

- **Enable it**: In chat, `@` mention **threejs-skills** (or pick **Agent Skills → threejs-skills**) so this file loads for the task.
- **Project path**: This copy lives at `.cursor/skills/threejs-skills/` in the repo (team-shared project skill).
- **Heavy / data-rich previews**: If the deliverable is an interactive exploration or a layout-heavy artifact, prefer a **Cursor Canvas** (`.canvas.tsx`) per the canvas skill instead of only pasting large snippets in chat.
- **Provenance**: Derived from community Three.js agent guidance; Three.js APIs evolve — verify against the version pinned in `package.json` or your import map.

Systematically create high-quality 3D scenes and interactive experiences using Three.js best practices.

## When to Use
- Requests 3D visualizations or graphics ("create a 3D model", "show in 3D")
- Wants interactive 3D experiences ("rotating cube", "explorable scene")
- Needs WebGL or canvas-based rendering
- Asks for animations, particles, or visual effects
- Mentions Three.js, WebGL, or 3D rendering
- Wants to visualize data in 3D space

## Core Setup Pattern

### 1. Essential Three.js Imports

Use ES module import maps for modern Three.js (r183+):

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
</script>
```

For production with npm/vite/webpack:

```javascript
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
```

### 2. Scene Initialization

Every Three.js artifact needs these core components:

```javascript
// Scene - contains all 3D objects
const scene = new THREE.Scene();

// Camera - defines viewing perspective
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000, // Far clipping plane
);
camera.position.z = 5;

// Renderer - draws the scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
```

### 3. Animation Loop

Use `renderer.setAnimationLoop()` (preferred) or `requestAnimationFrame`:

```javascript
// Preferred: setAnimationLoop (handles WebXR compatibility)
renderer.setAnimationLoop(() => {
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
});

// Alternative: manual requestAnimationFrame
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

## Systematic Development Process

### 1. Define the Scene

Start by identifying:

- **What objects** need to be rendered
- **Camera position** and field of view
- **Lighting setup** required
- **Interaction model** (static, rotating, user-controlled)

### 2. Build Geometry

Choose appropriate geometry types:

**Basic Shapes:**

- `BoxGeometry` - cubes, rectangular prisms
- `SphereGeometry` - spheres, planets
- `CylinderGeometry` - cylinders, tubes
- `PlaneGeometry` - flat surfaces, ground planes
- `TorusGeometry` - donuts, rings

**CapsuleGeometry** is available (stable since r142):

```javascript
new THREE.CapsuleGeometry(0.5, 1, 4, 8); // radius, length, capSegments, radialSegments
```

### 3. Apply Materials

Choose materials based on visual needs:

**Common Materials:**

- `MeshBasicMaterial` - unlit, flat colors (no lighting needed)
- `MeshStandardMaterial` - physically-based, realistic (needs lighting)
- `MeshPhongMaterial` - shiny surfaces with specular highlights
- `MeshLambertMaterial` - matte surfaces, diffuse reflection

```javascript
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  metalness: 0.5,
  roughness: 0.5,
});
```

### 4. Add Lighting

**If using lit materials** (Standard, Phong, Lambert), add lights:

```javascript
// Ambient light - general illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Directional light - like sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);
```

**Skip lighting** if using `MeshBasicMaterial` - it's unlit by design.

### 5. Handle Responsiveness

Always add window resize handling:

```javascript
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

## Common Patterns

### Rotating Object

```javascript
function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.01;
  renderer.render(scene, camera);
}
```

### OrbitControls

With import maps or build tools, OrbitControls works directly:

```javascript
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Update in animation loop
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
```

### Custom Camera Controls (Alternative)

For lightweight custom controls without importing OrbitControls:

```javascript
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener("mousedown", () => {
  isDragging = true;
});

renderer.domElement.addEventListener("mouseup", () => {
  isDragging = false;
});

renderer.domElement.addEventListener("mousemove", (event) => {
  if (isDragging) {
    const deltaX = event.clientX - previousMousePosition.x;
    const deltaY = event.clientY - previousMousePosition.y;

    // Rotate camera around scene
    const rotationSpeed = 0.005;
    camera.position.x += deltaX * rotationSpeed;
    camera.position.y -= deltaY * rotationSpeed;
    camera.lookAt(scene.position);
  }

  previousMousePosition = { x: event.clientX, y: event.clientY };
});

// Zoom with mouse wheel
renderer.domElement.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.position.z += event.deltaY * 0.01;
  camera.position.z = Math.max(2, Math.min(20, camera.position.z)); // Clamp
});
```

### Raycasting for Object Selection

Detect mouse clicks and hovers on 3D objects:

```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const clickableObjects = []; // Array of meshes that can be clicked

// Update mouse position
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Detect clicks
window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    // Handle click - change color, scale, etc.
    clickedObject.material.color.set(0xff0000);
  }
});

// Hover effect in animation loop
function animate() {
  requestAnimationFrame(animate);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  // Reset all objects
  clickableObjects.forEach((obj) => {
    obj.scale.set(1, 1, 1);
  });

  // Highlight hovered object
  if (intersects.length > 0) {
    intersects[0].object.scale.set(1.2, 1.2, 1.2);
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
  }

  renderer.render(scene, camera);
}
```

### Particle System

```javascript
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 1000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
  posArray[i] = (Math.random() - 0.5) * 10;
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(posArray, 3),
);

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.02,
  color: 0xffffff,
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);
```

### User Interaction (Mouse Movement)

```javascript
let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

function animate() {
  requestAnimationFrame(animate);
  camera.position.x = mouseX * 2;
  camera.position.y = mouseY * 2;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}
```

### Loading Textures

```javascript
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("texture-url.jpg");

const material = new THREE.MeshStandardMaterial({
  map: texture,
});
```

## Best Practices

### Performance

- **Reuse geometries and materials** when creating multiple similar objects
- **Use `BufferGeometry`** for custom shapes (more efficient)
- **Limit particle counts** to maintain 60fps (start with 1000-5000)
- **Dispose of resources** when removing objects:
  ```javascript
  geometry.dispose();
  material.dispose();
  texture.dispose();
  ```

### Visual Quality

- Always set `antialias: true` on renderer for smooth edges
- Use appropriate camera FOV (45-75 degrees typical)
- Position lights thoughtfully - avoid overlapping multiple bright lights
- Add ambient + directional lighting for realistic scenes

### Code Organization

- Initialize scene, camera, renderer at the top
- Group related objects (e.g., all particles in one group)
- Keep animation logic in the animate function
- Separate object creation into functions for complex scenes

### Common Pitfalls to Avoid

- ❌ Using `outputEncoding` instead of `outputColorSpace` (renamed in r152)
- ❌ Forgetting to add objects to scene with `scene.add()`
- ❌ Using lit materials without adding lights
- ❌ Not handling window resize
- ❌ Forgetting to call `renderer.render()` in animation loop
- ❌ Using `THREE.Clock` without considering `THREE.Timer` (recommended in r183)

## Example Workflow

User: "Create an interactive 3D sphere that responds to mouse movement"

1. **Setup**: Import Three.js, create scene/camera/renderer
2. **Geometry**: Create `SphereGeometry(1, 32, 32)` for smooth sphere
3. **Material**: Use `MeshStandardMaterial` for realistic look
4. **Lighting**: Add ambient + directional lights
5. **Interaction**: Track mouse position, update camera
6. **Animation**: Rotate sphere, render continuously
7. **Responsive**: Add window resize handler
8. **Result**: Smooth, interactive 3D sphere ✓

## Troubleshooting

**Black screen / Nothing renders:**

- Check if objects added to scene
- Verify camera position isn't inside objects
- Ensure renderer.render() is called
- Add lights if using lit materials

**Poor performance:**

- Reduce particle count
- Lower geometry detail (segments)
- Reuse materials/geometries
- Check browser console for errors

**Objects not visible:**

- Check object position vs camera position
- Verify material has visible color/properties
- Ensure camera far plane includes objects
- Add lighting if needed

## Summary

Three.js artifacts require systematic setup:

1. Import Three.js via import maps or build tools
2. Initialize scene, camera, renderer
3. Create geometry + material = mesh
4. Add lighting if using lit materials
5. Implement animation loop (prefer `setAnimationLoop`)
6. Handle window resize
7. Set `renderer.outputColorSpace = THREE.SRGBColorSpace`

Follow these patterns for reliable, performant 3D experiences.

## Additional reference

For portfolio-grade shadows, environment maps, fog, post-processing entry points, WebGPU, `THREE.Timer`, GSAP, scroll-sync, LOD/instancing, GLTF loading, and stack notes, see [reference.md](reference.md).

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
