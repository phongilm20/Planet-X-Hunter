import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createCircularPointTexture } from '../utils/celestialTextures';
import { Compass, Eye, Navigation, Sparkles, Orbit, Telescope } from 'lucide-react';

export default function SolarSystemView3D({
  onSelectTarget,
  onReturnToDeepSpace,
}) {
  const mountRef = useRef(null);
  const [hoveredObject, setHoveredObject] = useState(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    camera.position.set(0, 140, 220);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    const circleTex = createCircularPointTexture();

    // --- 1. Background Starfield ---
    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 800 + Math.random() * 400;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(ph);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      map: circleTex,
      transparent: true,
      depthWrite: false,
      color: 0x93c5fd,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // --- 2. Central Sun ---
    const sunGeo = new THREE.SphereGeometry(4.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    // Sun point light
    const sunLight = new THREE.PointLight(0xfff7ed, 3.5, 2000, 0.5);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x1e293b, 0.25));

    // Sun corona flare
    const coronaGeo = new THREE.RingGeometry(4.6, 8.5, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.rotation.x = Math.PI / 2;
    scene.add(corona);

    // --- 3. Planetary Orbit Rings & Bodies ---
    const planets = [
      { name: 'Earth', radius: 14, size: 1.0, color: 0x38bdf8, speed: 1.0, desc: '1.0 AU • Home Observatory' },
      { name: 'Mars', radius: 21, size: 0.8, color: 0xef4444, speed: 0.8, desc: '1.5 AU • Terrestrial Boundary' },
      { name: 'Jupiter', radius: 42, size: 2.2, color: 0xfbbf24, speed: 0.45, desc: '5.2 AU • Gas Giant' },
      { name: 'Saturn', radius: 62, size: 1.8, color: 0xfde047, speed: 0.32, desc: '9.5 AU • Ringed Giant' },
      { name: 'Neptune', radius: 95, size: 1.5, color: 0x60a5fa, speed: 0.18, desc: '30.0 AU • Known Planetary Boundary' },
    ];

    const planetMeshes = [];

    planets.forEach((p) => {
      // Orbit Ring
      const orbitCurve = new THREE.EllipseCurve(0, 0, p.radius, p.radius);
      const points = orbitCurve.getPoints(64);
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(
        points.map((pt) => new THREE.Vector3(pt.x, 0, pt.y))
      );
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x475569,
        transparent: true,
        opacity: 0.4,
      });
      scene.add(new THREE.Line(orbitGeo, orbitMat));

      // Planet Sphere
      const pGeo = new THREE.SphereGeometry(p.size, 16, 16);
      const pMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.5 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.userData = p;
      scene.add(pMesh);
      planetMeshes.push({ mesh: pMesh, ...p });
    });

    // --- 4. Kuiper Belt Debris Torus (30 to 55 AU) ---
    const kbCount = 1800;
    const kbGeo = new THREE.BufferGeometry();
    const kbPos = new Float32Array(kbCount * 3);
    for (let i = 0; i < kbCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 95 + Math.random() * 45; // 30 - 50 AU scale
      const y = (Math.random() - 0.5) * 8;
      kbPos[i * 3] = r * Math.cos(angle);
      kbPos[i * 3 + 1] = y;
      kbPos[i * 3 + 2] = r * Math.sin(angle);
    }
    kbGeo.setAttribute('position', new THREE.BufferAttribute(kbPos, 3));
    const kbMat = new THREE.PointsMaterial({
      size: 1.8,
      map: circleTex,
      transparent: true,
      depthWrite: false,
      color: 0x94a3b8,
      opacity: 0.4,
    });
    scene.add(new THREE.Points(kbGeo, kbMat));

    // --- 5. Elongated Hypothetical Planet X Orbit (a = 160, e = 0.62, inc = 28°) ---
    const pxCurve = new THREE.EllipseCurve(
      -45, 0, // Eccentric offset
      175, 110,
      0, 2 * Math.PI
    );
    const pxPoints = pxCurve.getPoints(120);
    const pxOrbitGeo = new THREE.BufferGeometry().setFromPoints(
      pxPoints.map((pt) => new THREE.Vector3(pt.x, 0, pt.y))
    );
    const pxOrbitMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4, // Vibrant Cyan
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });
    const pxOrbitLine = new THREE.Line(pxOrbitGeo, pxOrbitMat);
    // Apply 28-degree orbital inclination
    pxOrbitLine.rotation.z = (28 * Math.PI) / 180;
    pxOrbitLine.rotation.y = (15 * Math.PI) / 180;
    scene.add(pxOrbitLine);

    // Planet X 3D Body
    const pxGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const pxMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const planetXMesh = new THREE.Mesh(pxGeo, pxMat);
    planetXMesh.userData = {
      name: 'Planet X Candidate',
      desc: '~450 AU • Extreme Eccentric Orbit • Target of SPHEREx Hunt',
    };
    scene.add(planetXMesh);

    // --- 6. Directional Interstellar Sightlines (to WISE 0855, Barnard's, etc.) ---
    const interstellarTargets = [
      { name: 'WISE 0855 (7.3 ly)', dir: new THREE.Vector3(-180, 40, -120), color: 0x38bdf8 },
      { name: "Barnard's Star (5.96 ly)", dir: new THREE.Vector3(160, 60, -140), color: 0xef4444 },
      { name: 'ε Indi B (11.9 ly)', dir: new THREE.Vector3(140, -80, 150), color: 0xf97316 },
    ];

    interstellarTargets.forEach((st) => {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        st.dir,
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: st.color,
        dashSize: 6,
        gapSize: 4,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      scene.add(line);

      // Endpoint beacon sphere
      const bGeo = new THREE.SphereGeometry(1.6, 16, 16);
      const bMat = new THREE.MeshBasicMaterial({ color: st.color });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.copy(st.dir);
      scene.add(bMesh);
    });

    // --- 7. Mouse Orbit Controls ---
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let spherical = { radius: 260, theta: 0.4, phi: 1.1 };

    const onMouseDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        spherical.theta -= dx * 0.005;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.005));
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      spherical.radius = Math.max(50, Math.min(650, spherical.radius + e.deltaY * 0.2));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // --- 8. Animation Loop ---
    let frameId;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Planet orbital positions
      planetMeshes.forEach(({ mesh, radius, speed }) => {
        const angle = time * speed * 0.3;
        mesh.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
      });

      // Planet X eccentric orbital motion
      const pxAngle = time * 0.05;
      const pxX = -45 + 175 * Math.cos(pxAngle);
      const pxZ = 110 * Math.sin(pxAngle);
      const pxPos = new THREE.Vector3(pxX, 0, pxZ);
      pxPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), (28 * Math.PI) / 180);
      pxPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), (15 * Math.PI) / 180);
      planetXMesh.position.copy(pxPos);

      // Camera update
      if (!isDragging) {
        spherical.theta += 0.0006;
      }
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0, 0);

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

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Scale Legend Pill (Top Left) */}
      <div className="absolute top-20 left-6 z-20 pointer-events-none">
        <div className="px-4 py-3 rounded-2xl bg-white/92 backdrop-blur-xl border border-white/70 shadow-xl text-slate-900 space-y-1 max-w-xs">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-cyan-600" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
              Outer Solar System Scale
            </span>
          </div>
          <div className="text-xs text-slate-700 leading-snug">
            Visualizing the Sun (1 AU) $\rightarrow$ Kuiper Belt (30–55 AU) $\rightarrow$ Eccentric <strong>Planet X Orbit (~450 AU)</strong>.
          </div>
          <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-cyan-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
            <span>Cyan Ellipse: Planet X Orbit</span>
          </div>
        </div>
      </div>

      {/* Return to Deep Space Action Button (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={onReturnToDeepSpace}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <Telescope className="w-4 h-4" />
          <span>Return to Deep-Space Target View</span>
        </button>
      </div>
    </div>
  );
}
