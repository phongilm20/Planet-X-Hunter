import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { raDecToCartesian } from '../data/targets';
import { 
  Rocket, 
  Eye, 
  RotateCcw, 
  Maximize2, 
  Compass, 
  Sparkles, 
  Navigation,
  Activity,
  Layers
} from 'lucide-react';

export default function DeepSpaceUniverse3D({
  target,
  year,
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
  const targetMeshRef = useRef(null);
  const haloSpriteRef = useRef(null);
  const spikeSpriteRef = useRef(null);
  const diskMeshRef = useRef(null);
  const trajectoryLineRef = useRef(null);
  const ghostMarkersGroupRef = useRef(null);
  const gaiaPointsRef = useRef(null);
  const warpLinesRef = useRef(null);

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

  // --- Helper: Generate Radial Glow Texture ---
  const createHaloTexture = (innerColor = '#38bdf8', outerColor = 'rgba(2, 132, 199, 0)') => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.2, innerColor);
    grad.addColorStop(0.55, outerColor);
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
  };

  // --- Helper: Generate 4-Point Diffraction Flare Texture ---
  const createDiffractionSpikeTexture = (color = '#ffffff') => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);

    // Horizontal spike
    const hGrad = ctx.createLinearGradient(0, 256, 512, 256);
    hGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
    hGrad.addColorStop(0.46, 'rgba(255,255,255,0.4)');
    hGrad.addColorStop(0.5, color);
    hGrad.addColorStop(0.54, 'rgba(255,255,255,0.4)');
    hGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 254, 512, 4);

    // Vertical spike
    const vGrad = ctx.createLinearGradient(256, 0, 256, 512);
    vGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(0.46, 'rgba(255,255,255,0.4)');
    vGrad.addColorStop(0.5, color);
    vGrad.addColorStop(0.54, 'rgba(255,255,255,0.4)');
    vGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(254, 0, 4, 512);

    // Central flare halo
    const cGrad = ctx.createRadialGradient(256, 256, 0, 256, 256, 64);
    cGrad.addColorStop(0.0, '#FFFFFF');
    cGrad.addColorStop(0.3, color);
    cGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.arc(256, 256, 64, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  };

  // --- 1. Three.js Initialization & Scene Setup ---
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(palette === 'daylight' ? 0xf1f5f9 : 0x030712);

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
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // --- 2. Realistic Cosmic Background: 4,000 Celestial Stars ---
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
      const radius = 400 + Math.random() * 300;
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
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: palette === 'daylight' ? 0.35 : 0.85,
    });
    const bgStarField = new THREE.Points(starGeo, starMat);
    scene.add(bgStarField);

    // --- 3. Milky Way Dust Ribbon (Cosmic Galactic Plane) ---
    const mwGeo = new THREE.BufferGeometry();
    const mwCount = 2000;
    const mwPos = new Float32Array(mwCount * 3);
    const mwCols = new Float32Array(mwCount * 3);
    for (let i = 0; i < mwCount; i++) {
      const angle = (i / mwCount) * Math.PI * 2;
      const r = 420 + (Math.random() - 0.5) * 60;
      const spread = (Math.random() - 0.5) * 50;
      mwPos[i * 3] = r * Math.cos(angle);
      mwPos[i * 3 + 1] = spread;
      mwPos[i * 3 + 2] = r * Math.sin(angle);

      const colorVal = 0.4 + Math.random() * 0.4;
      mwCols[i * 3] = colorVal * 0.8;
      mwCols[i * 3 + 1] = colorVal * 0.9;
      mwCols[i * 3 + 2] = colorVal * 1.0;
    }
    mwGeo.setAttribute('position', new THREE.BufferAttribute(mwPos, 3));
    mwGeo.setAttribute('color', new THREE.BufferAttribute(mwCols, 3));
    const mwMat = new THREE.PointsMaterial({
      size: 4.0,
      vertexColors: true,
      transparent: true,
      opacity: palette === 'daylight' ? 0.15 : 0.4,
      blending: THREE.AdditiveBlending,
    });
    const mwRibbon = new THREE.Points(mwGeo, mwMat);
    scene.add(mwRibbon);

    // --- 4. Warp Speed Streaks Particle System (Hyperspace Flight) ---
    const warpCount = 600;
    const warpGeo = new THREE.BufferGeometry();
    const warpPos = new Float32Array(warpCount * 6);
    const warpCols = new Float32Array(warpCount * 6);

    for (let i = 0; i < warpCount; i++) {
      const x = (Math.random() - 0.5) * 80;
      const y = (Math.random() - 0.5) * 80;
      const z = (Math.random() - 0.5) * 120;
      const len = 3 + Math.random() * 8;

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
      warpCols[i * 6 + 3] = 0.8;
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
    });
    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    warpLinesRef.current = warpLines;
    scene.add(warpLines);

    // --- 5. Luminous Target Star Celestial Body ---
    const targetGroup = new THREE.Group();
    scene.add(targetGroup);

    // Central Star Sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(target?.color || '#38bdf8'),
    });
    const targetSphere = new THREE.Mesh(sphereGeo, sphereMat);
    targetMeshRef.current = targetSphere;
    targetGroup.add(targetSphere);

    // Soft Radial Volumetric Halo Sprite
    const haloTex = createHaloTexture(target?.haloColor || '#38bdf8', 'rgba(2,132,199,0)');
    const haloMat = new THREE.SpriteMaterial({
      map: haloTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.95,
    });
    const haloSprite = new THREE.Sprite(haloMat);
    haloSprite.scale.set(6.5, 6.5, 1);
    haloSpriteRef.current = haloSprite;
    targetGroup.add(haloSprite);

    // 4-Point Diffraction Spike Flare Sprite
    const spikeTex = createDiffractionSpikeTexture(target?.color || '#ffffff');
    const spikeMat = new THREE.SpriteMaterial({
      map: spikeTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
    });
    const spikeSprite = new THREE.Sprite(spikeMat);
    spikeSprite.scale.set(11.0, 11.0, 1);
    spikeSpriteRef.current = spikeSprite;
    targetGroup.add(spikeSprite);

    // Circumstellar Protoplanetary Disk (for RW Aurigae)
    const diskGeo = new THREE.RingGeometry(2.0, 4.5, 48);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: target?.hasDisk ? 0.6 : 0.0,
    });
    const diskMesh = new THREE.Mesh(diskGeo, diskMat);
    diskMesh.rotation.x = Math.PI / 2.8;
    diskMeshRef.current = diskMesh;
    targetGroup.add(diskMesh);

    // --- 6. Trajectory Line & Ghost Epoch Markers ---
    const trajLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2,
    });
    const trajLineGeo = new THREE.BufferGeometry();
    const trajLine = new THREE.Line(trajLineGeo, trajLineMat);
    trajectoryLineRef.current = trajLine;
    scene.add(trajLine);

    const ghostGroup = new THREE.Group();
    ghostMarkersGroupRef.current = ghostGroup;
    scene.add(ghostGroup);

    // --- 7. Mouse Orbit & Touch Drag Listeners ---
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

    // --- 8. Render Loop ---
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Subtle atmospheric shimmer
      if (spikeSpriteRef.current) {
        spikeSpriteRef.current.material.rotation = elapsed * 0.03;
        const shimmer = 1.0 + 0.08 * Math.sin(elapsed * 4.0);
        spikeSpriteRef.current.scale.set(11.0 * shimmer, 11.0 * shimmer, 1);
      }

      if (haloSpriteRef.current) {
        const pulse = 1.0 + 0.05 * Math.sin(elapsed * 2.5);
        haloSpriteRef.current.scale.set(6.5 * pulse, 6.5 * pulse, 1);
      }

      if (diskMeshRef.current && target?.hasDisk) {
        diskMeshRef.current.rotation.z = elapsed * 0.2;
      }

      // Camera position updating around lookAt
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

    // Convert to 3D coordinates relative to origin
    const [targetX, targetY, targetZ] = raDecToCartesian(currentRa, currentDec, 0.0);
    // Angular motion scale in Three.js visual space (magnified for clarity)
    const visualScale = 0.12;
    const posX = draDeg * 3600.0 * visualScale;
    const posY = ddecDeg * 3600.0 * visualScale;
    const posZ = 0;

    // Update target mesh position
    if (targetMeshRef.current) {
      targetMeshRef.current.position.set(posX, posY, posZ);
      targetLookAtRef.current.set(posX * 0.7, posY * 0.7, posZ);
    }
    if (haloSpriteRef.current) {
      haloSpriteRef.current.position.set(posX, posY, posZ);
    }
    if (spikeSpriteRef.current) {
      spikeSpriteRef.current.position.set(posX, posY, posZ);
    }
    if (diskMeshRef.current) {
      diskMeshRef.current.position.set(posX, posY, posZ);
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
      // Clear previous markers
      while (gGroup.children.length > 0) {
        gGroup.remove(gGroup.children[0]);
      }

      const milestones = [
        { y: 2014.5, label: '2014.5 WISE Baseline', color: 0x93c5fd },
        { y: 2025.0, label: '2025.0 SPHEREx DR1', color: 0x38bdf8 },
        { y: 2026.5, label: '2026.5 SPHEREx QR3', color: 0xec4899 },
        { y: 2035.0, label: '2035.0 Projection', color: 0xfbbf24 },
      ];

      milestones.forEach(({ y, label, color }) => {
        const mdt = y - 2015.5;
        const mX = (((pm.ra * mdt) / 3600.0) / Math.cos((baseDec * Math.PI) / 180.0)) * 3600.0 * visualScale;
        const mY = ((pm.dec * mdt) / 3600.0) * 3600.0 * visualScale;

        // Ghost sphere marker
        const mGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const mMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.65,
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
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.position.set(mX, mY, 0);

        gGroup.add(mMesh);
        gGroup.add(rMesh);
      });
    }
  }, [target, year]);

  // --- Real Gaia DR3 Reference Starfield Overlays ---
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
      const brightness = Math.max(0.2, Math.min(1.0, (20.0 - mag) / 8.0));
      gCols[i * 3] = brightness * 0.9;
      gCols[i * 3 + 1] = brightness * 0.95;
      gCols[i * 3 + 2] = brightness * 1.0;
    });

    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(gCols, 3));

    const gMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
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

  // Update star colors and halo textures when target changes
  useEffect(() => {
    if (!target) return;
    if (targetMeshRef.current) {
      targetMeshRef.current.material.color.set(target.color || '#38bdf8');
    }
    if (haloSpriteRef.current) {
      haloSpriteRef.current.material.map = createHaloTexture(target.haloColor || '#38bdf8', 'rgba(0,0,0,0)');
      haloSpriteRef.current.material.needsUpdate = true;
    }
    if (spikeSpriteRef.current) {
      spikeSpriteRef.current.material.map = createDiffractionSpikeTexture(target.color || '#ffffff');
      spikeSpriteRef.current.material.needsUpdate = true;
    }
    if (diskMeshRef.current) {
      diskMeshRef.current.material.opacity = target.hasDisk ? 0.6 : 0.0;
    }
  }, [target]);

  const isDipole = target?.expectedSignature === 'dipole' || (target?.properMotion?.total > 0.05);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Telemetry HUD Pill (Top Left of 3D Scene) */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-slate-900 space-y-1">
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/50 text-[11px] font-medium text-slate-700 shadow-sm">
          <Navigation className="w-3.5 h-3.5 text-sky-600" />
          <span>Click & Drag to rotate 3D view • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
