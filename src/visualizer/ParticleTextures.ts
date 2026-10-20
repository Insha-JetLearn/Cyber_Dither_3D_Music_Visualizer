import * as THREE from 'three';
import { ParticleShape } from '../types/visualizer';

const textureCache = new Map<ParticleShape, THREE.Texture>();

export function getParticleTexture(shape: ParticleShape): THREE.Texture {
  if (textureCache.has(shape)) {
    return textureCache.get(shape)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const cx = 64;
  const cy = 64;

  ctx.clearRect(0, 0, 128, 128);

  if (shape === 'circle') {
    // Soft radial glow circle
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'diamond') {
    // Glowing diamond
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(-38, -38, 76, 76);
    ctx.restore();
  } else if (shape === 'star') {
    // 4-point cyber star
    ctx.save();
    ctx.translate(cx, cy);

    // Center glow
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 35);
    centerGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    centerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
    centerGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fill();

    // Spikes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.quadraticCurveTo(0, 0, 60, 0);
    ctx.quadraticCurveTo(0, 0, 0, 60);
    ctx.quadraticCurveTo(0, 0, -60, 0);
    ctx.quadraticCurveTo(0, 0, 0, -60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (shape === 'cross') {
    // Cyber reticle cross
    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    // Horizontal bar
    ctx.fillRect(-52, -7, 104, 14);
    // Vertical bar
    ctx.fillRect(-7, -52, 14, 104);

    // Center bright core
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  textureCache.set(shape, texture);

  return texture;
}
