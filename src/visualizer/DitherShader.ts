import * as THREE from 'three';

export const DitherShader = {
  name: 'CyberDitherShader',

  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uTime: { value: 0.0 },
    uDitherIntensity: { value: 0.65 },
    uDitherScale: { value: 2.0 },
    uColorSteps: { value: 8.0 },
    uScanlines: { value: 0.25 },
    uChromaticAberration: { value: 0.003 },
    uEnabled: { value: 1.0 },
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
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uDitherIntensity;
    uniform float uDitherScale;
    uniform float uColorSteps;
    uniform float uScanlines;
    uniform float uChromaticAberration;
    uniform float uEnabled;

    varying vec2 vUv;

    // 4x4 Bayer Dither Matrix normalized [0..1]
    float getBayer4(vec2 coord) {
      vec2 m = mod(coord, 4.0);
      int x = int(m.x);
      int y = int(m.y);
      int index = x + y * 4;

      if (index == 0) return 0.0 / 16.0;
      if (index == 1) return 8.0 / 16.0;
      if (index == 2) return 2.0 / 16.0;
      if (index == 3) return 10.0 / 16.0;
      if (index == 4) return 12.0 / 16.0;
      if (index == 5) return 4.0 / 16.0;
      if (index == 6) return 14.0 / 16.0;
      if (index == 7) return 6.0 / 16.0;
      if (index == 8) return 3.0 / 16.0;
      if (index == 9) return 11.0 / 16.0;
      if (index == 10) return 1.0 / 16.0;
      if (index == 11) return 9.0 / 16.0;
      if (index == 12) return 15.0 / 16.0;
      if (index == 13) return 7.0 / 16.0;
      if (index == 14) return 13.0 / 16.0;
      return 5.0 / 16.0;
    }

    void main() {
      if (uEnabled < 0.5) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      // Chromatic Aberration
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      vec2 caOffset = dir * (uChromaticAberration * (dist + 0.3));

      vec4 rCol = texture2D(tDiffuse, vUv + caOffset);
      vec4 gCol = texture2D(tDiffuse, vUv);
      vec4 bCol = texture2D(tDiffuse, vUv - caOffset);

      vec3 color = vec3(rCol.r, gCol.g, bCol.b);

      // CRT Scanlines
      if (uScanlines > 0.01) {
        float scanline = sin(vUv.y * uResolution.y * 1.5 + uTime * 3.0) * 0.5 + 0.5;
        scanline = 1.0 - (scanline * uScanlines * 0.35);
        color *= scanline;
      }

      // Ordered Dithering & Color Quantization
      if (uDitherIntensity > 0.01) {
        vec2 ditherCoord = floor(gl_FragCoord.xy / max(1.0, uDitherScale));
        float threshold = getBayer4(ditherCoord) - 0.5;

        // Apply dither threshold
        float steps = max(2.0, uColorSteps);
        vec3 dithered = color + (threshold * uDitherIntensity / steps);
        color = floor(dithered * steps + 0.5) / steps;
      }

      // Subtle Cyberpunk Vignette
      float vig = 1.0 - smoothstep(0.4, 1.4, dist * 1.4);
      color *= vig;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};
