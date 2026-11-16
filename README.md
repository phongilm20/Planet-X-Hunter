# 🌌 SPHEREx Time-Domain Sky Explorer
### NASA Space Apps Challenge 2026: "Planet X and SPHEREx"
**Citizen Science Multi-Epoch Infrared Sky Viewer, Dipole Anomaly Hunter & 102-Band Spectrophotometric Analyzer**

[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Serverless-22c55e?style=for-the-badge&logo=github)](https://phongilm20.github.io/Planet-X-Hunter/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Aladin Lite](https://img.shields.io/badge/Aladin_Lite_v3-CDS_Strasbourg-blue?style=for-the-badge)](https://aladin.cds.unistra.fr/AladinLite/)

---

## 🔭 Executive Summary & Project Goal
NASA's **SPHEREx** (*Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer*) mission surveys the entire celestial sphere in **102 contiguous near-infrared bands** (0.75 µm to 5.0 µm) every six months, completing four all-sky surveys over its nominal 2-year lifespan.

The **SPHEREx Time-Domain Sky Explorer** is a high-performance web application designed for researchers and citizen scientists to:
1. **Identify Planet X & Sub-stellar Objects:** Leverage multi-epoch differential imaging to detect cold, faint planetary-mass objects, brown dwarfs, and high proper motion stars via their characteristic **positive-negative dipole residuals**.
2. **Differentiate Variables vs. Moving Targets:** Distinguish moving objects from pulsating variable stars (e.g. Mira giants, T Tauri stars) that generate **monopole residuals**.
3. **Analyze 102-Band Near-Infrared Spectra On-the-Fly:** Extract spectrophotometric curves with error bars and SPHEREx quality/contamination bitmask flags (e.g. diffraction spikes, cosmic rays, source confusion).
4. **Cross-Match with High-Precision Catalogs:** Synchronize in real time with **Aladin Lite v3** for deep visual context, overlaying **Gaia DR3** proper motion vectors and **AllWISE** infrared catalogs.

---

## 🌐 Live Web Demo (100% Serverless / 0-Install)
Experience the application live in your browser:
* **GitHub Pages Live Demo:** **[https://phongilm20.github.io/Planet-X-Hunter/](https://phongilm20.github.io/Planet-X-Hunter/)**
* **Instant Offline Launch:** Double-click [`index.html`](file:///./index.html) in the root directory to run locally in any browser with zero dependencies!

---

## 🚀 How to Run

### 1. Online (Zero Installation)
Simply visit the live GitHub Pages link:
👉 **[https://phongilm20.github.io/Planet-X-Hunter/](https://phongilm20.github.io/Planet-X-Hunter/)**

### 2. Offline / Local 1-Click Launch
Double-click [`index.html`](file:///./index.html) in the root directory. It runs locally in Chrome, Edge, or Firefox with zero dependencies or installation.

### 3. Developer Mode (React / Vite)
```bash
cd frontend
npm install
npm run dev
```
*Vite dev server will run at: `http://localhost:5173`*

---

## 🎯 NASA Challenge Test Suite: 5 Official Targets

The application features a 1-click test bar pre-configured with the 5 official targets from the challenge prompt:

| Target | RA / Dec (J2000) | Astrophysical Type | Expected SPHEREx Signature |
|---|---|---|---|
| **WISE 0855-0714** | `133.79513°`, `-7.24515°` (`08h55m10.83s`, `-07°14'42.5"`) | Y1 Sub-Brown Dwarf (~7.3 ly) | **Extreme Dipole**: Proper motion ~8.1″/yr; invisible in optical (Band 1-2); intense absorption at 3.3 µm (CH₄) & peaks at 4.6 µm |
| **Barnard's Star** | `269.45208°`, `+4.69339°` (`17h57m48.50s`, `+04°41'36.2"`) | M4Ve Red Dwarf (~5.96 ly) | **Northward Dipole**: Highest known proper motion (~10.3″/yr); dominant near-IR flux (1.0–1.4 µm) with TiO/VO absorption bands |
| **Epsilon Indi B** | `331.04375°`, `-56.78278°` (`22h04m10.50s`, `-56°46'58.0"`) | T1+T6 Binary Brown Dwarf (~12 ly) | **Moving Dipole**: Proper motion ~4.7″/yr; distinct T-dwarf peaks at 1.05, 1.25, 1.6, and 2.1 µm with methane troughs |
| **RW Aurigae** | `76.95625°`, `+30.40139°` (`05h07m49.50s`, `+30°24'05.0"`) | T Tauri Young Variable Star | **Monopole Residual**: Fixed spatial position; circumstellar dust occultation dims Epoch 2 flux by >65% |
| **R Draconis** | `248.17042°`, `+66.75639°` (`16h32m40.90s`, `+66°45'23.0"`) | Mira Pulsating Red Giant Variable | **Monopole Residual**: Strong infrared excess; 6-month cadence captures dramatic 3.2× amplitude swing |

---

## 🔬 Core Architectural Features

### 1. Multi-Epoch Comparator & Difference Imaging Engine
- **Epoch 1 (DR1 - Month 0):** Baseline observation frame.
- **Epoch 2 (QR3 - Month 6):** Second sky pass showing physical motion and temporal changes.
- **Auto-Blink Comparator:** Smoothly toggles between Epoch 1 and Epoch 2 at user-configurable frequencies (0.5 Hz to 5.0 Hz). Moving targets jump visually against static stars.
- **Difference Imaging (`Epoch 2 - Epoch 1`):** WCS-aligned array subtraction. Static background stars subtract to neutral dark space; moving objects appear as a **Positive-Negative Dipole Pair** (Cyan for Epoch 1, Magenta for Epoch 2); variable stars appear as bright/dark **Monopoles**.
- **Co-Add Stack (`Epoch 1 + Epoch 2`):** Exposure stacking yielding a $\sqrt{2}$ signal-to-noise ratio (SNR) boost for faint Solar System objects.
- **Automated Dipole / Anomaly Finder:** Statistical variance filter (`|E2 - E1| > 3.2σ`) with spatial pairing to automatically identify and classify dipoles vs monopoles.

### 2. On-the-Fly 102-Band SPHEREx Spectrograph
- Continuous near-infrared spectrophotometry from **0.75 µm to 5.00 µm** across the 6 SPHEREx Linear Variable Filter (LVF) detector segments:
  - **Band 1:** 0.75 – 1.11 µm (Channels 1–17)
  - **Band 2:** 1.11 – 1.64 µm (Channels 18–34)
  - **Band 3:** 1.64 – 2.42 µm (Channels 35–51)
  - **Band 4:** 2.42 – 3.82 µm (Channels 52–68)
  - **Band 5:** 3.82 – 4.42 µm (Channels 69–85)
  - **Band 6:** 4.42 – 5.00 µm (Channels 86–102)
- Epoch 1 vs Epoch 2 curve overlay with error bars.
- Contamination bitmask parser overlay: `CLEAN`, `SOURCE_CONFUSION`, `DIFFRACTION_SPIKE`, `COSMIC_RAY`, and `SATURATED`.

### 3. Aladin Lite v3 & Catalog Cross-Match
- Embedded Aladin Lite v3 interactive context viewport.
- Switchable survey tiles: **AllWISE Color**, **2MASS Color**, **DSS2 Color**.
- High-precision overlays: **Gaia DR3** astrometry + proper motion vectors, **AllWISE** infrared sources.

### 4. Deep URL Parameter Sync & Embeddability
- Real-time two-way synchronization with URL query parameters:
  `?ra=133.795130&dec=-7.245150&fov=5.0&target=WISE+0855-0714&mode=diff&band=50&stretch=linear`
- Instant state restoration for collaboration, scientific publication, or embedding in external web pages.

---

## 📡 REST API Specification

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/health` | Health & IRSA readiness check | None |
| `GET` | `/api/targets` | List 5 official NASA test targets | None |
| `GET` | `/api/cutout` | Multi-epoch image cutouts & matrices | `ra`, `dec`, `fov`, `epoch` (1, 2, diff, coadd), `band` (1-102), `stretch` (linear, log, asinh) |
| `GET` | `/api/spectrum` | 102-band spectrophotometric extraction | `ra`, `dec`, `epoch` (1, 2, both) |
| `GET` | `/api/irsa_query` | Live NASA/IPAC IRSA catalog proxy | `ra`, `dec`, `radius`, `catalog` |

---

## 💡 Citizen Science: How to Hunt for Planet X
1. **Look for a Dipole:** In Difference Mode, true moving objects (planets, brown dwarfs) display a distinctive adjacent pair of cyan and magenta circles.
2. **Rule Out Variable Stars:** A variable star does not move; it leaves only a single spot (monopole).
3. **Inspect the Spectrum:** Check the 102-channel curve. A cold Planet X candidate will be faint below 2 µm and peak in thermal infrared (Band 5 & 6, 4–5 µm).
4. **Cross-Match in Aladin:** If the dipole object is NOT in Gaia DR3 or AllWISE, you may have found an uncatalogued outer Solar System object!

---

## 📜 License
MIT License - Built for the **NASA Space Apps Challenge 2026**.
Developed with pride by computational astrophysicists and software engineers.
