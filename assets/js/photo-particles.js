import * as THREE from '../libs/three/three.module-r185.min.js';

const SAMPLE_SIZE = 110;
const SCATTER_RADIUS = 6;
const HOVER_SCATTER = 2.4;

function samplePixels(imgEl) {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imgEl, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
}

function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function initPhotoParticles(container, imgEl) {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return () => {};

  const pixels = samplePixels(imgEl);
  const count = SAMPLE_SIZE * SAMPLE_SIZE;

  const formedPositions = new Float32Array(count * 3);
  const scatteredPositions = new Float32Array(count * 3);
  const hoverDirections = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const currentPositions = new Float32Array(count * 3);

  const planeSize = 4.4;
  let i = 0;
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    for (let x = 0; x < SAMPLE_SIZE; x++) {
      const pixelIndex = (y * SAMPLE_SIZE + x) * 4;
      const px = (x / (SAMPLE_SIZE - 1) - 0.5) * planeSize;
      const py = -(y / (SAMPLE_SIZE - 1) - 0.5) * planeSize;

      formedPositions[i * 3] = px;
      formedPositions[i * 3 + 1] = py;
      formedPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;

      scatteredPositions[i * 3] = (Math.random() - 0.5) * SCATTER_RADIUS;
      scatteredPositions[i * 3 + 1] = (Math.random() - 0.5) * SCATTER_RADIUS;
      scatteredPositions[i * 3 + 2] = (Math.random() - 0.5) * SCATTER_RADIUS;

      const angle = Math.random() * Math.PI * 2;
      const dist = 0.4 + Math.random() * 0.6;
      hoverDirections[i * 3] = Math.cos(angle) * dist;
      hoverDirections[i * 3 + 1] = Math.sin(angle) * dist;
      hoverDirections[i * 3 + 2] = (Math.random() - 0.5) * dist;

      colors[i * 3] = pixels[pixelIndex] / 255;
      colors[i * 3 + 1] = pixels[pixelIndex + 1] / 255;
      colors[i * 3 + 2] = pixels[pixelIndex + 2] / 255;

      currentPositions[i * 3] = scatteredPositions[i * 3];
      currentPositions[i * 3 + 1] = scatteredPositions[i * 3 + 1];
      currentPositions[i * 3 + 2] = scatteredPositions[i * 3 + 2];

      i++;
    }
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.052,
    map: createParticleTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let scrollProgress = 0;
  let inView = false;
  let hoverFactor = 0;
  let targetHoverFactor = 0;
  let settleFactor = 0;
  let writtenOpacity = -1;
  const SETTLE_THRESHOLD = 0.8;
  const REST_EPSILON = 0.001;

  const posAttr = geometry.getAttribute('position');
  let frameId = null;
  let lastTime = 0;

  function start() {
    if (frameId !== null || !inView) return;
    lastTime = performance.now();
    frameId = requestAnimationFrame(animate);
  }

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      scrollProgress = entries[0].intersectionRatio;
      inView = entries[0].isIntersecting;
      start();
    },
    { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
  );
  visibilityObserver.observe(container);

  function handleEnter() {
    targetHoverFactor = 1;
    start();
  }
  function handleLeave() {
    targetHoverFactor = 0;
    start();
  }
  container.addEventListener('mouseenter', handleEnter);
  container.addEventListener('mouseleave', handleLeave);

  function animate(now) {
    frameId = null;
    if (!inView) return;

    const dt = Math.min(0.1, Math.max(0, now - lastTime) / 1000);
    lastTime = now;
    const lerpFactor = 1 - Math.pow(0.001, dt);

    hoverFactor += (targetHoverFactor - hoverFactor) * lerpFactor;
    if (Math.abs(targetHoverFactor - hoverFactor) < REST_EPSILON) hoverFactor = targetHoverFactor;

    const settleTarget = scrollProgress > SETTLE_THRESHOLD && targetHoverFactor === 0 ? 1 : 0;
    settleFactor += (settleTarget - settleFactor) * lerpFactor;
    if (Math.abs(settleTarget - settleFactor) < REST_EPSILON) settleFactor = settleTarget;

    if (settleFactor !== writtenOpacity) {
      imgEl.style.opacity = String(settleFactor);
      container.style.opacity = String(1 - settleFactor);
      writtenOpacity = settleFactor;
    }

    let maxOffset = 0;
    for (let p = 0; p < count; p++) {
      const idx = p * 3;
      const baseX = scatteredPositions[idx] + (formedPositions[idx] - scatteredPositions[idx]) * scrollProgress;
      const baseY = scatteredPositions[idx + 1] + (formedPositions[idx + 1] - scatteredPositions[idx + 1]) * scrollProgress;
      const baseZ = scatteredPositions[idx + 2] + (formedPositions[idx + 2] - scatteredPositions[idx + 2]) * scrollProgress;

      const offsetX = baseX + hoverDirections[idx] * HOVER_SCATTER * hoverFactor - currentPositions[idx];
      const offsetY = baseY + hoverDirections[idx + 1] * HOVER_SCATTER * hoverFactor - currentPositions[idx + 1];
      const offsetZ = baseZ + hoverDirections[idx + 2] * HOVER_SCATTER * hoverFactor - currentPositions[idx + 2];

      currentPositions[idx] += offsetX * lerpFactor;
      currentPositions[idx + 1] += offsetY * lerpFactor;
      currentPositions[idx + 2] += offsetZ * lerpFactor;

      maxOffset = Math.max(maxOffset, Math.abs(offsetX), Math.abs(offsetY), Math.abs(offsetZ));
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);

    const atRest = maxOffset < REST_EPSILON && hoverFactor === targetHoverFactor && settleFactor === settleTarget;
    if (!atRest) frameId = requestAnimationFrame(animate);
  }

  function handleResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.render(scene, camera);
  }
  window.addEventListener('resize', handleResize);

  return () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    visibilityObserver.disconnect();
    window.removeEventListener('resize', handleResize);
    container.removeEventListener('mouseenter', handleEnter);
    container.removeEventListener('mouseleave', handleLeave);
    renderer.dispose();
    geometry.dispose();
    material.map.dispose();
    material.dispose();
    imgEl.style.opacity = '';
    container.style.opacity = '';
  };
}
