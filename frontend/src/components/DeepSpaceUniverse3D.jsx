import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { raDecToCartesian } from '../data/targets';
import { 
  createCircularPointTexture, 
  createRazorDiffractionSpikeTexture, 
  generateCelestialPBRMaps 
} from '../utils/celestialTextures';
import { 
  Rocket, 
  Navigation,
  Compass,
  Sparkles,
  Layers,
  Globe
} from 'lucide-react';

export default function DeepSpaceUniverse3D({
  target,
  year = 2026.5,
  onYearChange,
  gaiaStars = [],
  palette = 'deepspace',
  isWarping = false,
  onWarpComplete,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Dynamic 3D Object Refs
  const targetGroupRef = useRef(null);
  const targetMeshRef = useRef(null);
  const fresnelMeshRef = useRef(null);
  const spikeSpriteRef = useRef(null);
  const diskMeshRef = useRef(null);
  const trajectoryLineRef = useRef(null);
  const ghostMarkersGroupRef = useRef(null);
  const gaiaPointsRef = useRef(null);
  const warpLinesRef = useRef(null);

  // Shared textures
  const circlePointTexRef = useRef(null);

  // Interactive HUD state
  const [hudData, setHudData] = useState({
    driftArcsec: 0,
    currentRa: target?.ra || 0,
    currentDec: target?.dec || 0,
    brightnessMag: 12.5,
  });

  // Camera Orbit State
  const sphericalRef = useRef({ radius: 8.5, theta: 0.35, phi: 1.25 });
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0));

  // --- 1. Three.js Initialization & Scene Setup ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(palette === 'daylight' ? 0xf8fafc : 0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    cameraRef.current = camera;
    camera.position.set(0, 2, 10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // Reusable anti-aliased circular point texture
    const circlePointTex = createCircularPointTexture();
    circlePointTexRef.current = circlePointTex;

    // --- 2. Cinematic Space Lighting & Day/Night Terminator ---
    // Off-axis directional sunlight for realistic terminator
    const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.4);
    sunLight.position.set(-30, 18, 40);
    scene.add(sunLight);

    // Deep-space subtle ambient fill
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.08);
    scene.add(ambientLight);

    // Subtle blue rim fill light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rimLight.position.set(25, -15, -20);
    scene.add(rimLight);

    // --- 3. Anti-Aliased Cosmic Starfield (4,500 Circular Stars) ---
    const starCount = 4500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);

    const starPalette = [
      new THREE.Color(0xffffff), // O/B Blue-White
      new THREE.Color(0xa5f3fc), // Cyan
      new THREE.Color(0xfef08a), // G-type Solar
      new THREE.Color(0xfba44b), // K-type Amber
      new THREE.Color(0xf87171), // M-type Red
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 450 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = radius * Math.cos(phi);

      const c = starPalette[Math.floor(Math.random() * starPalette.length)];
      starCols[i * 3] = c.r;
      starCols[i * 3 + 1] = c.g;
      starCols[i * 3 + 2] = c.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      map: circlePointTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: palette === 'daylight' ? 0.4 : 0.9,
    });
    const bgStarField = new THREE.Points(starGeo, starMat);
    scene.add(bgStarField);

    // --- 4. Milky Way Dust Ribbon (Cosmic Galactic Plane) ---
    const mwGeo = new THREE.BufferGeometry();
    const mwCount = 2200;
    const mwPos = new Float32Array(mwCount * 3);
    const mwCols = new Float32Array(mwCount * 3);
    for (let i = 0; i < mwCount; i++) {
      const angle = (i / mwCount) * Math.PI * 2;
      const r = 460 + (Math.random() - 0.5) * 70;
      const spread = (Math.random() - 0.5) * 55;
      mwPos[i * 3] = r * Math.cos(angle);
      mwPos[i * 3 + 1] = spread;
      mwPos[i * 3 + 2] = r * Math.sin(angle);

      const colorVal = 0.35 + Math.random() * 0.45;
      mwCols[i * 3] = colorVal * 0.75;
      mwCols[i * 3 + 1] = colorVal * 0.85;
      mwCols[i * 3 + 2] = colorVal * 1.0;
    }
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCols, 3));
    const mwMat = new THREE.PointsMaterial({
      size: 5.5,
      map: circlePointTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: palette === 'daylight' ? 0.2 : 0.45,
    });
    const mwRibbon = new THREE.Points(mwGeo, mwMat);
    scene.add(mwRibbon);

    // --- 5. Warp Speed Streaks Particle System (Hyperspace Flight) ---
    const warpCount = 600;
    const warpGeo = new THREE.BufferGeometry();
    const warpPos = new Float32Array(warpCount * 6);
    const warpCols = new Float32Array(warpCount * 6);

    for (let i = 0; i < warpCount; i++) {
      const x = (Math.random() - 0.5) * 90;
      const y = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 140;
      const len = 4 + Math.random() * 10;

      // Start point
      warpPos[i * 6] = x;
      warpPos[i * 6 + 1] = y;
      warpPos[i * 6 + 2] = z;
      // End point (streak)
      warpPos[i * 6 + 3] = x;
      warpPos[i * 6 + 4] = y;
      warpPos[i * 6 + 5] = z + len;

      warpCols[i * 6] = 0.2;
      warpCols[i * 6 + 1] = 0.7;
      warpCols[i * 6 + 2] = 1.0;
      warpCols[i * 6 + 3] = 0.85;
      warpCols[i * 6 + 4] = 0.95;
      warpCols[i * 6 + 5] = 1.0;
    }
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPos, 3));
    warpGeo.setAttribute('color', new THREE.BufferAttribute(warpCols, 3));
    const warpMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    warpLinesRef.current = warpLines;
    scene.add(warpLines);

    // --- 6. 4-Layer PBR Celestial Object Setup ---
    const targetGroup = new THREE.Group();
    targetGroupRef.current = targetGroup;
    scene.add(targetGroup);

    // Layer 1: Central PBR Sphere (64x64 segments)
    const sphereGeo = new THREE.SphereGeometry(1.2, 64, 64);
    const pbrMaps = generateCelestialPBRMaps(target);
    const sphereMat = new THREE.MeshStandardMaterial({
      map: pbrMaps.map,
      bumpMap: pbrMaps.bumpMap,
      bumpScale: 0.08,
      emissiveMap: pbrMaps.emissiveMap,
      emissive: new THREE.Color(target?.emissiveColor || target?.color || '#38bdf8'),
      emissiveIntensity: pbrMaps.isStar ? 1.6 : 0.45,
      roughness: pbrMaps.isStar ? 0.85 : 0.45,
      metalness: 0.05,
    });
    const targetSphere = new THREE.Mesh(sphereGeo, sphereMat);
    targetMeshRef.current = targetSphere;
    targetGroup.add(targetSphere);

    // Layer 2: Outer Fresnel Atmospheric Scattering Shell (radius * 1.045)
    const fresnelGeo = new THREE.SphereGeometry(1.2 * 1.045, 48, 48);
    const fresnelMat = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(target?.haloColor || '#38bdf8') },
        power: { value: pbrMaps.isStar ? 1.8 : 2.6 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float power;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = clamp(1.0 - abs(dot(normal, viewDir)), 0.0, 1.0);
          float intensity = pow(fresnel, power);
          gl_FragColor = vec4(color * intensity, intensity * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const fresnelMesh = new THREE.Mesh(fresnelGeo, fresnelMat);
    fresnelMeshRef.current = fresnelMesh;
    targetGroup.add(fresnelMesh);

    // Layer 4: Razor-Sharp Optical Diffraction Flare
    const spikeTex = createRazorDiffractionSpikeTexture(target?.color || '#ffffff');
    const spikeMat = new THREE.SpriteMaterial({
      map: spikeTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });
    const spikeSprite = new THREE.Sprite(spikeMat);
    spikeSprite.scale.set(10.0, 10.0, 1);
    spikeSpriteRef.current = spikeSprite;
    targetGroup.add(spikeSprite);

    // Circumstellar Protoplanetary Disk (for RW Aurigae)
    const diskGeo = new THREE.RingGeometry(2.0, 4.5, 64);
    const diskMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: target?.hasDisk ? 0.65 : 0.0,
      roughness: 0.8,
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.rotation.x = Math.PI / 2.8;
    diskMeshRef.current = diskMesh;
    targetGroup.add(diskMesh);

    // --- 7. Trajectory Line & Ghost Epoch Markers ---
    const trajLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      linewidth: 2,
    });
    const trajLineGeo = new THREE.BufferGeometry();
    const trajLine = new THREE.Line(trajLineGeo, trajLineMat);
    trajectoryLineRef.current = trajLine;
    scene.add(trajLine);

    const ghostGroup = new THREE.Group();
    ghostMarkersGroupRef.current = ghostGroup;
    scene.add(ghostGroup);

    // --- 8. Mouse Orbit & Touch Drag Listeners ---
    const onMouseDown = (e) => {
      if (e.target !== renderer.domElement) return;
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;

      sphericalRef.current.theta -= dx * 0.006;
      sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi - dy * 0.006));
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      sphericalRef.current.radius = Math.max(3.5, Math.min(35.0, sphericalRef.current.radius + e.deltaY * 0.015));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- 9. Render Loop with Shimmer & Planet Rotation ---
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Atmospheric surface rotation (cloud drift or solar rotation)
      if (targetMeshRef.current) {
        targetMeshRef.current.rotation.y = elapsed * 0.04;
      }

      // Subtle diffraction spike flare shimmer
      if (spikeSpriteRef.current) {
        spikeSpriteRef.current.material.rotation = elapsed * 0.02;
        const shimmer = 1.0 + 0.06 * Math.sin(elapsed * 3.5);
        spikeSpriteRef.current.scale.set(10.0 * shimmer, 10.0 * shimmer, 1);
      }

      if (diskMeshRef.current && target?.hasDisk) {
        diskMeshRef.current.rotation.z = elapsed * 0.15;
      }

      // Camera position updating smoothly around lookAt target
      const s = sphericalRef.current;
      const center = targetLookAtRef.current;
      camera.position.x = center.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
      camera.position.y = center.y + s.radius * Math.cos(s.phi);
      camera.position.z = center.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);
      camera.lookAt(center);

      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // --- Update Background Color with Palette ---
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(
        palette === 'daylight' ? 0xf8fafc : palette === 'infrared' ? 0x0f0c24 : 0x030712
      );
    }
  }, [palette]);

  // --- Real-Time Timeline Proper Motion & Light Curve Math ---
  useEffect(() => {
    if (!target) return;

    const baseRa = target.ra;
    const baseDec = target.dec;
    const pm = target.properMotion || { ra: 0, dec: 0, total: 0 };
    const dt = (year || 2026.0) - 2015.5; // Offset from J2015.5 baseline

    // Proper motion angular displacement in degrees
    const draDeg = ((pm.ra * dt) / 3600.0) / Math.cos((baseDec * Math.PI) / 180.0);
    const ddecDeg = (pm.dec * dt) / 3600.0;
    const currentRa = baseRa + draDeg;
    const currentDec = baseDec + ddecDeg;

    // Convert to 3D visual coordinates
    const visualScale = 0.12;
    const posX = draDeg * 3600.0 * visualScale;
    const posY = ddecDeg * 3600.0 * visualScale;
    const posZ = 0;

    // Update target mesh position
    if (targetGroupRef.current) {
      targetGroupRef.current.position.set(posX, posY, posZ);
      targetLookAtRef.current.set(posX * 0.7, posY * 0.7, posZ);
    }

    // Dynamic Light Curve Variations
    let currentRadius = target.starRadius || 1.3;
    let brightnessMag = 12.0;

    if (target.lightCurveType === 'mira') {
      // R Draconis 245-day pulsation (~0.67 yr cycle)
      const phase = ((year - 2010.0) % 0.67) / 0.67;
      const pulseMag = Math.sin(phase * Math.PI * 2);
      currentRadius = (target.starRadius || 3.0) * (1.0 + 0.35 * pulseMag);
      brightnessMag = 9.5 + 2.5 * pulseMag;
    } else if (target.lightCurveType === 'ttauri') {
      // RW Aurigae stochastic disk dimming events
      const t = (year - 2010.0) * 1.5;
      const dimming = Math.sin(t) * Math.cos(t * 2.3);
      currentRadius = (target.starRadius || 2.0) * (1.0 - 0.25 * Math.max(0, dimming));
      brightnessMag = 10.0 + 2.0 * Math.max(0, dimming);
    }

    if (targetMeshRef.current) {
      targetMeshRef.current.scale.set(currentRadius, currentRadius, currentRadius);
    }
    if (fresnelMeshRef.current) {
      fresnelMeshRef.current.scale.set(currentRadius, currentRadius, currentRadius);
    }

    // Live HUD Data
    const totalDrift = Math.abs(pm.total * dt);
    setHudData({
      driftArcsec: totalDrift,
      currentRa,
      currentDec,
      brightnessMag,
    });

    // Update Trajectory Ribbon (2010 to 2035)
    if (trajectoryLineRef.current && (pm.total > 0.05)) {
      const points = [];
      for (let y = 2010.0; y <= 2035.0; y += 0.5) {
        const ydt = y - 2015.5;
        const ptX = (((pm.ra * ydt) / 3600.0) / Math.cos((baseDec * Math.PI) / 180.0)) * 3600.0 * visualScale;
        const ptY = ((pm.dec * ydt) / 3600.0) * 3600.0 * visualScale;
        points.push(new THREE.Vector3(ptX, ptY, 0));
      }
      trajectoryLineRef.current.geometry.setFromPoints(points);
      trajectoryLineRef.current.visible = true;
    } else if (trajectoryLineRef.current) {
      trajectoryLineRef.current.visible = false;
    }

    // Build Ghost Epoch Markers
    if (ghostMarkersGroupRef.current && (pm.total > 0.05)) {
      const gGroup = ghostMarkersGroupRef.current;
      while (gGroup.children.length > 0) {
        gGroup.remove(gGroup.children[0]);
      }

      const milestones = [
        { y: 2014.5, color: 0x93c5fd },
        { y: 2025.0, color: 0x38bdf8 },
        { y: 2026.5, color: 0xec4899 },
        { y: 2035.0, color: 0xfbbf24 },
      ];

      milestones.forEach(({ y, color }) => {
        const mdt = y - 2015.5;
        const mX = (((pm.ra * mdt) / 3600.0) / Math.cos((baseDec * Math.PI) / 180.0)) * 3600.0 * visualScale;
        const mY = ((pm.dec * mdt) / 3600.0) * 3600.0 * visualScale;

        // Ghost sphere marker
        const mGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const mMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        });
        const mMesh = new THREE.Mesh(mGeo, mMat);
        mMesh.position.set(mX, mY, 0);

        // Ring aura
        const rGeo = new THREE.RingGeometry(0.5, 0.7, 24);
        const rMat = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.set(mX, mY, 0);

        gGroup.add(mMesh);
        gGroup.add(rMesh);
      });
    }
  }, [target, year]);

  // --- Real Gaia DR3 Reference Starfield Overlays (Zero Square Particles) ---
  useEffect(() => {
    if (!sceneRef.current || !gaiaStars || gaiaStars.length === 0) return;

    if (gaiaPointsRef.current) {
      sceneRef.current.remove(gaiaPointsRef.current);
      gaiaPointsRef.current = null;
    }

    const gGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(gaiaStars.length * 3);
    const gCols = new Float32Array(gaiaStars.length * 3);

    const baseRa = target?.ra || 0;
    const baseDec = target?.dec || 0;
    const visualScale = 0.12;

    gaiaStars.forEach((star, i) => {
      const dra = ((star.ra - baseRa) * 3600.0) * Math.cos((baseDec * Math.PI) / 180.0);
      const ddec = (star.dec - baseDec) * 3600.0;

      gPos[i * 3] = dra * visualScale;
      gPos[i * 3 + 1] = ddec * visualScale;
      gPos[i * 3 + 2] = -2.0 + (star.parallax ? star.parallax * 0.05 : 0);

      // Color from Gaia G magnitude
      const mag = star.phot_g_mean_mag || 16.0;
      const brightness = Math.max(0.25, Math.min(1.0, (20.0 - mag) / 8.0));
      gCols[i * 3] = brightness * 0.9;
      gCols[i * 3 + 1] = brightness * 0.95;
      gCols[i * 3 + 2] = brightness * 1.0;
    });

    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(gCols, 3));

    const gMat = new THREE.PointsMaterial({
      size: 3.5,
      map: circlePointTexRef.current,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.9,
    });

    const gaiaPoints = new THREE.Points(gGeo, gMat);
    gaiaPointsRef.current = gaiaPoints;
    sceneRef.current.add(gaiaPoints);
  }, [gaiaStars, target]);

  // --- Warp-Speed Camera Flight Transition ---
  useEffect(() => {
    if (!isWarping || !cameraRef.current) return;

    const camera = cameraRef.current;
    const warpLines = warpLinesRef.current;
    const startRadius = sphericalRef.current.radius;
    const targetRadius = 8.5;

    const startTime = performance.now();
    const duration = 1400; // 1.4s dramatic warp flight

    function step(now) {
      const elapsed = now - startTime;
      const p = Math.min(1.0, elapsed / duration);

      // Acceleration and deceleration profile (easeInOutExpo)
      const ease = p < 0.5 ? 8 * Math.pow(2, 20 * (p - 0.5)) / 2 : (2 - Math.pow(2, -20 * (p - 0.5))) / 2;

      // Warp streak opacity blooms then settles
      if (warpLines) {
        const streakAlpha = Math.sin(p * Math.PI) * 0.85;
        warpLines.material.opacity = streakAlpha;
      }

      // Camera distance zoom
      sphericalRef.current.radius = THREE.MathUtils.lerp(startRadius * 2.5, targetRadius, ease);

      if (p < 1.0) {
        requestAnimationFrame(step);
      } else {
        if (warpLines) warpLines.material.opacity = 0.0;
        onWarpComplete?.();
      }
    }

    requestAnimationFrame(step);
  }, [isWarping, onWarpComplete]);

  // Update PBR Materials and Shaders when Target Changes
  useEffect(() => {
    if (!target) return;
    const pbr = generateCelestialPBRMaps(target);

    if (targetMeshRef.current) {
      targetMeshRef.current.material.map = pbr.map;
      targetMeshRef.current.material.bumpMap = pbr.bumpMap;
      targetMeshRef.current.material.bumpScale = 0.08;
      targetMeshRef.current.material.emissiveMap = pbr.emissiveMap;
      targetMeshRef.current.material.emissive.set(target.emissiveColor || target.color || '#38bdf8');
      targetMeshRef.current.material.emissiveIntensity = pbr.isStar ? 1.6 : 0.45;
      targetMeshRef.current.material.roughness = pbr.isStar ? 0.85 : 0.45;
      targetMeshRef.current.material.needsUpdate = true;
    }

    if (fresnelMeshRef.current) {
      fresnelMeshRef.current.material.uniforms.color.value.set(target.haloColor || target.color || '#38bdf8');
      fresnelMeshRef.current.material.uniforms.power.value = pbr.isStar ? 1.8 : 2.6;
    }

    if (spikeSpriteRef.current) {
      spikeSpriteRef.current.material.map = createRazorDiffractionSpikeTexture(target.color || '#ffffff');
      spikeSpriteRef.current.material.needsUpdate = true;
    }

    if (diskMeshRef.current) {
      diskMeshRef.current.material.opacity = target.hasDisk ? 0.65 : 0.0;
    }
  }, [target]);

  const isDipole = target?.expectedSignature === 'dipole' || (target?.properMotion?.total > 0.05);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Telemetry HUD Pill (Top Left of 3D Scene) */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="px-4 py-2.5 rounded-2xl bg-white/92 backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-900 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-black tracking-wider uppercase text-sky-700">
              3D Deep-Space Coordinates
            </span>
          </div>

          <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2">
            <span>RA: {hudData.currentRa.toFixed(5)}°</span>
            <span className="text-slate-400">•</span>
            <span>Dec: {hudData.currentDec.toFixed(5)}°</span>
          </div>

          {isDipole ? (
            <div className="flex items-center gap-2 pt-0.5 border-t border-slate-200/80 text-[11px] font-mono">
              <span className="text-slate-600 font-semibold">Accumulated Drift:</span>
              <span className="font-bold text-sky-600 px-1.5 py-0.2 rounded bg-sky-50 border border-sky-200">
                {hudData.driftArcsec.toFixed(2)}″
              </span>
              <span className="text-slate-400">({target?.properMotion?.total?.toFixed(2)}″/yr)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-0.5 border-t border-slate-200/80 text-[11px] font-mono">
              <span className="text-slate-600 font-semibold">Light Curve State:</span>
              <span className="font-bold text-amber-600 px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200">
                ~{hudData.brightnessMag.toFixed(1)} mag (Variable)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Orbit Navigation Hint (Bottom Left) */}
      <div className="absolute bottom-28 left-6 z-20 pointer-events-none hidden sm:block">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/60 text-[11px] font-semibold text-slate-800 shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-sky-600" />
          <span>Click & Drag to rotate 3D view • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
