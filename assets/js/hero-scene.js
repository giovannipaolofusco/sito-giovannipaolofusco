import * as THREE from '../libs/three/three.module-r185.min.js';

export function initHeroScene(container) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return () => {};

  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-primary')
    .trim() || '#000000';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 9;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  container.classList.add('hero__3d--active');

  const group = new THREE.Group();
  scene.add(group);

  const wireGeometry = new THREE.IcosahedronGeometry(3, 1);
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: accentColor,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
  group.add(wireMesh);

  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    const radius = 5 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i + 2] = radius * Math.cos(phi);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: accentColor,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  let targetRotX = 0;
  let targetRotY = 0;
  let currentRotX = 0;
  let currentRotY = 0;

  function handlePointerMove(event) {
    const nx = (event.clientX / window.innerWidth) * 2 - 1;
    const ny = (event.clientY / window.innerHeight) * 2 - 1;
    targetRotY = nx * 0.5;
    targetRotX = ny * 0.35;
  }
  window.addEventListener('mousemove', handlePointerMove);

  let inView = true;
  let frameId = null;

  function animate() {
    frameId = null;
    if (!inView) return;
    currentRotX += (targetRotX - currentRotX) * 0.04;
    currentRotY += (targetRotY - currentRotY) * 0.04;
    group.rotation.x = currentRotX;
    group.rotation.y += 0.0018;
    group.rotation.y += currentRotY * 0.001;
    particles.rotation.y -= 0.0009;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }

  const visibilityObserver = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    if (inView && frameId === null) frameId = requestAnimationFrame(animate);
  }, { threshold: 0 });
  visibilityObserver.observe(container);

  animate();

  function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', handleResize);

  return () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    window.removeEventListener('mousemove', handlePointerMove);
    window.removeEventListener('resize', handleResize);
    visibilityObserver.disconnect();
    renderer.dispose();
    wireGeometry.dispose();
    wireMaterial.dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
  };
}
