import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AudioAnalysisData, VisualizerMode, VisualizerSettings } from '../types/visualizer';
import { DitherShader } from './DitherShader';
import { getParticleTexture } from './ParticleTextures';

// Reusable math instances to avoid GC allocations in render loop
const _vec3 = new THREE.Vector3();
const _color1 = new THREE.Color();
const _color2 = new THREE.Color();
const _color3 = new THREE.Color();
const _ray = new THREE.Ray();
const _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

interface BurstParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

interface TrailParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  size: number;
}

export class VisualizerScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private ditherPass: ShaderPass;

  // Scene state
  private mode: VisualizerMode = 'galaxy';
  private settings: VisualizerSettings;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Mode objects
  private currentModeGroup = new THREE.Group();
  private starDustPoints: THREE.Points | null = null;

  // Galaxy Mode Data
  private galaxyPoints: THREE.Points | null = null;
  private galaxyInitialPositions: Float32Array | null = null;
  private galaxyAngles: Float32Array | null = null;
  private galaxyDistances: Float32Array | null = null;

  // Tunnel Mode Data
  private tunnelPoints: THREE.Points | null = null;
  private tunnelRingsGroup: THREE.Group | null = null;
  private tunnelSpeeds: Float32Array | null = null;

  // Wave Mode Data
  private waveMesh: THREE.Mesh | null = null;
  private wavePoints: THREE.Points | null = null;
  private waveGridSize = 64;

  // Spectrum Mode Data
  private spectrumGroup: THREE.Group | null = null;
  private spectrumBars: THREE.Mesh[] = [];

  // Starfield Mode Data
  private starfieldPoints: THREE.Points | null = null;
  private starfieldVelocities: Float32Array | null = null;

  // Reactor Mode Data
  private reactorGroup: THREE.Group | null = null;
  private reactorCore: THREE.Mesh | null = null;
  private reactorRings: THREE.Mesh[] = [];
  private reactorParticles: THREE.Points | null = null;

  // Particle Explosions (Beats / Clicks)
  private burstParticles: BurstParticle[] = [];
  private burstGeometry: THREE.BufferGeometry | null = null;
  private burstPoints: THREE.Points | null = null;
  private maxBurstCount = 1200;

  // Mouse Trail System
  private mouseTrail: TrailParticle[] = [];
  private trailGeometry: THREE.BufferGeometry | null = null;
  private trailPoints: THREE.Points | null = null;
  private maxTrailCount = 300;
  private mousePosition2D = new THREE.Vector2(-999, -999);
  private mousePosition3D = new THREE.Vector3(0, 0, 0);
  private isPointerDown = false;

  // FPS calculation
  private fps = 60;
  private frameCount = 0;
  private lastFpsUpdate = performance.now();

  // Audio state
  private currentAudioData: AudioAnalysisData = {
    frequencyData: new Uint8Array(64),
    waveformData: new Uint8Array(64).fill(128),
    bass: 0,
    mid: 0,
    treble: 0,
    volume: 0,
    isBeat: false,
    beatIntensity: 0,
    spectrumBands: new Array(16).fill(0),
    rawEnergy: 0,
  };

  // Warp speed transition
  private currentWarpFactor = 0; // 0 to 1 smooth interpolated
  private targetFov = 60;

  constructor(container: HTMLElement, settings: VisualizerSettings) {
    this.container = container;
    this.settings = { ...settings };

    // 1. WebGL Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Bloom + Dither handles smoothing efficiently
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030308);
    this.scene.fog = new THREE.FogExp2(0x030308, 0.0018);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 3000);
    this.camera.position.set(0, 40, 160);

    // 3. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 600;
    this.controls.minDistance = 15;
    this.controls.autoRotate = this.settings.autoRotate;
    this.controls.autoRotateSpeed = 0.8;

    // 4. Lighting Rig (3-point cyberpunk lighting)
    const ambientLight = new THREE.AmbientLight(0x111122, 1.2);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    keyLight.position.set(100, 150, 80);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff007f, 2.0);
    rimLight.position.set(-100, -50, -80);
    this.scene.add(rimLight);

    // 5. Post Processing Composer
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Unreal Bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      this.settings.bloomIntensity,
      0.4,
      0.85
    );
    this.composer.addPass(this.bloomPass);

    // Dither & CRT Scanline Shader
    this.ditherPass = new ShaderPass(DitherShader);
    this.ditherPass.uniforms.uResolution.value.set(width, height);
    this.ditherPass.uniforms.uDitherIntensity.value = this.settings.ditherEnabled
      ? this.settings.ditherIntensity
      : 0.0;
    this.ditherPass.uniforms.uDitherScale.value = this.settings.ditherScale;
    this.ditherPass.uniforms.uScanlines.value = this.settings.scanlines ? 0.28 : 0.0;
    this.ditherPass.uniforms.uChromaticAberration.value = this.settings.chromaticAberration;
    this.ditherPass.uniforms.uEnabled.value = this.settings.ditherEnabled ? 1.0 : 0.0;
    this.composer.addPass(this.ditherPass);

    // 6. Init Global Elements
    this.scene.add(this.currentModeGroup);
    this.initStarDust();
    this.initBurstSystem();
    this.initMouseTrailSystem();

    // 7. Init Active Visualizer Mode
    this.setMode(this.settings.warpSpeed ? 'tunnel' : 'galaxy');

    // 8. Event Listeners
    this.setupEventListeners();

    // 9. Start Render Loop
    this.animate();
  }

  // ==================== STAR DUST (AMBIENT PARTICLES) ====================
  private initStarDust(): void {
    const count = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 250 + Math.random() * 850;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Subtle cyan/violet stars
      const mix = Math.random();
      _color1.set(this.settings.primaryColor);
      _color2.set(this.settings.accentColor);
      _color1.lerp(_color2, mix);

      colors[i * 3] = _color1.r * 0.7;
      colors[i * 3 + 1] = _color1.g * 0.7;
      colors[i * 3 + 2] = _color1.b * 0.7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      map: getParticleTexture('circle'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starDustPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starDustPoints);
  }

  // ==================== BURST SYSTEM (EXPLOSIONS) ====================
  private initBurstSystem(): void {
    this.burstGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxBurstCount * 3);
    const colors = new Float32Array(this.maxBurstCount * 3);
    const sizes = new Float32Array(this.maxBurstCount);

    this.burstGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.burstGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.burstGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: getParticleTexture(this.settings.particleShape),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.burstPoints = new THREE.Points(this.burstGeometry, material);
    this.scene.add(this.burstPoints);
  }

  public triggerBurst(origin = new THREE.Vector3(0, 0, 0), count = 180, intensity = 1.0): void {
    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    for (let i = 0; i < count; i++) {
      if (this.burstParticles.length >= this.maxBurstCount) {
        this.burstParticles.shift();
      }

      // Random spherical velocity
      const speed = (20 + Math.random() * 60) * intensity * (this.settings.warpSpeed ? 2.0 : 1.0);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const vel = new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi)
      );

      const color = _color1.clone().lerp(_color2, Math.random());
      const maxLife = 0.5 + Math.random() * 0.8;

      this.burstParticles.push({
        pos: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4)),
        vel,
        color,
        life: maxLife,
        maxLife,
        size: (this.settings.particleSize * 1.5 + Math.random() * 4) * intensity,
      });
    }
  }

  // ==================== MOUSE TRAIL SYSTEM ====================
  private initMouseTrailSystem(): void {
    this.trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailCount * 3);
    const colors = new Float32Array(this.maxTrailCount * 3);

    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.trailGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      map: getParticleTexture('star'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.trailPoints = new THREE.Points(this.trailGeometry, material);
    this.scene.add(this.trailPoints);
  }

  private updateMouseTrail(delta: number): void {
    if (!this.settings.mouseTrailEnabled) {
      if (this.trailGeometry) {
        const positions = this.trailGeometry.attributes.position.array as Float32Array;
        positions.fill(-9999);
        this.trailGeometry.attributes.position.needsUpdate = true;
      }
      return;
    }

    // Spawn new trail particles near mousePosition3D
    if (this.mousePosition2D.x !== -999 && (this.isPointerDown || Math.random() < 0.65)) {
      _color1.set(this.settings.primaryColor);
      _color2.set(this.settings.secondaryColor);

      const count = this.isPointerDown ? 4 : 2;
      for (let i = 0; i < count; i++) {
        if (this.mouseTrail.length >= this.maxTrailCount) {
          this.mouseTrail.shift();
        }

        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        );
        const col = _color1.clone().lerp(_color2, Math.random());
        const maxLife = 0.4 + Math.random() * 0.4;

        this.mouseTrail.push({
          pos: this.mousePosition3D.clone().add(
            new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5)
          ),
          vel,
          color: col,
          life: maxLife,
          maxLife,
          size: 3.5 + Math.random() * 3,
        });
      }
    }

    // Update existing trail
    if (this.trailGeometry) {
      const positions = this.trailGeometry.attributes.position.array as Float32Array;
      const colors = this.trailGeometry.attributes.color.array as Float32Array;

      let idx = 0;
      for (let i = this.mouseTrail.length - 1; i >= 0; i--) {
        const p = this.mouseTrail[i];
        p.life -= delta;
        if (p.life <= 0) {
          this.mouseTrail.splice(i, 1);
          continue;
        }

        p.pos.addScaledVector(p.vel, delta);
        p.vel.multiplyScalar(0.92);

        const progress = p.life / p.maxLife;

        positions[idx * 3] = p.pos.x;
        positions[idx * 3 + 1] = p.pos.y;
        positions[idx * 3 + 2] = p.pos.z;

        colors[idx * 3] = p.color.r * progress;
        colors[idx * 3 + 1] = p.color.g * progress;
        colors[idx * 3 + 2] = p.color.b * progress;

        idx++;
      }

      // Hide unused
      for (let i = idx; i < this.maxTrailCount; i++) {
        positions[i * 3] = -9999;
        positions[i * 3 + 1] = -9999;
        positions[i * 3 + 2] = -9999;
      }

      this.trailGeometry.attributes.position.needsUpdate = true;
      this.trailGeometry.attributes.color.needsUpdate = true;
    }
  }

  // ==================== MODE 1: PARTICLE GALAXY ====================
  private createGalaxy(): void {
    const count = this.settings.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const initialPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const distances = new Float32Array(count);

    const arms = 4;
    const maxRadius = 120;

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);
    _color3.set(this.settings.accentColor);

    for (let i = 0; i < count; i++) {
      // Logarithmic spiral distribution
      const r = Math.pow(Math.random(), 1.6) * maxRadius;
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const spiralAngle = r * 0.08 + armAngle;

      // Random scatter
      const spread = (r / maxRadius) * 16 + 2;
      const randomX = (Math.pow(Math.random(), 2) * 2 - 1) * spread;
      const randomY = (Math.pow(Math.random(), 3) * 2 - 1) * (spread * 0.7);
      const randomZ = (Math.pow(Math.random(), 2) * 2 - 1) * spread;

      const x = Math.cos(spiralAngle) * r + randomX;
      const y = randomY;
      const z = Math.sin(spiralAngle) * r + randomZ;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      angles[i] = spiralAngle;
      distances[i] = r;

      // Color gradation: Core is bright cyan/white, outer arms are pink & violet
      const t = r / maxRadius;
      const col = t < 0.3 ? _color1.clone().lerp(_color2, t / 0.3) : _color2.clone().lerp(_color3, (t - 0.3) / 0.7);

      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.settings.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: getParticleTexture(this.settings.particleShape),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.galaxyPoints = new THREE.Points(geometry, material);
    this.galaxyInitialPositions = initialPositions;
    this.galaxyAngles = angles;
    this.galaxyDistances = distances;

    this.currentModeGroup.add(this.galaxyPoints);
  }

  // ==================== MODE 2: AUDIO TUNNEL ====================
  private createTunnel(): void {
    const count = this.settings.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    const tunnelLength = 600;
    const tunnelRadius = 38;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * tunnelLength;
      const r = tunnelRadius + (Math.random() - 0.5) * 12;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = z;

      speeds[i] = 120 + Math.random() * 160;

      const col = _color1.clone().lerp(_color2, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.settings.particleSize * 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      map: getParticleTexture(this.settings.particleShape),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.tunnelPoints = new THREE.Points(geometry, material);
    this.tunnelSpeeds = speeds;
    this.currentModeGroup.add(this.tunnelPoints);

    // Tunnel glowing wireframe rings
    this.tunnelRingsGroup = new THREE.Group();
    const ringCount = 18;
    const ringGeometry = new THREE.TorusGeometry(38, 0.4, 8, 36);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.settings.primaryColor),
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(ringGeometry, ringMaterial.clone());
      ring.position.z = -300 + (i / ringCount) * 600;
      this.tunnelRingsGroup.add(ring);
    }

    this.currentModeGroup.add(this.tunnelRingsGroup);
  }

  // ==================== MODE 3: NEON WAVE ====================
  private createNeonWave(): void {
    const size = this.waveGridSize;
    const geometry = new THREE.PlaneGeometry(180, 180, size - 1, size - 1);
    geometry.rotateX(-Math.PI / 2.5);

    // Wireframe Mesh
    const meshMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.settings.primaryColor),
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    this.waveMesh = new THREE.Mesh(geometry, meshMaterial);
    this.currentModeGroup.add(this.waveMesh);

    // Glowing vertex points
    const pointCount = size * size;
    const pointGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);

    const origPos = geometry.attributes.position.array as Float32Array;
    positions.set(origPos);

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    for (let i = 0; i < pointCount; i++) {
      const col = _color1.clone().lerp(_color2, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointMaterial = new THREE.PointsMaterial({
      size: this.settings.particleSize * 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      map: getParticleTexture(this.settings.particleShape),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.wavePoints = new THREE.Points(pointGeometry, pointMaterial);
    this.currentModeGroup.add(this.wavePoints);
  }

  // ==================== MODE 4: CIRCULAR SPECTRUM ====================
  private createCircularSpectrum(): void {
    this.spectrumGroup = new THREE.Group();
    this.spectrumBars = [];

    const barCount = 64;
    const radius = 55;
    const barWidth = 2.2;

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2;
      const geometry = new THREE.BoxGeometry(barWidth, 2, barWidth);
      geometry.translate(0, 1, 0); // pivot at bottom

      const mix = Math.sin((i / barCount) * Math.PI);
      const col = _color1.clone().lerp(_color2, mix);

      const material = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8,
      });

      const bar = new THREE.Mesh(geometry, material);
      bar.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      bar.rotation.y = -angle + Math.PI / 2;

      this.spectrumBars.push(bar);
      this.spectrumGroup.add(bar);
    }

    // Central pulsing reactor ring
    const ringGeo = new THREE.TorusGeometry(32, 1.2, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.settings.accentColor),
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });
    const centerRing = new THREE.Mesh(ringGeo, ringMat);
    centerRing.rotation.x = Math.PI / 2;
    this.spectrumGroup.add(centerRing);

    this.currentModeGroup.add(this.spectrumGroup);
  }

  // ==================== MODE 5: STARFIELD ====================
  private createStarfield(): void {
    const count = this.settings.particleCount;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count);

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1200;

      velocities[i] = 180 + Math.random() * 240;

      const col = _color1.clone().lerp(_color2, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.settings.particleSize * 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      map: getParticleTexture('diamond'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starfieldPoints = new THREE.Points(geometry, material);
    this.starfieldVelocities = velocities;
    this.currentModeGroup.add(this.starfieldPoints);
  }

  // ==================== MODE 6: GEOMETRIC REACTOR ====================
  private createGeometricReactor(): void {
    this.reactorGroup = new THREE.Group();
    this.reactorRings = [];

    // 1. Central Core Sphere & Icosahedron Wireframe
    const coreGeo = new THREE.IcosahedronGeometry(18, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.settings.primaryColor),
      wireframe: true,
      emissive: new THREE.Color(this.settings.primaryColor),
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.9,
    });
    this.reactorCore = new THREE.Mesh(coreGeo, coreMat);
    this.reactorGroup.add(this.reactorCore);

    // 2. Gyroscopic Rotating Rings
    const ringRadii = [32, 46, 60];
    const ringColors = [this.settings.primaryColor, this.settings.secondaryColor, this.settings.accentColor];

    for (let i = 0; i < ringRadii.length; i++) {
      const ringGeo = new THREE.TorusGeometry(ringRadii[i], 0.8, 12, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(ringColors[i]),
        emissive: new THREE.Color(ringColors[i]),
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      this.reactorRings.push(ring);
      this.reactorGroup.add(ring);
    }

    // 3. Orbiting Quantum Particles Swarm
    const count = 3500;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    _color1.set(this.settings.primaryColor);
    _color2.set(this.settings.secondaryColor);

    for (let i = 0; i < count; i++) {
      const radius = 22 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const col = _color1.clone().lerp(_color2, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: this.settings.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: getParticleTexture('star'),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.reactorParticles = new THREE.Points(particleGeo, particleMat);
    this.reactorGroup.add(this.reactorParticles);

    this.currentModeGroup.add(this.reactorGroup);
  }

  // ==================== MODE SWITCHER & DISPOSAL ====================
  public setMode(newMode: VisualizerMode): void {
    this.mode = newMode;
    this.disposeCurrentMode();

    if (newMode === 'galaxy') {
      this.createGalaxy();
      this.camera.position.set(0, 55, 140);
    } else if (newMode === 'tunnel') {
      this.createTunnel();
      this.camera.position.set(0, 0, 110);
    } else if (newMode === 'wave') {
      this.createNeonWave();
      this.camera.position.set(0, 60, 130);
    } else if (newMode === 'spectrum') {
      this.createCircularSpectrum();
      this.camera.position.set(0, 45, 130);
    } else if (newMode === 'starfield') {
      this.createStarfield();
      this.camera.position.set(0, 0, 100);
    } else if (newMode === 'reactor') {
      this.createGeometricReactor();
      this.camera.position.set(0, 30, 130);
    }

    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private disposeCurrentMode(): void {
    // Clear and dispose objects inside currentModeGroup
    while (this.currentModeGroup.children.length > 0) {
      const child = this.currentModeGroup.children[0] as THREE.Mesh | THREE.Points | THREE.Group;
      this.currentModeGroup.remove(child);

      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    }

    this.galaxyPoints = null;
    this.tunnelPoints = null;
    this.tunnelRingsGroup = null;
    this.waveMesh = null;
    this.wavePoints = null;
    this.spectrumGroup = null;
    this.spectrumBars = [];
    this.starfieldPoints = null;
    this.reactorGroup = null;
    this.reactorCore = null;
    this.reactorRings = [];
    this.reactorParticles = null;
  }

  // ==================== SETTINGS UPDATER ====================
  public updateSettings(newSettings: Partial<VisualizerSettings>): void {
    const prevShape = this.settings.particleShape;
    const prevCount = this.settings.particleCount;
    const prevWarp = this.settings.warpSpeed;

    this.settings = { ...this.settings, ...newSettings };

    // Update Bloom
    this.bloomPass.strength = this.settings.bloomIntensity;

    // Update Dither & Scanlines
    this.ditherPass.uniforms.uDitherIntensity.value = this.settings.ditherEnabled
      ? this.settings.ditherIntensity
      : 0.0;
    this.ditherPass.uniforms.uDitherScale.value = this.settings.ditherScale;
    this.ditherPass.uniforms.uScanlines.value = this.settings.scanlines ? 0.28 : 0.0;
    this.ditherPass.uniforms.uChromaticAberration.value = this.settings.chromaticAberration;
    this.ditherPass.uniforms.uEnabled.value = this.settings.ditherEnabled ? 1.0 : 0.0;

    // Controls
    this.controls.autoRotate = this.settings.autoRotate;

    // Trigger burst on Warp Speed toggle
    if (this.settings.warpSpeed && !prevWarp) {
      this.triggerBurst(new THREE.Vector3(0, 0, 0), 300, 1.8);
    }

    // Rebuild mode if particle shape or count changed
    if (newSettings.particleShape && newSettings.particleShape !== prevShape) {
      this.setMode(this.mode);
    } else if (newSettings.particleCount && newSettings.particleCount !== prevCount) {
      this.setMode(this.mode);
    }
  }

  // ==================== REAL-TIME AUDIO FEED ====================
  public updateAudioData(data: AudioAnalysisData): void {
    this.currentAudioData = data;

    // Trigger particle burst on strong musical beats
    if (data.isBeat && data.beatIntensity > 0.4) {
      this.triggerBurst(new THREE.Vector3(0, 0, 0), Math.floor(120 * data.beatIntensity), data.beatIntensity);
    }
  }

  // ==================== ANIMATION TICK LOOP ====================
  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // FPS calculation
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Warp speed smooth exponential damping
    const targetWarp = this.settings.warpSpeed ? 1.0 : 0.0;
    this.currentWarpFactor = THREE.MathUtils.damp(this.currentWarpFactor, targetWarp, 4.0, delta);

    // Dynamic FOV interpolation during warp
    this.targetFov = 60 + this.currentWarpFactor * 25;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.targetFov, 4.0, delta);
    this.camera.updateProjectionMatrix();

    // Update Dither Shader Time
    this.ditherPass.uniforms.uTime.value = elapsedTime;

    // Mouse Trail & Bursts Update
    this.updateMouseTrail(delta);
    this.updateBurstParticles(delta);

    // Audio-reactive motion multipliers
    const sens = this.settings.audioSensitivity;
    const bass = this.currentAudioData.bass * sens;
    const mid = this.currentAudioData.mid * sens;
    const treble = this.currentAudioData.treble * sens;
    const warpMult = 1.0 + this.currentWarpFactor * 4.5;
    const speed = this.settings.speed * warpMult;

    // Ambient Star Dust Drift
    if (this.starDustPoints) {
      this.starDustPoints.rotation.y += 0.0008 * speed;
      this.starDustPoints.rotation.x += 0.0004 * speed;
    }

    // Mode-specific animations
    if (this.mode === 'galaxy') {
      this.animateGalaxy(delta, elapsedTime, bass, mid, treble, speed);
    } else if (this.mode === 'tunnel') {
      this.animateTunnel(delta, elapsedTime, bass, mid, treble, speed);
    } else if (this.mode === 'wave') {
      this.animateNeonWave(elapsedTime, bass, mid, treble, speed);
    } else if (this.mode === 'spectrum') {
      this.animateCircularSpectrum(elapsedTime, bass, speed);
    } else if (this.mode === 'starfield') {
      this.animateStarfield(delta, bass, speed);
    } else if (this.mode === 'reactor') {
      this.animateGeometricReactor(delta, elapsedTime, bass, mid, treble, speed);
    }

    // Camera Orbit Controls
    this.controls.update();

    // Render Scene with Post-Processing
    this.composer.render();
  };

  // ==================== MODE ANIMATION HANDLERS ====================
  private animateGalaxy(
    delta: number,
    elapsedTime: number,
    bass: number,
    mid: number,
    treble: number,
    speed: number
  ): void {
    if (!this.galaxyPoints || !this.galaxyAngles || !this.galaxyDistances || !this.galaxyInitialPositions) return;

    const positions = this.galaxyPoints.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;

    // Rotate the overall galaxy
    this.galaxyPoints.rotation.y += 0.003 * speed;

    // Cursor influence in 3D
    const mouseInf = this.settings.mouseTrailEnabled && this.mousePosition2D.x !== -999;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const r = this.galaxyDistances[i];

      // Galactic differential rotation (core rotates faster)
      const angularSpeed = (0.2 / Math.sqrt(r + 8)) * speed;
      this.galaxyAngles[i] += angularSpeed * delta;

      const angle = this.galaxyAngles[i];
      // Bass expands galaxy core radially
      const bassExpand = (1.0 - Math.min(1.0, r / 90)) * (bass * 22);

      // Mid/Treble creates vertical standing ripples
      const ripple = Math.sin(r * 0.15 - elapsedTime * 4) * (mid * 14 + treble * 8);

      let px = Math.cos(angle) * (r + bassExpand);
      let py = this.galaxyInitialPositions[idx + 1] + ripple;
      let pz = Math.sin(angle) * (r + bassExpand);

      // Mouse repulsion / attraction
      if (mouseInf) {
        _vec3.set(px, py, pz);
        const dist = _vec3.distanceTo(this.mousePosition3D);
        if (dist < 45) {
          const force = (1.0 - dist / 45) * 14;
          const dir = _vec3.sub(this.mousePosition3D).normalize();
          px += dir.x * force;
          py += dir.y * force;
          pz += dir.z * force;
        }
      }

      positions[idx] = px;
      positions[idx + 1] = py;
      positions[idx + 2] = pz;
    }

    this.galaxyPoints.geometry.attributes.position.needsUpdate = true;
  }

  private animateTunnel(
    delta: number,
    elapsedTime: number,
    bass: number,
    mid: number,
    treble: number,
    speed: number
  ): void {
    if (!this.tunnelPoints || !this.tunnelSpeeds) return;

    const positions = this.tunnelPoints.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;
    const tunnelLength = 600;

    // Tunnel rotation
    this.tunnelPoints.rotation.z += 0.004 * speed;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      // Fly towards camera (+Z)
      positions[idx + 2] += this.tunnelSpeeds[i] * speed * delta;

      if (positions[idx + 2] > 200) {
        positions[idx + 2] -= tunnelLength;
      }

      // Audio reactive pulsating radius
      const rScale = 1.0 + bass * 0.25;
      const angle = Math.atan2(positions[idx + 1], positions[idx]);
      const baseR = 38 + (i % 5) * 2;
      positions[idx] = Math.cos(angle) * (baseR * rScale);
      positions[idx + 1] = Math.sin(angle) * (baseR * rScale);
    }

    this.tunnelPoints.geometry.attributes.position.needsUpdate = true;

    // Animate rings
    if (this.tunnelRingsGroup) {
      this.tunnelRingsGroup.rotation.z -= 0.002 * speed;
      const ringScale = 1.0 + bass * 0.3;
      this.tunnelRingsGroup.children.forEach((child, i) => {
        const ring = child as THREE.Mesh;
        ring.position.z += 80 * speed * delta;
        if (ring.position.z > 200) {
          ring.position.z -= 600;
        }
        ring.scale.set(ringScale, ringScale, 1.0);
      });
    }
  }

  private animateNeonWave(elapsedTime: number, bass: number, mid: number, treble: number, speed: number): void {
    if (!this.waveMesh || !this.wavePoints) return;

    const size = this.waveGridSize;
    const meshPositions = this.waveMesh.geometry.attributes.position.array as Float32Array;
    const pointPositions = this.wavePoints.geometry.attributes.position.array as Float32Array;
    const freq = this.currentAudioData.frequencyData;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 3;
        const x = meshPositions[idx];
        const y = meshPositions[idx + 1];

        // Wave formula with frequencies
        const dist = Math.sqrt(x * x + y * y);
        const freqVal = freq.length > 0 ? (freq[(i + j) % freq.length] / 255) : 0;

        const wave1 = Math.sin(dist * 0.12 - elapsedTime * 3 * speed) * (10 * bass + 4);
        const wave2 = Math.cos(x * 0.08 + elapsedTime * 2) * (8 * mid);
        const zElevation = wave1 + wave2 + freqVal * (25 * (bass + mid + treble + 0.2));

        meshPositions[idx + 2] = zElevation;
        pointPositions[idx + 2] = zElevation;
      }
    }

    this.waveMesh.geometry.attributes.position.needsUpdate = true;
    this.wavePoints.geometry.attributes.position.needsUpdate = true;

    this.waveMesh.rotation.z += 0.001 * speed;
    this.wavePoints.rotation.z += 0.001 * speed;
  }

  private animateCircularSpectrum(elapsedTime: number, bass: number, speed: number): void {
    if (!this.spectrumGroup || this.spectrumBars.length === 0) return;

    this.spectrumGroup.rotation.y += 0.004 * speed;

    const freq = this.currentAudioData.frequencyData;
    const barCount = this.spectrumBars.length;
    const step = Math.floor(Math.min(freq.length, 512) / barCount) || 1;

    for (let i = 0; i < barCount; i++) {
      const bar = this.spectrumBars[i];
      const val = freq.length > 0 ? (freq[i * step] / 255) : 0.05;

      const targetHeight = Math.max(1.5, val * 55 * this.settings.audioSensitivity);
      bar.scale.y = THREE.MathUtils.damp(bar.scale.y, targetHeight, 15, 0.016);

      // Emissive brightness reaction
      const mat = bar.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + val * 1.5;
    }
  }

  private animateStarfield(delta: number, bass: number, speed: number): void {
    if (!this.starfieldPoints || !this.starfieldVelocities) return;

    const positions = this.starfieldPoints.geometry.attributes.position.array as Float32Array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx + 2] += (this.starfieldVelocities[i] + bass * 120) * speed * delta;

      if (positions[idx + 2] > 600) {
        positions[idx + 2] -= 1800;
        positions[idx] = (Math.random() - 0.5) * 900;
        positions[idx + 1] = (Math.random() - 0.5) * 900;
      }
    }

    this.starfieldPoints.geometry.attributes.position.needsUpdate = true;
  }

  private animateGeometricReactor(
    delta: number,
    elapsedTime: number,
    bass: number,
    mid: number,
    treble: number,
    speed: number
  ): void {
    if (!this.reactorGroup) return;

    // Rotate core
    if (this.reactorCore) {
      this.reactorCore.rotation.x += 0.01 * speed;
      this.reactorCore.rotation.y += 0.015 * speed;
      const coreScale = 1.0 + bass * 0.45;
      this.reactorCore.scale.set(coreScale, coreScale, coreScale);

      const mat = this.reactorCore.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + bass * 2.0;
    }

    // Rotate gyroscopic rings along separate axes
    this.reactorRings.forEach((ring, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.x += (0.012 + i * 0.008) * speed * dir;
      ring.rotation.y += (0.015 + i * 0.006) * speed * -dir;
      ring.rotation.z += (0.008 + i * 0.01) * speed;

      const ringScale = 1.0 + (i === 0 ? bass : i === 1 ? mid : treble) * 0.25;
      ring.scale.set(ringScale, ringScale, ringScale);
    });

    // Swarm particles
    if (this.reactorParticles) {
      this.reactorParticles.rotation.y += 0.008 * speed;
      this.reactorParticles.rotation.x += 0.005 * speed;
    }
  }

  private updateBurstParticles(delta: number): void {
    if (!this.burstGeometry) return;

    const positions = this.burstGeometry.attributes.position.array as Float32Array;
    const colors = this.burstGeometry.attributes.color.array as Float32Array;

    let idx = 0;
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const p = this.burstParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.burstParticles.splice(i, 1);
        continue;
      }

      p.pos.addScaledVector(p.vel, delta);
      p.vel.multiplyScalar(0.96); // drag

      const progress = p.life / p.maxLife;

      positions[idx * 3] = p.pos.x;
      positions[idx * 3 + 1] = p.pos.y;
      positions[idx * 3 + 2] = p.pos.z;

      colors[idx * 3] = p.color.r * progress;
      colors[idx * 3 + 1] = p.color.g * progress;
      colors[idx * 3 + 2] = p.color.b * progress;

      idx++;
    }

    for (let i = idx; i < this.maxBurstCount; i++) {
      positions[i * 3] = -9999;
      positions[i * 3 + 1] = -9999;
      positions[i * 3 + 2] = -9999;
    }

    this.burstGeometry.attributes.position.needsUpdate = true;
    this.burstGeometry.attributes.color.needsUpdate = true;
  }

  // ==================== INTERACTION & EVENTS ====================
  private setupEventListeners(): void {
    const el = this.renderer.domElement;

    // Pointer move for mouse trail & 3D unprojection
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointerup', this.onPointerUp);

    // Click burst
    el.addEventListener('click', this.onClick);

    // Resize
    window.addEventListener('resize', this.onResize);
  }

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.mousePosition2D.set(x, y);

    // Unproject to 3D plane Z=0
    _ray.origin.setFromMatrixPosition(this.camera.matrixWorld);
    _ray.direction.set(x, y, 0.5).unproject(this.camera).sub(_ray.origin).normalize();

    const hit = _ray.intersectPlane(_plane, this.mousePosition3D);
    if (!hit) {
      this.mousePosition3D.copy(_ray.origin).addScaledVector(_ray.direction, 80);
    }
  };

  private onPointerDown = (): void => {
    this.isPointerDown = true;
  };

  private onPointerUp = (): void => {
    this.isPointerDown = false;
  };

  private onClick = (): void => {
    // Burst at mouse position in 3D
    this.triggerBurst(this.mousePosition3D, 220, 1.4);
  };

  private onResize = (): void => {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    this.bloomPass.resolution.set(width, height);
    this.ditherPass.uniforms.uResolution.value.set(width, height);
  };

  public resetCamera(): void {
    this.camera.position.set(0, 40, 150);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  public getFps(): number {
    return this.fps;
  }

  public getParticleCount(): number {
    return this.settings.particleCount + this.burstParticles.length + (this.starDustPoints ? 2500 : 0);
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);

    this.disposeCurrentMode();

    if (this.burstGeometry) this.burstGeometry.dispose();
    if (this.trailGeometry) this.trailGeometry.dispose();

    this.controls.dispose();
    this.composer.dispose();
    this.renderer.dispose();

    if (el.parentElement) {
      el.parentElement.removeChild(el);
    }
  }
}
