const canvas = document.querySelector("#world-canvas");
const mobileMenu = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".main-nav");

mobileMenu.addEventListener("click", () => {
  const isOpen = mobileMenu.getAttribute("aria-expanded") === "true";
  mobileMenu.setAttribute("aria-expanded", String(!isOpen));
  mobileMenu.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  navigation.classList.toggle("is-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("is-open");
    mobileMenu.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-label", "Open navigation");
  });
});

function initializeWorld(THREE) {
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    console.error("WebGL is unavailable; showing the static globe instead.", error);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const particleCount = 500;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.65 + Math.random() * 2.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({ color: 0xcbd6a1, size: 0.012, transparent: true, opacity: 0.62, sizeAttenuation: true }),
  );
  scene.add(particles);

  let frameId;
  const clock = new THREE.Clock();

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.x = width < 500 ? 0.15 : 0.5;
    camera.position.z = width < 500 ? 8.5 : 8;
    camera.updateProjectionMatrix();
  }

  function animate() {
    frameId = window.requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    particles.rotation.y = time * 0.009;
    renderScene();
  }

  function renderScene() {
    renderer.render(scene, camera);
  }

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = undefined;
  });
  canvas.addEventListener("webglcontextrestored", startAnimation);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function startAnimation() {
    if (frameId) window.cancelAnimationFrame(frameId);
    animate();
  }
  function stopAnimation() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = undefined;
    renderScene();
  }

  resize();
  window.addEventListener("resize", resize);
  if (reducedMotion.matches) stopAnimation();
  else startAnimation();
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) stopAnimation();
    else startAnimation();
  });
}

import("three").then(
  (THREE) => initializeWorld(THREE),
  (error) => console.error("Aether's 3D scene could not load; showing the static globe instead.", error),
);
