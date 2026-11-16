# 🌌 Project Requirements: SPHEREx Time-Domain Sky Explorer & Planet X Hunter

**NASA Space Apps Challenge: "Planet X and SPHEREx"**  
**Challenge Category:** Advanced Astrophysics, Time-Domain Astronomy & Citizen Science  
**Reference Portal:** [NASA Space Apps Challenge — Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources)

---

## 1. Executive Summary & Challenge Mission

### 1.1 Mission Background
NASA's **SPHEREx** (*Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer*) is an all-sky near-infrared space observatory designed to survey the entire celestial sphere once every six months over its nominal 2-year primary mission (generating at least 4 independent all-sky surveys / epochs). 

SPHEREx captures data across **102 contiguous spectral bands** in the near-infrared regime (**0.75 µm to 5.00 µm**) utilizing six distinct Linear Variable Filter (LVF) detector focal plane arrays. With over a billion cosmic targets observed, SPHEREx creates a multi-epoch, hyperspectral 3D data cube of the sky.

### 1.2 The Scientific Problem: Hunting for "Planet X" & Transients
While SPHEREx's primary cosmological science pillars focus on cosmic inflation, galaxy formation, and interstellar water/biogenic ices, its cadence and wavelength coverage make it a powerhouse for **time-domain astrophysics**.

Specifically:
- **Hypothetical Planet X / Planet Nine:** A predicted distant gas or ice giant ($5 \text{ to } 10 \, M_\oplus$) in the outer solar system ($a \sim 300\text{--}800\text{ AU}$) would be virtually undetectable in optical wavelengths due to extreme distance and cold temperatures ($\sim 30\text{--}50\text{ K}$). However, its internal heat releases thermal blackbody radiation that peaks strongly in the thermal infrared ($3.0\text{--}5.0\text{ µm}$), right within SPHEREx Bands 4, 5, and 6. Furthermore, its orbital motion produces discernible annual parallax and proper motion between successive 6-month survey passes.
- **Sub-stellar Objects & Brown Dwarfs:** Cold Y- and T-dwarfs (e.g., WISE 0855-0714, $\varepsilon$ Indi B) move rapidly across the sky (high proper motion) and feature strong molecular absorption bands (methane $\text{CH}_4$, water $\text{H}_2\text{O}$, ammonia $\text{NH}_3$).
- **High Proper Motion Stars:** Nearby M-dwarf systems (e.g., Barnard's Star) exhibit substantial spatial displacement ($\sim 10.3''/\text{yr}$) across epochs.
- **Variable Stars & Occultation Events:** Mira pulsating giants (e.g., R Draconis) and young stellar objects with protoplanetary dust disks (e.g., RW Aurigae) display stationary positions but dramatic photometric flux swings over 6-month intervals.

### 1.3 Challenge Objective
Build an open, accessible, public-facing web application that democratizes access to SPHEREx data. The tool must enable anyone—from middle school students and citizen science volunteers to professional astrophysicists—to input celestial coordinates, visualize multi-epoch near-infrared observations, perform difference imaging to spot dipole and monopole anomalies, inspect 102-band spectra, and cross-match candidates against established astronomical archives (Gaia DR3, AllWISE, 2MASS).

---

## 2. Key Functional Requirements

### 2.1 Coordinate Navigation & Field-of-View (FOV) Control
- **FR-1.1: Multi-Format Coordinate Parser:**
  - Support Right Ascension (RA) and Declination (Dec) inputs in decimal degrees (e.g., `133.795130`, `-7.245150`).
  - Support sexagesimal format:
    - RA in Hours, Minutes, Seconds: `HH:MM:SS.ss` or `HHhMMmSSs` (e.g., `08:55:10.83`).
    - Dec in Degrees, Arcminutes, Arcseconds: `±DD:MM:SS.s` or `±DDdMMmSSs` (e.g., `-07:14:42.5`).
  - Support target name resolution via SIMBAD / Sesame resolver (e.g., typing "WISE 0855" or "Barnard's Star" automatically resolves coordinates).
- **FR-1.2: Dynamic Field of View Scaling:**
  - Allow user-configurable FOV ranging from **1.0 arcminute** (detailed stellar PSF inspection) to **30.0 arcminutes** (wide-field contextual scanning).
  - Default FOV set to **5.0 arcminutes** to match typical SPHEREx cutout standards.
- **FR-1.3: Interactive Celestial Reticle & Click-to-Recenter:**
  - Clicking any pixel within the image viewport must calculate the corresponding world coordinates $(\alpha, \delta)$ via astronomical World Coordinate System (WCS) transformation and recenter or re-sample the field.

### 2.2 Multi-Epoch Time-Domain Image Viewer
- **FR-2.1: Multi-Epoch Visualization Modes:**
  - **Epoch 1 (Baseline / DR1):** Primary sky survey pass at Month 0.
  - **Epoch 2 (Cadence / QR3):** Secondary sky survey pass at Month 6 (or subsequent 12/18 month epochs).
  - **Auto-Blink Comparator:** An automated toggle between Epoch 1 and Epoch 2 with user-adjustable frequency (**0.2 Hz to 5.0 Hz** / 200 ms to 5000 ms). Stationary background stars remain stationary, while moving targets visibly oscillate or jump.
  - **Difference Imaging ($\Delta I = \text{Epoch 2} - \text{Epoch 1}$):** Pixel-by-pixel mathematical subtraction of aligned frames:
    $$\Delta I(x, y) = I_2(x, y) - I_1(x, y)$$
    - Static background stars subtract to neutral zero.
    - Moving objects generate a **dipole anomaly** (a negative deficit at the Epoch 1 position and a positive excess at the Epoch 2 position).
    - Variable stars generate a **monopole anomaly** (a single localized excess or deficit at a fixed spatial coordinate).
  - **Co-Addition / Exposure Stacking ($I_{\text{coadd}} = \frac{I_1 + I_2}{2}$):** Summed multi-epoch stack providing a $\sqrt{N}$ signal-to-noise ratio (SNR) boost ($\sim \sqrt{2} \approx 1.414\times$) to reveal faint, slow-moving outer Solar System objects buried in single-frame noise.
- **FR-2.2: Astronomical Contrast & Image Stretch:**
  - Real-time client or server-side non-linear transfer functions:
    - **Linear:** $f(x) = \frac{x - x_{\min}}{x_{\max} - x_{\min}}$
    - **Logarithmic:** $f(x) = \frac{\ln(1 + a \cdot x)}{\ln(1 + a)}$
    - **Hyperbolic Sine ($\text{asinh}$):** Astronomical standard preserving faint structure while preventing core saturation:
      $$f(x) = \frac{\text{asinh}(x / \beta)}{\text{asinh}(x_{\max} / \beta)}$$
- **FR-2.3: Visual Palette & Diverging Colormaps:**
  - Single-epoch frames displayed with standard near-infrared colormaps (e.g., Inferno, Magma, or custom False-Color IR).
  - Difference images rendered with a **diverging colormap**:
    - **Cyan / Deep Blue:** Negative flux (Epoch 1 target position).
    - **Dark Space Slate / Neutral Black:** Zero residual background.
    - **Magenta / Hot Pink / Red:** Positive flux (Epoch 2 target position).
- **FR-2.4: Dynamic Multi-Epoch Cadence Support (Frequently Updating Data):**
  - The observation viewer must dynamically ingest an arbitrary list of epochs ($E_1, E_2, E_3, \dots, E_N$) provided by the data manifest rather than hardcoding only two passes.
  - As SPHEREx downlinks new 6-month sky surveys (DR1, DR2, DR3, Quick Releases), the UI timeline slider automatically adapts to step through, co-add, or subtract any chosen pair of epochs with zero code changes.

### 2.3 Automated Anomaly & Dipole Detection Engine
- **FR-3.1: Statistical Significance Filter:**
  - Compute background mean $\mu$ and standard deviation $\sigma$ across the difference frame $\Delta I$.
  - Flag pixels where the absolute Z-score exceeds user-definable threshold (default $\ge 3.2\sigma$):
    $$|Z(x, y)| = \frac{|\Delta I(x, y) - \mu|}{\sigma} > 3.2$$
- **FR-3.2: Spatial Pairing & Classification (Dipole vs Monopole):**
  - Extract local extreme peaks via morphological filtering.
  - Group paired positive and negative peaks separated by $\le 25\text{ pixels}$ ($\le \text{maximum expected proper motion}$):
    - **Classify as Dipole:** Moving object candidate (Planet X, brown dwarf, high proper motion star). Compute estimated proper motion vector $(\mu_\alpha \cos \delta, \mu_\delta)$ and position angle $\theta$.
    - **Classify as Monopole:** Pulsating variable, eruptive star, or transient supernova/flare.
- **FR-3.3: Interactive Anomaly Overlays:**
  - Visual bounding boxes, reticle indicators, and vector arrows rendered directly on the viewer with clickable tooltips showing SNR, flux delta, and candidate classification.

### 2.4 Hyperspectral 102-Band Spectrophotometric Analyzer
- **FR-4.1: Continuous 102-Band Near-Infrared Spectrum:**
  - Display extracted spectral energy distribution (SED) spanning $0.75\text{ µm}$ to $5.00\text{ µm}$ in physical flux units ($\text{MJy/sr}$ or $\mu\text{Jy}$).
  - Segment spectrum into the 6 physical SPHEREx Linear Variable Filter (LVF) detector arrays:
    - **Band 1 (LVF 1):** $0.75\text{--}1.11\text{ µm}$ (Channels 1–17) — Optical/NIR transition, Paschen lines, TiO/VO bands.
    - **Band 2 (LVF 2):** $1.11\text{--}1.64\text{ µm}$ (Channels 18–34) — $J$-band window, $1.4\text{ µm } \text{H}_2\text{O}$ absorption.
    - **Band 3 (LVF 3):** $1.64\text{--}2.42\text{ µm}$ (Channels 35–51) — $H$ and $K$ bands, $1.9\text{ µm } \text{H}_2\text{O}$ absorption, CO bandheads.
    - **Band 4 (LVF 4):** $2.42\text{--}3.82\text{ µm}$ (Channels 52–68) — Deep $3.3\text{ µm } \text{CH}_4$ (methane) absorption, $3.05\text{ µm } \text{H}_2\text{O}$ ice.
    - **Band 5 (LVF 5):** $3.82\text{--}4.42\text{ µm}$ (Channels 69–85) — $4.26\text{ µm } \text{CO}_2$ ice band, cold thermal continuum.
    - **Band 6 (LVF 6):** $4.42\text{--}5.00\text{ µm}$ (Channels 86–102) — $4.65\text{ µm } \text{CO}$ ice / thermal peak of $<300\text{ K}$ planetary bodies.
- **FR-4.2: Dual-Epoch Spectral Comparison & Error Bars:**
  - Plot Epoch 1 vs Epoch 2 spectra simultaneously with photometric $1\sigma$ uncertainty bars to reveal spectral variability or chromatic variations.
- **FR-4.3: Interactive Band Sync:**
  - Clicking any band or wavelength on the spectral chart instantly updates the 2D spatial cutout image to display that specific channel.
- **FR-4.4: Contamination & Quality Flag Bitmask Engine:**
  - Parse and overlay SPHEREx pixel quality bitmasks:
    - `CLEAN` (Nominal data)
    - `SOURCE_CONFUSION` (Overlapping stellar PSFs in crowded fields)
    - `DIFFRACTION_SPIKE` (Contamination from nearby bright optical star)
    - `COSMIC_RAY` (Energetic particle hit)
    - `SATURATED` (Detector well full / non-linear regime)

### 2.5 Multi-Wavelength Context & Archival Cross-Matching
- **FR-5.1: Embedded Aladin Lite v3 Sky Atlas:**
  - Provide an interactive, synchronized wide-field viewport powered by Aladin Lite v3 (CDS Strasbourg).
  - Synchronize field of view and celestial center with the SPHEREx cutout viewer.
- **FR-5.2: Multi-Survey HiPS Overlays:**
  - **AllWISE Color:** Mid-infrared reference ($3.4, 4.6, 12, 22\text{ µm}$) for verifying thermal emission.
  - **2MASS Color:** Near-infrared reference ($J, H, K_s$) for checking stellar counterparts.
  - **DSS2 Color:** Optical baseline to confirm that Planet X candidates are completely absent in optical light.
- **FR-5.3: Astrometric Catalog Overlays:**
  - **Gaia DR3 Catalog:** Real-time query showing high-precision stellar positions and proper motion vectors $(\mu_\alpha^*, \mu_\delta)$. If an identified dipole has no Gaia match, it is an ultra-cold object, brown dwarf, or Solar System body!
  - **AllWISE Source Catalog:** Overlay photometric coordinates and magnitude data ($W1, W2, W3, W4$).
- **FR-5.4: Live NASA/IPAC IRSA Catalog Query Proxy:**
  - Backend integration with IPAC IRSA Table Access Protocol (TAP) or Cone Search APIs.

### 2.6 Official NASA Challenge Target Benchmarks
- **FR-6.1: One-Click NASA Benchmark Suite:**
  - Pre-configure the 5 official targets highlighted in the challenge:
    1. **WISE 0855-0714:** Extreme high proper motion sub-brown dwarf ($\sim 8.1''/\text{yr}$), cold ($250\text{ K}$), strong methane absorption, faint in optical.
    2. **Barnard's Star:** Highest known proper motion star ($\sim 10.3''/\text{yr}$), M4Ve dwarf, distinct northward dipole.
    3. **Epsilon Indi B:** Binary brown dwarf system ($\sim 4.7''/\text{yr}$), T-dwarf methane spectral fingers.
    4. **RW Aurigae:** T Tauri young stellar object with circumstellar disk occultation (stationary monopole, $>65\%$ flux drop in Epoch 2).
    5. **R Draconis:** Mira pulsating red giant variable ($>3.2\times$ amplitude swing in infrared flux over 6 months).

### 2.7 URL State Synchronization & Discovery Dossier Export
- **FR-7.1: URL Two-Way State Binding:**
  - Reflect active parameters in URL query string: `?ra=...&dec=...&fov=...&mode=...&band=...&stretch=...`
  - Ensure deep-linking allows instant replication of candidate findings across researchers.
- **FR-7.2: Discovery Dossier & Data Export:**
  - Export candidate report as JSON / CSV including calculated coordinates, epoch flux deltas, proper motion estimate, and spectral indices.
  - Export cutout as high-resolution PNG and astronomical FITS file.

---

## 3. Technical & Architectural Requirements

### 3.1 Architecture Overview
The system follows a modern **Serverless / Client-Side Single Page Application (SPA)** architecture with in-memory caching to guarantee 100% uptime for hackathon judges:
```
┌─────────────────────────────────────────────────────────────┐
│                 Client-Side Application Tier                │
│   React 18 + Vite SPA, Tailwind CSS, Lucide Icons           │
│   Plotly.js (102-Band Spectrogram), Aladin Lite v3 (HiPS)   │
│   HTML5 Canvas Engine (< 5 ms array math & difference)      │
│   In-Memory Patch Cache (Instant 0 ms retrieval)            │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTPS / JSON & HiPS Tiles
┌──────────────────────────────▼──────────────────────────────┐
│                 Remote Data Services Tier                   │
│   Pre-bundled NASA Benchmarks (Static 50 KB JSON cutouts)   │
│   CDS Strasbourg (Aladin Lite HiPS survey tiles)            │
│   ESA Gaia DR3 & NASA AllWISE (CORS-enabled catalog query)  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Client-Side Computational Engine Specifications
- **TR-1.1: Runtime & Framework:** React 18 running on Vite with ES Modules; zero server hosting dependencies (deployable directly to GitHub Pages or Vercel).
- **TR-1.2: Real-Time Performance & 60 FPS Viewport:**
  - Difference imaging ($\Delta I = E_2 - E_1$), asinh non-linear stretching, and array statistics run in pure JavaScript using typed `Float32Array` buffers in $< 5\text{ ms}$.
  - Auto-Blink comparator flips between epochs at up to 10 Hz without network roundtrips.
- **TR-1.3: In-Memory Caching:**
  - In-memory `Map` cache retains fetched observation patches to ensure 0 ms instantaneous re-rendering when switching between celestial coordinates.
- **TR-1.4: Resilient Data Ingestion:**
  - Bundles the 5 official NASA challenge targets as lightweight static JSON patches to guarantee instant-on functionality during judging evaluations even on offline or high-latency networks.

### 3.3 Frontend Technical Specifications
- **TR-2.1: Modern UI Framework:** React 18, Vite build tool, modular ES Modules.
- **TR-2.2: Styling & Design System:** Tailwind CSS with custom deep-space theme (slate/space-blue backgrounds, high-contrast cyan, magenta, and amber indicators).
- **TR-2.3: Charting & Data Visualization:** Plotly.js for interactive hover, zoom, pan, and dynamic band markers.
- **TR-2.4: Sky Atlas Integration:** Aladin Lite v3 initialized via asynchronous script injection with connection retry and offline fallback.
- **TR-2.5: Zero-Overhead State Architecture:** React hooks (`useCallback`, `useMemo`, `useRef`) with request cancellation (`AbortController`) to eliminate race conditions when scrubbing coordinate or band sliders.

---

## 4. Verification & Validation Metrics

| Requirement Area | Metric / Acceptance Criteria | Validation Method |
|---|---|---|
| **Coordinate Accuracy** | WCS pixel-to-sky mapping accurate to within $< 0.1\text{ arcsec}$ | Cross-check against Astropy `all_pix2world` calculations |
| **Dipole Detection** | Successfully detect and pair $>95\%$ of synthetic and real targets with proper motion $> 2.0''/\text{yr}$ | Automated unit test suite against 5 NASA benchmark targets |
| **Monopole Discrimination** | Differentiate stationary variable stars with $>99\%$ accuracy from moving objects | Test with RW Aurigae and R Draconis test vectors |
| **102-Band Coverage** | Exact 102 channels spanning $0.75\text{ µm}$ to $5.00\text{ µm}$ matching SPHEREx filter definitions | Wavelength mapping verification test |
| **API Latency** | Full cutout generation and anomaly response $< 500\text{ ms}$ under local execution | Benchmark curl / Locust load tests |
| **Browser Compatibility** | Chrome, Firefox, Edge, Safari; responsive down to $1280\times720$ resolution | Multi-browser visual regression testing |
