# 🪐 SPHEREx Time-Domain Sky Explorer & Planet X Hunter

> **NASA Space Apps Challenge 2026** — *Planet X and SPHEREx*  
> **Architecture:** 100% Serverless, Client-Side Astronomical Single-Page Application (Zero Backend Required)

---

## 🌌 Overview

The **SPHEREx Time-Domain Sky Explorer** is a high-performance, citizen-science astrophysics workstation engineered to search for the hypothetical **Planet X / Planet Nine**, cold brown dwarfs, high-proper-motion stars, and transient variables across multi-epoch space telescope observations.

NASA's **SPHEREx** (*Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer*) surveys the entire celestial sky once every 6 months across **102 contiguous spectral bands** ($0.75\,\mu\text{m}\text{ to }5.00\,\mu\text{m}$) using **6 Linear Variable Filter (LVF) detector arrays**. By comparing observations taken 6 months apart (Month 0 baseline vs. Month 6 cadence), this tool reveals objects that move or change brightness over time.

---

## ⚡ Quick Start (Zero-Install, 1-Click Launch)

This application is **100% serverless** with zero backend, zero Node.js dependencies, and zero build steps:

1. **Clone or Download** the repository.
2. **Double-click `index.html`** to open it immediately in any modern web browser (Chrome, Edge, Firefox, Safari).
3. That's it! Everything—difference calculations, contrast stretches, band scrubbing, and 60 FPS blinking—runs directly in your browser's memory.

---

## 🚀 Key Features

### 1. Dominant Focus-First SPHEREx Viewport
* Over **80% of screen real estate** is dedicated directly to astronomical data.
* Fullscreen toggle: Hide the contextual split pane with one click to expand the SPHEREx viewport to **100% width**.
* Clean, unobstructed sky view with zero artificial center dots or distracting reticles.

### 2. Blind Mathematical Difference Imaging ($\Delta I = \text{Epoch 2} - \text{Epoch 1}$)
* Performs real-time pixel-by-pixel subtraction on 65,536-element float matrices in **$< 1\text{ ms}$**.
* Normal stationary background stars cancel out completely ($100 - 100 = 0$).
* Moving candidates generate an unmistakable **Dipole Anomaly**:
  * 🔵 **Cyan Dot (-):** Flux deficit showing where the object was 6 months ago (Epoch 1).
  * 🔴 **Magenta Dot (+):** Flux excess showing where the object moved to (Epoch 2).
* Automated Z-score peak finding pairs positive and negative anomalies and calculates trajectory vectors.

### 3. 60 FPS Auto-Blink Comparator
* Rapidly alternates between Epoch 1 (Month 0) and Epoch 2 (Month 6) with adjustable cadence ($0.5\text{ to }5.0\text{ Hz}$).
* Utilizes the human eye's natural motion detection to spot moving planets jumping across a frozen starfield.

### 4. 1:1 Synchronized Context Cross-Checking (CDS Aladin Lite)
* Direct side-by-side comparison with the **CDS Aladin** deep-sky atlas (AllWISE Mid-IR, 2MASS Near-IR, DSS2 Optical).
* **Exact Lockstep Navigation:** Dragging the main map 10px to the left moves the CDS map 10px to the left in real time.
* Synchronized mouse wheel zooming and double-click recentering on either map.
* Instant ESA Gaia DR3 optical check (if an object has no Gaia optical counterpart, it is a prime cold planet candidate).

### 5. Advanced Gesture Controls
* **Mouse Scroll:** Smooth Zoom In / Zoom Out (Field of View $1.0'\text{ to }30.0'$).
* **Left-Click + Hold & Drag:** Smooth celestial panning (slider thumbs are isolated and will never accidentally drag the sky).
* **⚡ Hold Right-Click + Scroll Wheel:** Rapidly scrubs through all 102 SPHEREx light bands in real time without reaching for a slider.

### 6. Tier 1 Smart Band Filters & Custom Group Creator
* **🔥 Thermal (B5-6 / 3.8–5.0 µm):** Stacks deep thermal heat—Planet X lights up brightly while normal stars fade away.
* **🔵 Near-IR (B1-3 / 0.75–2.4 µm):** Normal stars shine, while cold $38\text{ K}$ planets are pitch black.
* **🧪 CH₄ Methane (3.3 µm):** Isolates atmospheric methane absorption dips for brown dwarfs.
* **`+ Custom Group` Builder:** Allows users to define and save their own named band ranges into one-click macro buttons.

### 7. Compact, Drag-Resizable Sidebar
* Ultra-compact default width (270px) to maximize the canvas.
* Subtle vertical splitter handle: Click and drag left/right to resize the sidebar between 210px and 550px.
* Interactive 102-Band SED spectrum graph with live red needle tracking the active band.

### 8. One-Click Discovery Dossier Export
* Generates and downloads an official NASA Space Apps observation report in formatted **CSV** format directly from browser memory.

---

## 🎯 Benchmark Calibration Targets

| Target Preset | Nature | Distance | Temperature | Key Diagnostic Signature |
|---|---|---|---|---|
| **Planet X Candidate** | Outer Solar System Planet | $\sim 420\text{ AU}$ | $\sim 38\text{ K}$ | Slow 6-month dipole ($3.82''$), invisible in optical/Gaia, strong thermal emission at $4.2\,\mu\text{m}$. |
| **WISE 0855-0714** | Sub-Stellar Y-Dwarf | $7.27\text{ ly}$ | $\sim 250\text{ K}$ | Extreme proper motion ($8.13''/\text{yr}$), deep Methane ($\text{CH}_4$) absorption dips at $1.6\,\mu\text{m}$ and $3.3\,\mu\text{m}$. |
| **Barnard's Star** | Nearby M-Dwarf Star | $5.96\text{ ly}$ | $\sim 3,100\text{ K}$ | Fastest proper motion star known ($10.3''/\text{yr}$), matched in Gaia DR3 optical astrometry. |
| **Epsilon Indi B** | Binary Brown Dwarf (T1+T6) | $11.83\text{ ly}$ | $\sim 1,100\text{ K}$ | High proper motion dipole ($4.70''/\text{yr}$) orbiting Eps Ind A with prominent near-IR $\text{CH}_4$ absorption. |
| **R Draconis** | Mira Pulsating Red Giant | $2,100\text{ ly}$ | $\sim 2,800\text{ K}$ | **Monopole Anomaly:** Position stays fixed, but flux oscillates over 245-day cycle. |
| **RW Aurigae** | T Tauri Variable Binary | $530\text{ ly}$ | $\sim 4,800\text{ K}$ | **Monopole Anomaly:** Young stellar object exhibiting severe circumstellar dust dimming events and infrared variability. |

---

## 🔬 Scientific Foundations & APIs

* **NASA / IPAC Infrared Science Archive (IRSA):** SPHEREx Science Data System (SDS) specifications and multi-epoch survey cadences.
* **Centre de Données astronomiques de Strasbourg (CDS):** Aladin Lite v3 HiPS rendering and Sesame/SIMBAD target resolver.
* **ESA Gaia Mission:** Gaia DR3 astrometric catalogue for optical counter-matching.
* **Astrophysical Model:** Planck Blackbody Radiation Law ($T \sim 30\text{--}50\text{ K}$) and Wien's Displacement Law governing near-infrared thermal emission peaks.

---

## 📄 License

Open-source under the MIT License. Developed for the NASA Space Apps Challenge 2026.
