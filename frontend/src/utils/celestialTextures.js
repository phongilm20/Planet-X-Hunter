import * as THREE from 'three';

/**
 * Generate a programmatic circular anti-aliased particle texture
 * Eliminates all square particle and gray-box artifacts in WebGL Points
 */
export function createCircularPointTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Generate razor-sharp 4-point space telescope diffraction spikes
 */
export function createRazorDiffractionSpikeTexture(color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 1024);

  // Horizontal delicate spike with gaussian taper
  const hGrad = ctx.createLinearGradient(0, 512, 1024, 512);
  hGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
  hGrad.addColorStop(0.42, 'rgba(255,255,255,0.15)');
  hGrad.addColorStop(0.49, 'rgba(255,255,255,0.85)');
  hGrad.addColorStop(0.5, color);
  hGrad.addColorStop(0.51, 'rgba(255,255,255,0.85)');
  hGrad.addColorStop(0.58, 'rgba(255,255,255,0.15)');
  hGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 511, 1024, 3);

  // Vertical delicate spike
  const vGrad = ctx.createLinearGradient(512, 0, 512, 1024);
  vGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
  vGrad.addColorStop(0.42, 'rgba(255,255,255,0.15)');
  vGrad.addColorStop(0.49, 'rgba(255,255,255,0.85)');
  vGrad.addColorStop(0.5, color);
  vGrad.addColorStop(0.51, 'rgba(255,255,255,0.85)');
  vGrad.addColorStop(0.58, 'rgba(255,255,255,0.15)');
  vGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = vGrad;
  ctx.fillRect(511, 0, 3, 1024);

  // Central circular optical flare core
  const cGrad = ctx.createRadialGradient(512, 512, 0, 512, 512, 96);
  cGrad.addColorStop(0.0, '#FFFFFF');
  cGrad.addColorStop(0.2, color);
  cGrad.addColorStop(0.6, 'rgba(255,255,255,0.12)');
  cGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(512, 512, 96, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * High-Resolution 2048x1024 Surface, Bump, and Emissive Texture Generator
 * Distinct physics-based layers for Brown Dwarfs/Exoplanets vs Active Stars
 */
export function generateCelestialPBRMaps(target) {
  const width = 2048;
  const height = 1024;

  const isStar = target?.lightCurveType === 'mira' || 
                 target?.lightCurveType === 'ttauri' || 
                 target?.type?.includes('Red Dwarf') || 
                 target?.type?.includes('Star');

  // 1. Surface Albedo Map Canvas
  const surfCanvas = document.createElement('canvas');
  surfCanvas.width = width;
  surfCanvas.height = height;
  const sCtx = surfCanvas.getContext('2d');

  // 2. Bump Map Canvas
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');

  // 3. Emissive Map Canvas
  const emissCanvas = document.createElement('canvas');
  emissCanvas.width = width;
  emissCanvas.height = height;
  const eCtx = emissCanvas.getContext('2d');

  if (!isStar) {
    // ══════════════════════════════════════════════════════════════════════════
    // GAS GIANT / SUB-BROWN DWARF / PLANET X ARCHITECTURE
    // Cloud belts, Coriolis shear vortices, glowing deep-infrared thermal rifts
    // ══════════════════════════════════════════════════════════════════════════

    const isPlanetX = target?.name?.includes('Planet X');
    const isColdY = target?.spectralType?.includes('Y1') || target?.name?.includes('0855');

    // Palette base colors
    const bandDark = isPlanetX ? '#06283D' : isColdY ? '#0B1E36' : '#2A1B0E';
    const bandMid = isPlanetX ? '#1363DF' : isColdY ? '#1E3A8A' : '#7C2D12';
    const bandLight = isPlanetX ? '#47B5FF' : isColdY ? '#38BDF8' : '#F97316';
    const riftGlow = isPlanetX ? '#22D3EE' : isColdY ? '#60A5FA' : '#FBBF24';

    // Base background gradient
    const bgGrad = sCtx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0.0, bandDark);
    bgGrad.addColorStop(0.5, bandMid);
    bgGrad.addColorStop(1.0, bandDark);
    sCtx.fillStyle = bgGrad;
    sCtx.fillRect(0, 0, width, height);

    // Initial bump & emissive fill
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, width, height);
    eCtx.fillStyle = '#000000';
    eCtx.fillRect(0, 0, width, height);

    // Latitudinal Cloud Belts (24 distinct zones)
    const numBelts = 28;
    for (let b = 0; b < numBelts; b++) {
      const yStart = (b / numBelts) * height;
      const bHeight = height / numBelts;
      const isAlt = b % 2 === 0;

      sCtx.fillStyle = isAlt ? bandMid : bandLight;
      sCtx.globalAlpha = 0.5 + Math.sin(b * 0.7) * 0.25;

      // Draw sinusoidal turbulent belt with shear waves
      sCtx.beginPath();
      sCtx.moveTo(0, yStart);
      for (let x = 0; x <= width; x += 32) {
        const wave = Math.sin((x / width) * Math.PI * (4 + (b % 5))) * 12 +
                     Math.cos((x / width) * Math.PI * 14) * 6;
        sCtx.lineTo(x, yStart + wave);
      }
      sCtx.lineTo(width, yStart + bHeight);
      sCtx.lineTo(0, yStart + bHeight);
      sCtx.closePath();
      sCtx.fill();

      // Bump map shading for belts
      bCtx.fillStyle = isAlt ? '#A0A0A0' : '#606060';
      bCtx.globalAlpha = 0.6;
      bCtx.fillRect(0, yStart, width, bHeight);
    }
    sCtx.globalAlpha = 1.0;
    bCtx.globalAlpha = 1.0;

    // Coriolis Anticyclonic Storm Vortices (Great-Red-Spot analogues)
    const numStorms = 6;
    for (let s = 0; s < numStorms; s++) {
      const sx = (s * 347 + 180) % width;
      const sy = 250 + ((s * 179) % 520);
      const rx = 65 + (s % 3) * 25;
      const ry = 30 + (s % 2) * 12;

      // Storm outer swirl
      sCtx.fillStyle = bandDark;
      sCtx.beginPath();
      sCtx.ellipse(sx, sy, rx, ry, Math.PI / 12, 0, Math.PI * 2);
      sCtx.fill();

      // Storm inner eye
      sCtx.fillStyle = bandLight;
      sCtx.beginPath();
      sCtx.ellipse(sx, sy, rx * 0.55, ry * 0.55, -Math.PI / 8, 0, Math.PI * 2);
      sCtx.fill();

      // Bump depression
      bCtx.fillStyle = '#404040';
      bCtx.beginPath();
      bCtx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      bCtx.fill();
    }

    // Glowing Deep-Infrared Thermal Cracks / Rifts (Emissive Map)
    eCtx.fillStyle = riftGlow;
    eCtx.strokeStyle = riftGlow;
    eCtx.lineWidth = 3.5;
    eCtx.shadowColor = riftGlow;
    eCtx.shadowBlur = 12;

    const numCracks = 16;
    for (let c = 0; c < numCracks; c++) {
      const cx = (c * 131) % width;
      const cy = 180 + ((c * 73) % 680);
      eCtx.beginPath();
      eCtx.moveTo(cx, cy);
      let currX = cx;
      let currY = cy;
      for (let seg = 0; seg < 8; seg++) {
        currX += (Math.random() - 0.2) * 45;
        currY += (Math.random() - 0.5) * 18;
        eCtx.lineTo(currX, currY);
      }
      eCtx.stroke();
    }

  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // STELLAR ARCHITECTURE (Barnard's Star, RW Aurigae, R Draconis)
    // Convective solar granulation, starspots, active faculae, incandescent core
    // ══════════════════════════════════════════════════════════════════════════

    const isMira = target?.lightCurveType === 'mira';
    const isRedDwarf = target?.spectralType?.includes('M4Ve');

    const coreColor = isMira ? '#C084FC' : isRedDwarf ? '#EF4444' : '#FBBF24';
    const midColor = isMira ? '#7E22CE' : isRedDwarf ? '#B91C1C' : '#D97706';
    const darkColor = isMira ? '#3B0764' : isRedDwarf ? '#450A0A' : '#78350F';
    const spotColor = '#1C0A00';

    // Incandescent solar background
    const starGrad = sCtx.createLinearGradient(0, 0, width, height);
    starGrad.addColorStop(0.0, coreColor);
    starGrad.addColorStop(0.5, midColor);
    starGrad.addColorStop(1.0, darkColor);
    sCtx.fillStyle = starGrad;
    sCtx.fillRect(0, 0, width, height);

    // Convective Cellular Granulation Pattern (1,200 convective cells)
    sCtx.fillStyle = coreColor;
    sCtx.globalAlpha = 0.25;
    for (let g = 0; g < 1200; g++) {
      const gx = (g * 97) % width;
      const gy = (g * 137) % height;
      const rad = 6 + (g % 5) * 4;
      sCtx.beginPath();
      sCtx.arc(gx, gy, rad, 0, Math.PI * 2);
      sCtx.fill();
    }
    sCtx.globalAlpha = 1.0;

    // Dark Magnetic Starspots (Umbra & Penumbra)
    const numSpots = 18;
    for (let sp = 0; sp < numSpots; sp++) {
      const sx = (sp * 211 + 60) % width;
      const sy = 280 + ((sp * 91) % 460); // Concentrated in active stellar latitudes
      const sRad = 15 + (sp % 4) * 10;

      // Penumbra (warm dark ring)
      sCtx.fillStyle = darkColor;
      sCtx.beginPath();
      sCtx.arc(sx, sy, sRad * 1.6, 0, Math.PI * 2);
      sCtx.fill();

      // Umbra (dark magnetic core)
      sCtx.fillStyle = spotColor;
      sCtx.beginPath();
      sCtx.arc(sx, sy, sRad, 0, Math.PI * 2);
      sCtx.fill();

      // Bump depression
      bCtx.fillStyle = '#202020';
      bCtx.beginPath();
      bCtx.arc(sx, sy, sRad * 1.6, 0, Math.PI * 2);
      bCtx.fill();

      // Bright active magnetic faculae around the spots
      sCtx.fillStyle = '#FFFFFF';
      sCtx.globalAlpha = 0.45;
      for (let f = 0; f < 6; f++) {
        const fx = sx + (Math.random() - 0.5) * sRad * 2.5;
        const fy = sy + (Math.random() - 0.5) * sRad * 2.5;
        sCtx.beginPath();
        sCtx.arc(fx, fy, 4, 0, Math.PI * 2);
        sCtx.fill();
      }
      sCtx.globalAlpha = 1.0;
    }

    // Stellar Emissive Map: Glowing radiant heat
    eCtx.fillStyle = coreColor;
    eCtx.fillRect(0, 0, width, height);
    // Darken starspots in emissive map
    for (let sp = 0; sp < numSpots; sp++) {
      const sx = (sp * 211 + 60) % width;
      const sy = 280 + ((sp * 91) % 460);
      const sRad = 15 + (sp % 4) * 10;
      eCtx.fillStyle = '#050200';
      eCtx.beginPath();
      eCtx.arc(sx, sy, sRad, 0, Math.PI * 2);
      eCtx.fill();
    }
  }

  // Convert canvases to Three.js textures
  const map = new THREE.CanvasTexture(surfCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 16;
  map.generateMipmaps = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.anisotropy = 16;

  const emissiveMap = new THREE.CanvasTexture(emissCanvas);
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.anisotropy = 16;

  return { map, bumpMap, emissiveMap, isStar };
}
