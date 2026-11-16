# 🚀 Serverless & Local-First Architecture: Client-Side Observation Patch Engine

**Project:** SPHEREx Time-Domain Sky Explorer & Planet X Hunter  
**Context:** NASA Space Apps Challenge 2026 — "Planet X and SPHEREx"  
**Architecture Pattern:** Local-First / Edge Client-Side Processing (Zero Dedicated Backend)

---

## 1. Architectural Concept & Rationale

Instead of relying on an always-on Python server to compute image differences, peak detections, and spectral slices on every user interaction, this architecture implements a **Local-First Web Pipeline**:

1. **On-Demand Patch Retrieval:** When a user selects a sky region or target, the browser downloads a compact observation package (a "patch") into local browser memory (`IndexedDB` / `Float32Array`).
2. **100% Client-Side Processing:** All subsequent manipulations—temporal blinking, difference image subtraction ($\Delta I = E_2 - E_1$), non-linear astronomical stretching (`asinh`, `log`), 102-band spectral scrubbing, and dipole anomaly detection—run directly in the user's browser using JavaScript and HTML5 Canvas.
3. **Zero Backend Maintenance:** The application deploys as a static Single Page Application (SPA) to **GitHub Pages or Vercel** with 100% guaranteed uptime, zero server hosting costs, and zero risk of backend sleep/cold starts during hackathon judging.

---

## 2. End-to-End Workflow Diagram

```
                     [ User Inputs Coordinates or Selects Preset ]
                                          │
                                          ▼
             ┌───────────────────────────────────────────────────────────┐
             │               Browser Memory / IndexedDB Cache            │
             │           (Check if sky patch is already stored)          │
             └────────────────────────────┬──────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
       [ Cache HIT: In Memory ]                        [ Cache MISS: New Sky Patch ]
                  │                                               │
                  │                                               ▼
                  │                                  ┌───────────────────────────┐
                  │                                  │ Fetch Compressed Patch    │
                  │                                  │ (~500 KB - 1.5 MB bundle) │
                  │                                  └─────────────┬─────────────┘
                  │                                                │
                  └───────────────────────┬────────────────────────┘
                                          ▼
                         [ Stored in Local IndexedDB ]
                                          │
                                          ▼
                 ┌─────────────────────────────────────────────────┐
                 │       Pure Client-Side Computation Engine       │
                 │  • Fast Array Subtraction (E2 - E1)             │
                 │  • Real-Time Asinh / Log Stretch                │
                 │  • 60 FPS Auto-Blink Comparator                 │
                 │  • Z-Score Dipole / Planet X Peak Finding       │
                 │  • 102-Channel Interactive SED Slicing          │
                 └────────────────────────┬────────────────────────┘
                                          │
                                          ▼
                 ┌─────────────────────────────────────────────────┐
                 │          Interactive Presentation Tier          │
                 │  • HTML5 Canvas Viewport (Blink / Diff Modes)   │
                 │  • Plotly.js 102-Band Spectrogram               │
                 │  • CDS Aladin Lite v3 (Direct HiPS Context)     │
                 │  • Discovery Dossier Export (JSON / CSV / PNG)  │
                 └─────────────────────────────────────────────────┘
```

---

## 3. The "Instant-On + On-Demand" UX Strategy

Hackathon judges spend **2 to 3 minutes** reviewing projects. To ensure an immediate, polished experience without loading delays:

### Tier 1: Instant-On Presets (0 ms wait time)
* On application mount, the app automatically pre-loads the **5 official NASA benchmark targets** (WISE 0855-0714, Barnard's Star, $\varepsilon$ Indi B, RW Aurigae, R Draconis) from bundled local JSON assets.
* Judges can immediately click through benchmarks, trigger blinking, inspect dipoles, and explore 102-band spectra without downloading anything.

### Tier 2: On-Demand Sky Patch Downloader
* When a user inputs custom coordinates (RA/Dec):
  1. The app checks local `IndexedDB`.
  2. If missing, it displays a non-blocking toast:  
     `"Downloading observation patch for RA 133.79°, Dec -7.24° (840 KB)... [Complete]"`
  3. The patch is stored in `IndexedDB` so repeated visits to that coordinate load instantly.

### Tier 3: Custom File Drop (Citizen Scientist Mode)
* An optional drag-and-drop zone allows users or researchers to drop their own `.fits` or `.json` observation cubes directly from their desktop for instant client-side inspection.

---

## 4. Observation Patch Data Schema

Each downloaded sky patch is stored locally as a lightweight JSON/binary structure:

```json
{
  "patch_id": "spx_133.7951_-7.2452",
  "coordinates": {
    "ra": 133.79513,
    "dec": -7.24515,
    "fov_arcmin": 5.0
  },
  "wcs": {
    "crval": [133.79513, -7.24515],
    "crpix": [128.5, 128.5],
    "cdelt": [-0.000325, 0.000325],
    "ctype": ["RA---TAN", "DEC--TAN"]
  },
  "epochs": {
    "epoch1": {
      "timestamp": "2025-06-15T00:00:00Z",
      "data": [/* 65,536 normalized float values (256x256) */]
    },
    "epoch2": {
      "timestamp": "2025-12-15T00:00:00Z",
      "data": [/* 65,536 normalized float values (256x256) */]
    }
  },
  "spectrum": {
    "wavelengths": [/* 102 wavelength values in microns: 0.75 to 5.00 */],
    "flux_epoch1": [/* 102 flux values in MJy/sr */],
    "flux_epoch2": [/* 102 flux values in MJy/sr */],
    "flux_error": [/* 102 1-sigma uncertainty values */],
    "flags": [/* 102 bitmask strings: CLEAN, SOURCE_CONFUSION, etc. */]
  }
}
```

---

## 5. Client-Side Computational Engine (Implementation Blueprint)

All algorithms currently in `backend/spherex_engine.py` can be translated into clean, high-performance JavaScript:

### 5.1 Real-Time Frame Subtraction & Difference Imaging
```javascript
// Pure JS array difference: runs in ~0.5ms on a 256x256 Float32Array
export function computeDifference(epoch1Array, epoch2Array) {
  const len = epoch1Array.length;
  const diff = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    diff[i] = epoch2Array[i] - epoch1Array[i];
  }
  return diff;
}
```

### 5.2 Astronomical Asinh Contrast Stretch
```javascript
export function applyAsinhStretch(array, beta = 2.0) {
  const len = array.length;
  const stretched = new Float32Array(len);
  let max = -Infinity, min = Infinity;
  
  for (let i = 0; i < len; i++) {
    const val = Math.asinh(array[i] / beta);
    stretched[i] = val;
    if (val > max) max = val;
    if (val < min) min = val;
  }
  
  // Normalize to [0, 1]
  const range = max - min || 1;
  for (let i = 0; i < len; i++) {
    stretched[i] = (stretched[i] - min) / range;
  }
  return stretched;
}
```

### 5.3 Diverging Colormap Rendering (Cyan for E1, Magenta for E2)
```javascript
export function renderDivergingToCanvas(diffArray, canvas, size = 256) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  const pixels = imgData.data;

  for (let i = 0; i < diffArray.length; i++) {
    const val = diffArray[i]; // Negative = E1 excess, Positive = E2 excess
    const idx = i * 4;

    if (val >= 0) {
      // Magenta / Positive excess (E2)
      const intensity = Math.min(255, Math.floor(val * 255));
      pixels[idx] = intensity;     // R
      pixels[idx + 1] = 0;         // G
      pixels[idx + 2] = intensity; // B
    } else {
      // Cyan / Negative deficit (E1)
      const intensity = Math.min(255, Math.floor(Math.abs(val) * 255));
      pixels[idx] = 0;             // R
      pixels[idx + 1] = intensity; // G
      pixels[idx + 2] = intensity; // B
    }
    pixels[idx + 3] = 255; // Alpha
  }
  ctx.putImageData(imgData, 0, 0);
}
```

### 5.4 Client-Side Peak Finding & Dipole Pairing
```javascript
export function findAnomalies(diffArray, size = 256, thresholdSigma = 3.2) {
  // 1. Calculate mean and standard deviation
  let sum = 0, sqSum = 0;
  const n = diffArray.length;
  for (let i = 0; i < n; i++) {
    sum += diffArray[i];
    sqSum += diffArray[i] * diffArray[i];
  }
  const mean = sum / n;
  const std = Math.sqrt(sqSum / n - mean * mean) || 1e-6;

  // 2. Identify positive & negative peaks
  const anomalies = [];
  for (let y = 3; y < size - 3; y++) {
    for (let x = 3; x < size - 3; x++) {
      const idx = y * size + x;
      const zScore = (diffArray[idx] - mean) / std;

      if (Math.abs(zScore) >= thresholdSigma) {
        anomalies.push({
          x, y,
          significance: Math.round(Math.abs(zScore) * 10) / 10,
          polarity: zScore > 0 ? 'positive' : 'negative',
          type: 'candidate'
        });
      }
    }
  }

  // 3. Pair opposite polarities within proper motion distance as DIPOLE
  return pairDipoles(anomalies);
}
```

---

## 6. Migration Steps: Moving to Pure Serverless

To transition the current project to this architecture:

1. **Port `spherex_engine.py` to JavaScript:**  
   Create `frontend/src/utils/astroEngine.js` containing the Canvas rendering, difference calculation, and dipole peak finding.
2. **Move Benchmark Datasets to Static JSON:**  
   Store pre-generated 102-band spectra and multi-epoch cutouts for the 5 benchmark targets in `frontend/src/data/patches/`.
3. **Add `localforage` or Simple `IndexedDB` Wrapper:**  
   Cache fetched patches in the user's browser so custom coordinates remain saved across browser reloads.
4. **Update `App.jsx`:**  
   Remove calls to `http://localhost:8000/api/*`; call `astroEngine.js` directly.
5. **1-Click Deployment:**  
   Build with `npm run build` and deploy static output to GitHub Pages or Vercel.

---

## 7. Trade-off Summary

| Criterion | Python Backend (Current) | Serverless / Local-First (Proposed) |
|---|:---:|:---:|
| **Uptime for Judges** | ⚠️ At risk of server sleep / crash | 🟢 **100% Guaranteed Uptime** |
| **Hosting Cost** | $0–$7/mo on cloud container | 🟢 **$0 (GitHub Pages / Vercel)** |
| **Interactive Latency** | 150–500 ms per HTTP request | 🟢 **< 5 ms (60 FPS in memory)** |
| **Offline Capability** | ❌ None | 🟢 **Full offline support after load** |
| **Maintenance Burden** | High (Python + JS dependencies) | 🟢 **Low (Pure React / Vite SPA)** |
