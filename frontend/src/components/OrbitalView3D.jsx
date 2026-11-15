import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { NASA_TARGETS } from '../data/targets';
import { Compass, Telescope, Eye, Sparkles, Navigation, Globe } from 'lucide-react';

export default function OrbitalView3D({
  onSelectTarget,
  onEnterTelescope,
  selectedTarget,
}) {
  const mountRef = useRef(null);
  const [hoveredTarget, setHoveredTarget] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- 1. Scene, Camera, Renderer ---
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x050814, 0.003);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // --- 2. Starfield Background (3000 Stars) ---
    const starCount = 3500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfca5a5),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 250 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i * 3] = col.r;
      starColors[i * 3 + 1] = col.g;
      starColors[i * 3 + 2] = col.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // --- 3. High-Res Procedural Earth Globe ---
    const earthRadius = 5.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Procedural Earth surface canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0a2540');
    oceanGrad.addColorStop(0.5, '#0b3c6d');
    oceanGrad.addColorStop(1, '#082038');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Stylized procedural continents
    ctx.fillStyle = '#22c55e';
    const numContinents = 70;
    for (let c = 0; c < numContinents; c++) {
      const cx = (c * 173) % 1024;
      const cy = 100 + ((c * 97) % 312);
      const rad = 25 + (c % 5) * 16;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ice caps
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 1024, 45);
    ctx.fillRect(0, 467, 1024, 45);

    const earthTexture = new THREE.CanvasTexture(canvas);
    earthTexture.wrapS = THREE.RepeatWrapping;
    earthTexture.wrapT = THREE.ClampToEdgeWrapping;

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Atmosphere Glow Shell
    const atmoGeo = new THREE.SphereGeometry(earthRadius * 1.08, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // Clouds Layer
    const cloudsCanvas = document.createElement('canvas');
    cloudsCanvas.width = 512;
    cloudsCanvas.height = 256;
    const cCtx = cloudsCanvas.getContext('2d');
    cCtx.fillStyle = 'rgba(0,0,0,0)';
    cCtx.fillRect(0, 0, 512, 256);
    cCtx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 123) % 512;
      const y = 80 + ((i * 57) % 96);
      cCtx.beginPath();
      cCtx.ellipse(x, y, 40, 15, Math.PI / 6, 0, Math.PI * 2);
      cCtx.fill();
    }
    const cloudsTexture = new THREE.CanvasTexture(cloudsCanvas);
    const cloudsGeo = new THREE.SphereGeometry(earthRadius * 1.025, 48, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.45,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    // --- 4. SPHEREx Satellite & Low Earth Orbit Trace ---
    const orbitRadius = earthRadius * 1.45;
    const orbitCurve = new THREE.EllipseCurve(
      0, 0,
      orbitRadius, orbitRadius * 0.96,
      0, 2 * Math.PI,
      false,
      0
    );
    const orbitPoints = orbitCurve.getPoints(120);
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(
      orbitPoints.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    const orbitLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitLineMat);
    orbitLine.rotation.x = Math.PI / 4;
    orbitLine.rotation.y = Math.PI / 6;
    scene.add(orbitLine);

    // SPHEREx Spacecraft Model Group
    const satelliteGroup = new THREE.Group();
    // Sunshield cone
    const shieldGeo = new THREE.ConeGeometry(0.35, 0.7, 16, 1, true);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.rotation.x = Math.PI / 2;
    satelliteGroup.add(shieldMesh);

    // Instrument bus
    const busGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 6);
    const busMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6 });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.position.z = -0.3;
    satelliteGroup.add(busMesh);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(1.2, 0.02, 0.3);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.9, roughness: 0.1 });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    panelMesh.position.z = -0.3;
    satelliteGroup.add(panelMesh);

    scene.add(satelliteGroup);

    // --- 5. NASA Target Beacons in Celestial Coordinates ---
    const targetGroup = new THREE.Group();
    const beaconObjects = [];

    NASA_TARGETS.forEach((target) => {
      const pos = target.position3D || [0, 0, 0];
      const targetPos = new THREE.Vector3(...pos);

      // Glowing core sphere
      const beaconGeo = new THREE.SphereGeometry(0.65, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(target.color || '#38bdf8'),
      });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.copy(targetPos);
      beaconMesh.userData = { target };

      // Outer pulsating aura ring
      const ringGeo = new THREE.RingGeometry(0.9, 1.25, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(target.color || '#38bdf8'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(targetPos);
      ringMesh.lookAt(0, 0, 0);

      // Guide line from Earth to beacon
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        targetPos,
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(target.color || '#38bdf8'),
        dashSize: 1.5,
        gapSize: 1.0,
        transparent: true,
        opacity: 0.25,
      });
      const guideLine = new THREE.Line(lineGeo, lineMat);
      guideLine.computeLineDistances();

      targetGroup.add(beaconMesh);
      targetGroup.add(ringMesh);
      targetGroup.add(guideLine);

      beaconObjects.push({ beacon: beaconMesh, ring: ringMesh, target });
    });

    scene.add(targetGroup);

    // --- 6. Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    sunLight.position.set(40, 20, 50);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-40, -10, -30);
    scene.add(fillLight);

    // --- 7. Mouse Orbit & Interaction ---
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 25, theta: 0.2, phi: 1.2 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        spherical.theta -= dx * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.005));
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      // Raycast beacon hover
      raycaster.setFromCamera(mouse, camera);
      const meshes = beaconObjects.map((b) => b.beacon);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData.target;
        setHoveredTarget(hit);
        container.style.cursor = 'pointer';
      } else {
        setHoveredTarget(null);
        container.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(10, Math.min(65, spherical.radius + e.deltaY * 0.02));
    };

    const onClick = (e) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = beaconObjects.map((b) => b.beacon);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const target = intersects[0].object.userData.target;
        triggerFlyTo(target);
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // --- 8. Fly-To Animation Helper ---
    let flyAnimation = null;
    function triggerFlyTo(target) {
      if (isTransitioning) return;
      setIsTransitioning(true);
      onSelectTarget?.(target);

      const targetPos = new THREE.Vector3(...(target.position3D || [0, 0, 0]));
      const startCam = camera.position.clone();
      const endCam = targetPos.clone().multiplyScalar(0.7).add(new THREE.Vector3(0, 1.5, 2));

      const startTime = performance.now();
      const duration = 1800; // 1.8s smooth zoom

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        // Smooth easeInOutCubic
        const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startCam, endCam, ease);
        camera.lookAt(targetPos.clone().multiplyScalar(ease));

        if (progress < 1.0) {
          flyAnimation = requestAnimationFrame(step);
        } else {
          setIsTransitioning(false);
          onEnterTelescope?.();
        }
      }
      flyAnimation = requestAnimationFrame(step);
    }

    // --- 9. Animation Loop ---
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Earth & Cloud rotation
      earthMesh.rotation.y = time * 0.04;
      cloudsMesh.rotation.y = time * 0.05;

      // SPHEREx satellite orbit trajectory
      const satAngle = time * 0.8;
      const satX = orbitRadius * Math.cos(satAngle);
      const satZ = orbitRadius * 0.96 * Math.sin(satAngle);
      const posVec = new THREE.Vector3(satX, 0, satZ);
      posVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 4);
      posVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
      satelliteGroup.position.copy(posVec);
      satelliteGroup.lookAt(earthMesh.position);

      // Pulse beacon rings
      beaconObjects.forEach(({ ring }, idx) => {
        const scale = 1.0 + 0.22 * Math.sin(time * 3.5 + idx);
        ring.scale.set(scale, scale, 1);
        ring.lookAt(camera.position);
      });

      // Update camera position when not animating fly-to
      if (!isTransitioning) {
        if (!isDragging) {
          spherical.theta += 0.001; // subtle idle rotation
        }
        camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
        camera.position.y = spherical.radius * Math.cos(spherical.phi);
        camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
        camera.lookAt(0, 0, 0);
      }

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
      if (flyAnimation) cancelAnimationFrame(flyAnimation);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onSelectTarget, onEnterTelescope]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050814]">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Fly-to Flash Transition Overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-cyan-400/20 backdrop-blur-sm pointer-events-none transition-opacity duration-700 animate-pulse" />
      )}

      {/* Hovered Target HUD Card (Artemis Live Style) */}
      {hoveredTarget && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_12px_36px_rgba(0,0,0,0.4)] text-slate-900 flex items-center gap-3">
            <span className="text-2xl">{hoveredTarget.icon || '✨'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-sky-600 uppercase">Target Beacon</span>
                <span className="text-xs font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {hoveredTarget.distanceLy ? `${hoveredTarget.distanceLy} ly` : 'Outer Solar System'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">{hoveredTarget.name}</div>
              <div className="text-[11px] text-slate-600 flex items-center gap-2 font-mono">
                <span>RA: {hoveredTarget.ra?.toFixed(3)}°</span>
                <span>Dec: {hoveredTarget.dec?.toFixed(3)}°</span>
                <span className="text-amber-600 font-bold">• Click beacon to fly into Sky View</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Center 3D Mode Actions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 px-2">
          <Globe className="w-4 h-4 text-sky-600 animate-spin" style={{ animationDuration: '18s' }} />
          <span>Interactive Earth Orbit (Artemis 3D Mode)</span>
        </div>
        <div className="h-4 w-[1px] bg-slate-300 mx-1" />
        <button
          onClick={() => onEnterTelescope?.()}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Telescope className="w-3.5 h-3.5" />
          <span>Enter Telescope View</span>
        </button>
      </div>

      {/* 3D Mission Status HUD Pill (Top Left) */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none hidden sm:block">
        <div className="px-3.5 py-2 rounded-2xl bg-white/75 backdrop-blur-xl border border-white/40 shadow-lg text-slate-800 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Telemetry Online</span>
          </div>
          <div className="text-xs font-black font-mono">SPHEREx Spacecraft • Low Earth Sun-Sync Orbit</div>
          <div className="text-[10px] text-slate-500 font-mono">Altitude: 700 km • Orbit Period: 98.8 min • 102 NIR Bands</div>
        </div>
      </div>
    </div>
  );
}
