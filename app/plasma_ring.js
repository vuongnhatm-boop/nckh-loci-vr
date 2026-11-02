/**
 * PLASMA RING VISUALIZER (Vanilla JS / WebGL Port from Originkit)
 * High-performance WebGL wireframe wavy sphere shader with Fresnel glow & interactions.
 */

const DPR_CAP = 1.5;
const FOV_DEG = 42;
const TAU = Math.PI * 2;
const MAX_COLORS = 5;
const DEFAULT_COLORS = ["#FF3300", "#0055FF", "#E200FF", "#00F2FE", "#FFE600"];

const VERT_SPHERE = `
precision highp float;

attribute vec2 aPolar;
attribute vec2 aRnd;

uniform vec2  uRes;
uniform float uFocal;
uniform float uTime;
uniform float uRadius;
uniform float uWaveHeight;
uniform float uWaveLength;
uniform float uWaveSpeed;
uniform vec2  uWaveDir;
uniform float uCamDist;
uniform float uCamYaw;
uniform float uCamPitch;
uniform float uTilt;
uniform float uRimPower;
uniform float uCenter;

uniform float uColorCount;
uniform vec3  uColors[${MAX_COLORS}];
uniform vec3  uHotspot;

uniform vec3  uCamDir;

uniform vec3  uHoverDir;
uniform float uHoverRadius;
uniform float uHoverPush;
uniform float uHoverActive;

varying vec3  vCol;
varying float vAlpha;

float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash2(i),            hash2(i + vec2(1,0)), u.x),
               mix(hash2(i + vec2(0,1)), hash2(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
        v += a * noise2(p);
        p   = p * 2.3 + vec2(1.7, 9.2);
        a  *= 0.5;
    }
    return v;
}

vec3 rampColor(float x) {
    float p  = clamp(x, 0.0, 1.0) * max(uColorCount - 1.0, 0.0);
    float i0 = floor(p);
    float f  = p - i0;
    vec3 a = uColors[0];
    vec3 b = uColors[0];
    for (int i = 0; i < ${MAX_COLORS}; i++) {
        if (float(i) == i0)       a = uColors[i];
        if (float(i) == i0 + 1.0) b = uColors[i];
    }
    return mix(a, b, f);
}

void main() {
    float phi   = aPolar.x;
    float theta = aPolar.y;

    float sp  = sin(phi); float cp2 = cos(phi);
    float st  = sin(theta); float ct = cos(theta);

    vec3 norm = vec3(cp2 * ct, sp, cp2 * st);
    vec3 pos  = norm * uRadius;

    float wFreq = 6.2831853 / max(100.0, uWaveLength);
    float proj1 = norm.x * uWaveDir.x + norm.z * uWaveDir.y;
    float proj2 = norm.x * uWaveDir.y - norm.z * uWaveDir.x;

    float ts = uTime * (uWaveSpeed / 120.0);
    float wave1 = sin(proj1 * wFreq * 800.0 + ts * 1.2) * cos(norm.y * wFreq * 600.0 + ts * 0.3);
    float wave2 = sin(proj2 * wFreq * 600.0 + norm.y * 1.5 - ts * 0.5);
    float smoothWave = (wave1 + wave2 * 0.5) * uWaveHeight;
    pos += norm * smoothWave;

    float hFalloff = mix(22.0, 1.5, clamp(uHoverRadius / 100.0, 0.0, 1.0));
    float hDot     = max(0.0, dot(norm, uHoverDir));
    float hEffect  = exp(-(1.0 - hDot) * hFalloff) * uHoverActive;
    float hBulge   = hEffect * uHoverPush;
    pos += norm * hBulge;

    float cy  = cos(uCamYaw); float sy = sin(uCamYaw);
    float tp  = uCamPitch + uTilt;
    float ctp = cos(tp);      float stp = sin(tp);

    float x1  =  pos.x * cy + pos.z * sy;
    float z1  = -pos.x * sy + pos.z * cy;
    float y2  =  pos.y * ctp - z1 * stp;
    float z2  =  pos.y * stp + z1 * ctp;
    float rz  =  uCamDist - z2;

    if (rz < 1.0) {
        gl_Position = vec4(2.0, 2.0, 0.0, 1.0);
        vAlpha = 0.0; vCol = vec3(0.0); return;
    }

    float sx  = x1 * uFocal / rz;
    float sy2 = y2 * uFocal / rz;
    gl_Position  = vec4(sx / (uRes.x * 0.5), sy2 / (uRes.y * 0.5), 0.0, 1.0);

    float rimDot  = abs(dot(norm, uCamDir));
    float fresnel = pow(max(1.0 - rimDot, 0.0), uRimPower);

    fresnel = max(fresnel, uCenter * rimDot);

    float hoverAlpha = hEffect * 0.95;
    float finalAlpha = max(fresnel, hoverAlpha);

    float bri = 0.50 + aRnd.x * 0.50;
    float t   = sp * 0.5 + 0.5;

    vec3 baseCol = rampColor(1.0 - t);
    float polar  = min(pow(abs(sp), 4.0), 1.0);
    vec3 col     = mix(baseCol, uHotspot, polar * 0.88);

    vCol   = col;
    vAlpha = finalAlpha * bri;
}
`;

const FRAG = `
precision highp float;
varying vec3  vCol;
varying float vAlpha;
void main() {
    gl_FragColor = vec4(vCol * vAlpha, vAlpha);
}
`;

function parseColor(input) {
  if (!input) return [0, 0, 0];
  const s = input.trim();
  const fn = s.match(/rgba?\(([^)]+)\)/i);
  if (fn) {
    const p = fn[1].split(",").map((v) => parseFloat(v.trim()));
    return [(p[0] || 0) / 255, (p[1] || 0) / 255, (p[2] || 0) / 255];
  }
  let h = s.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
  h = h.padEnd(6, "0");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("PlasmaRing shader error:", gl.getShaderInfoLog(sh));
  }
  return sh;
}

function linkProg(gl, vs, fs) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("PlasmaRing link error:", gl.getProgramInfoLog(prog));
  }
  return prog;
}

export class PlasmaRingVisualizer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      colors: ["#FF3300", "#0055FF", "#E200FF", "#00F2FE"],
      density: 90,
      speed: 110,
      waveHeight: 24,
      centerOpacity: 90,
      scale: 38,
      dragSensitivity: 100,
      radius: 270,
      tilt: 18,
      rimPower: 2.8,
      waveLength: 200,
      waveDirection: 45,
      hoverRadius: 35,
      hoverPush: 80,
      orbitDamping: 50,
      camFar: 2100,
      camPerScale: 15
    }, options);

    this.rafId = 0;
    this.isRunning = false;
    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    const gl = this.canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      depth: false,
    });
    if (!gl) {
      console.warn("WebGL not supported for PlasmaRing");
      return;
    }
    this.gl = gl;

    this.sphereProg = linkProg(gl, VERT_SPHERE, FRAG);
    const U = (p, n) => gl.getUniformLocation(p, n);

    this.palBuf = new Float32Array(MAX_COLORS * 3);
    this.sA = {
      polar: gl.getAttribLocation(this.sphereProg, "aPolar"),
      rnd: gl.getAttribLocation(this.sphereProg, "aRnd"),
    };
    this.sU = {
      res: U(this.sphereProg, "uRes"),
      focal: U(this.sphereProg, "uFocal"),
      time: U(this.sphereProg, "uTime"),
      radius: U(this.sphereProg, "uRadius"),
      waveHeight: U(this.sphereProg, "uWaveHeight"),
      waveLength: U(this.sphereProg, "uWaveLength"),
      waveSpeed: U(this.sphereProg, "uWaveSpeed"),
      waveDir: U(this.sphereProg, "uWaveDir"),
      camDist: U(this.sphereProg, "uCamDist"),
      camYaw: U(this.sphereProg, "uCamYaw"),
      camPitch: U(this.sphereProg, "uCamPitch"),
      tilt: U(this.sphereProg, "uTilt"),
      rimPow: U(this.sphereProg, "uRimPower"),
      center: U(this.sphereProg, "uCenter"),
      colorCount: U(this.sphereProg, "uColorCount"),
      colors: U(this.sphereProg, "uColors[0]"),
      hotspot: U(this.sphereProg, "uHotspot"),
      camDir: U(this.sphereProg, "uCamDir"),
      hoverDir: U(this.sphereProg, "uHoverDir"),
      hoverRadius: U(this.sphereProg, "uHoverRadius"),
      hoverPush: U(this.sphereProg, "uHoverPush"),
      hoverActive: U(this.sphereProg, "uHoverActive"),
    };

    this.polarBuf = gl.createBuffer();
    this.rndBuf = gl.createBuffer();
    this.idxBuf = gl.createBuffer();
    this.builtDensity = -1;
    this.count = 0;
    this.indexCount = 0;

    this.cam = { yaw: 0, pitch: 0, yawV: 0, pitchV: 0 };
    this.drag = { active: false, lastX: 0, lastY: 0 };
    this.hov = { active: 0, target: 0, miss: 1, dirX: 0, dirY: 1, dirZ: 0, mx: 0, my: 0 };

    this.dpr = 1;
    this.cssW = 0;
    this.cssH = 0;

    this.buildBuffers(this.options.density);
    this.setupEvents();
    this.start();
  }

  buildBuffers(d) {
    const gl = this.gl;
    const N_theta = Math.max(50, Math.round(d * 2.2));
    const N_phi = Math.max(35, Math.round(d * 1.6));
    this.count = N_theta * N_phi;

    const polarA = new Float32Array(this.count * 2);
    const rndA = new Float32Array(this.count * 2);
    const rnd = mulberry32(0xc0ffee7);
    let i = 0;
    for (let ti = 0; ti < N_theta; ti++) {
      const theta = ((ti + 0.5) / N_theta) * TAU;
      for (let pi = 0; pi < N_phi; pi++) {
        const phi = ((pi + 0.5) / N_phi - 0.5) * Math.PI;
        polarA[i * 2] = phi;
        polarA[i * 2 + 1] = theta;
        rndA[i * 2] = rnd();
        rndA[i * 2 + 1] = rnd();
        i++;
      }
    }

    const numMeridianSegments = N_theta * (N_phi - 1);
    const numParallelSegments = N_phi * N_theta;
    this.indexCount = (numMeridianSegments + numParallelSegments) * 2;
    const indices = new Uint16Array(this.indexCount);
    let idx = 0;

    for (let ti = 0; ti < N_theta; ti++) {
      for (let pi = 0; pi < N_phi - 1; pi++) {
        const curr = ti * N_phi + pi;
        const next = ti * N_phi + (pi + 1);
        indices[idx++] = curr;
        indices[idx++] = next;
      }
    }

    for (let pi = 0; pi < N_phi; pi++) {
      for (let ti = 0; ti < N_theta; ti++) {
        const curr = ti * N_phi + pi;
        const next = ((ti + 1) % N_theta) * N_phi + pi;
        indices[idx++] = curr;
        indices[idx++] = next;
      }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.polarBuf);
    gl.bufferData(gl.ARRAY_BUFFER, polarA, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rndBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rndA, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.builtDensity = d;
  }

  resize() {
    if (!this.gl || !this.canvas || !this.container) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this.cssW = this.canvas.clientWidth || this.container.clientWidth || 1;
    this.cssH = this.canvas.clientHeight || this.container.clientHeight || 1;
    const w = Math.max(1, Math.round(this.cssW * this.dpr));
    const h = Math.max(1, Math.round(this.cssH * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, w, h);
  }

  setupEvents() {
    const host = this.container;

    this.onPointerDown = (e) => {
      this.drag.active = true;
      this.drag.lastX = e.clientX;
      this.drag.lastY = e.clientY;
      if (host.setPointerCapture) host.setPointerCapture(e.pointerId);
    };

    this.onPointerMove = (e) => {
      const r = host.getBoundingClientRect();
      this.hov.mx = e.clientX - r.left;
      this.hov.my = e.clientY - r.top;
      this.hov.target = 1;

      if (!this.drag.active) return;
      const dx = e.clientX - this.drag.lastX;
      const dy = e.clientY - this.drag.lastY;
      this.drag.lastX = e.clientX;
      this.drag.lastY = e.clientY;
      const spd = (this.options.dragSensitivity / 100) * (Math.PI / 180);
      this.cam.yawV += dx * spd;
      this.cam.pitchV += dy * spd;
    };

    this.onPointerLeave = () => {
      this.hov.target = 0;
    };

    this.onPointerUp = () => {
      this.drag.active = false;
    };

    host.addEventListener("pointerdown", this.onPointerDown);
    host.addEventListener("pointermove", this.onPointerMove);
    host.addEventListener("pointerleave", this.onPointerLeave);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
  }

  setPulse(intensity) {
    // Dynamically modulate wave speed & height based on speech/thinking
    this.options.waveSpeed = 100 + intensity * 150;
    this.options.waveHeight = 22 + intensity * 28;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    const gl = this.gl;
    if (!gl) return;

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);

    let last = performance.now();
    let elapsed = 0;

    const frame = (now) => {
      if (!this.isRunning) return;
      this.rafId = requestAnimationFrame(frame);

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      if (this.cssW <= 0 || this.cssH <= 0) {
        this.resize();
        return;
      }

      const L = this.options;
      const cameraDistance = L.camFar - L.camPerScale * L.scale;

      const damp = 1 - Math.pow(L.orbitDamping / 100, dt * 10);
      this.cam.yaw += this.cam.yawV * damp;
      this.cam.pitch += this.cam.pitchV * damp;

      this.cam.yaw = ((this.cam.yaw + Math.PI) % TAU + TAU) % TAU - Math.PI;
      this.cam.pitch = ((this.cam.pitch + Math.PI) % TAU + TAU) % TAU - Math.PI;
      this.cam.yawV *= (1 - damp * 1.4);
      this.cam.pitchV *= (1 - damp * 1.4);

      // Smooth hover interpolation
      this.hov.active += (this.hov.target - this.hov.active) * 0.1;

      const wDev = this.canvas.width;
      const hDev = this.canvas.height;
      const focal = hDev / (2 * Math.tan((FOV_DEG / 2) * Math.PI / 180));
      const totalPitch = this.cam.pitch + (L.tilt * Math.PI) / 180;

      const cy = Math.cos(this.cam.yaw);
      const sy = Math.sin(this.cam.yaw);
      const ctp = Math.cos(totalPitch);
      const stp = Math.sin(totalPitch);
      const cdx = -sy * ctp;
      const cdy = stp;
      const cdz = cy * ctp;
      const cdl = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz) || 1;

      const pal = Array.isArray(L.colors) && L.colors.length > 0 ? L.colors.slice(0, MAX_COLORS) : DEFAULT_COLORS;
      for (let i = 0; i < MAX_COLORS; i++) {
        const [pr, pg, pb] = parseColor(pal[Math.min(i, pal.length - 1)]);
        this.palBuf[i * 3] = pr;
        this.palBuf[i * 3 + 1] = pg;
        this.palBuf[i * 3 + 2] = pb;
      }

      const [tr, tg, tb] = parseColor(pal[0]);
      const hr = Math.min(1, tr * 0.6 + 0.8);
      const hg = Math.min(1, tg * 0.4 + 0.7);
      const hb = Math.min(1, tb * 0.5 + 0.8);

      const tiltRad = (L.tilt * Math.PI) / 180;
      const timeVal = elapsed * (L.waveSpeed / 50);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.sphereProg);
      gl.uniform2f(this.sU.res, wDev, hDev);
      gl.uniform1f(this.sU.focal, focal);
      gl.uniform1f(this.sU.time, timeVal);
      gl.uniform1f(this.sU.radius, L.radius);
      gl.uniform1f(this.sU.waveHeight, L.waveHeight);
      gl.uniform1f(this.sU.waveLength, L.waveLength);
      gl.uniform1f(this.sU.waveSpeed, L.waveSpeed);

      const da = (L.waveDirection * Math.PI) / 180;
      gl.uniform2f(this.sU.waveDir, Math.sin(da), Math.cos(da));
      gl.uniform1f(this.sU.camDist, cameraDistance);
      gl.uniform1f(this.sU.camYaw, this.cam.yaw);
      gl.uniform1f(this.sU.camPitch, this.cam.pitch);
      gl.uniform1f(this.sU.tilt, tiltRad);
      gl.uniform1f(this.sU.rimPow, L.rimPower);
      gl.uniform1f(this.sU.center, L.centerOpacity / 100);
      gl.uniform1f(this.sU.colorCount, pal.length);
      gl.uniform3fv(this.sU.colors, this.palBuf);
      gl.uniform3f(this.sU.hotspot, hr, hg, hb);
      gl.uniform3f(this.sU.camDir, cdx / cdl, cdy / cdl, cdz / cdl);
      gl.uniform3f(this.sU.hoverDir, this.hov.dirX, this.hov.dirY, this.hov.dirZ);
      gl.uniform1f(this.sU.hoverRadius, L.hoverRadius);
      gl.uniform1f(this.sU.hoverPush, L.hoverPush);
      gl.uniform1f(this.sU.hoverActive, this.hov.active);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.polarBuf);
      gl.enableVertexAttribArray(this.sA.polar);
      gl.vertexAttribPointer(this.sA.polar, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.rndBuf);
      gl.enableVertexAttribArray(this.sA.rnd);
      gl.vertexAttribPointer(this.sA.rnd, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
      gl.drawElements(gl.LINES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  destroy() {
    this.stop();
    if (this.ro) this.ro.disconnect();
    const host = this.container;
    if (host) {
      host.removeEventListener("pointerdown", this.onPointerDown);
      host.removeEventListener("pointermove", this.onPointerMove);
      host.removeEventListener("pointerleave", this.onPointerLeave);
      if (this.canvas && this.canvas.parentNode === host) {
        host.removeChild(this.canvas);
      }
    }
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }
}
