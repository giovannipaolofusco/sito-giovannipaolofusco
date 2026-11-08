export function canUseWebGL3D() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallViewport = window.matchMedia('(max-width: 600px)').matches;
  const lowMemory = 'deviceMemory' in navigator && navigator.deviceMemory <= 2;
  const lowCores = 'hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 2;

  if (isCoarsePointer && isSmallViewport && (lowMemory || lowCores)) {
    return false;
  }

  let gl;
  try {
    const canvas = document.createElement('canvas');
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (error) {
    return false;
  }

  if (!gl) return false;

  let renderer = String(gl.getParameter(gl.RENDERER) || '');
  if (!renderer || renderer === 'WebKit WebGL') {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
  }
  renderer = renderer.toLowerCase();
  if (renderer.includes('swiftshader') || renderer.includes('software') || renderer.includes('llvmpipe')) {
    return false;
  }

  return true;
}
