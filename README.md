# SPHEREx Sky Tracker

**NASA Space Apps Challenge 2026 · Planet X and SPHEREx (Advanced)**

A lightweight, static, public-facing web tool that lets anyone type a celestial object name or sky coordinates to instantly see on a clean sky chart **where and when NASA's SPHEREx has observed it**, and where that moving object was across those observation epochs.

All data is fetched live from NASA/IPAC IRSA, CDS Sesame/SIMBAD, ESA Gaia DR3, and JPL Horizons directly in the user's browser. **No backend, no database, no accounts, and zero simulated/faked observations.**

---

## 150-Word Submission Description (NASA Space Apps Challenge)

> NASA's SPHEREx mission surveys the entire sky every ~6 months across 102 near-infrared bands (0.75–5.0 µm), imaging over a billion sources. While professional platforms like IRSA provide raw multi-extension FITS data, everyday citizen scientists lack a simple way to answer: *"Has SPHEREx observed this spot, when, and how far did candidate objects move between those looks?"* The **SPHEREx Sky Tracker** solves this with an honest, single-page, browser-native tool. By querying live astronomical services (IRSA SIA2, CDS Sesame, ESA Gaia DR3, and JPL Horizons), it plots an interactive tangent-plane sky chart displaying telescope pointings, dated target tracks, background reference stars, and a 6.15″ detector pixel scale. Accompanied by a temporal timeline scrubber, exportable observation table, and transparent instrument disclosures, this lightweight static web app empowers the public to track fast brown dwarfs, outer-solar-system comets, and evaluate the feasibility of hunting Planet X.

---

## Why This Tool? (Our Angle)

Finding moving bodies—such as asteroids, comets, cold brown dwarfs, or a hypothetical Planet X—hinges on noticing positional change between observational epochs. 

Existing tools leave a critical gap:
1. **IRSA SPHEREx Data Explorer:** Extremely powerful, but designed for professional astronomers with complex query forms, 102-band cutouts, and multi-extension FITS downloads.
2. **Backyard Worlds: Planet 9:** Proven that citizen scientists can discover cold brown dwarfs, but operates as a classification pipeline on pre-rendered WISE flipbooks rather than an open, free-exploration tool.
3. **The Linear Variable Filter (LVF) Trap:** SPHEREx raw frames vary continuously in wavelength across the detector. Naively blinking two raw frames at different detector positions produces false color residuals.

**Our wedge:** Provide the missing first step. Answer instantly and visually: *"When did SPHEREx look here, and where was the target at each of those times?"* Simple, sober, live, and scientifically honest. We deliberately make no autonomous detection claims.

---

## Core Capabilities

- **Clean 2D Sky Chart:** Local tangent-plane projection (North up, East left) centered on the target, with adjustable field ($30^{\prime\prime}$ to $30^\prime$).
- **Multi-Epoch Pointings Layer:** Real SPHEREx observation centers colored along a single-hue chronological gradient with date legend.
- **Dynamic Target Trajectory:** Target positions propagated forward/backward using rigorous $\cos(\delta)$ proper motion math or Horizons orbital ephemerides, connected by vector lines with dated dots.
- **Scale Comparison:** $30^{\prime\prime}$ arcsecond scale bar alongside a $6.15^{\prime\prime}$ SPHEREx detector pixel reference circle.
- **Interactive Timeline & Scrubber:** Playable animation ($1\times$, $2\times$, $5\times$) tracking object displacement over time with live readouts: `Elapsed: X.XX yr · Target shifted Y.Y″ (≈ Z.Z SPHEREx pixels)`.
- **Observation Table:** Chronological table listing observation date, infrared band ($\mu\text{m}$), and direct "Open in IRSA" links.
- **5 Curated NASA Presets:**
  - `WISE 0855−0714`: Fast-moving sub-brown dwarf ~7.3 ly away ($\approx 8.13^{\prime\prime}/\text{yr}$).
  - `Barnard's Star`: Highest known stellar proper motion ($\approx 10.33^{\prime\prime}/\text{yr}$).
  - `Comet 3I/ATLAS`: Active comet observed by SPHEREx in Aug & Dec 2025 sweeps.
  - `Makemake`: Distant TNO demonstrating Planet-X-like slow orbital motion ($\approx 3^{\prime\prime}/\text{yr}$).
  - `Random Sky Patch`: Sample high-galactic-latitude pointing ($|b| > 30^\circ$).
- **Direct Export:** Single-click "Export PNG" (burning scale, legend, and coordinates into the image) and "Export CSV" for tabular observation data.

---

## Data Sources & CORS Architecture

The application is completely static (no custom server):
| Need | Live Service | Status & Fallback Policy |
| :--- | :--- | :--- |
| **SPHEREx Observations** | NASA/IPAC IRSA SIA2 (`COLLECTION=spherex_qr2`) | Queries live IRSA SIA2. If blocked by browser origin restrictions, routes via transparent CORS pass-through. If unobserved, honestly reports zero released data. |
| **Name Resolution & PM** | CDS Sesame Name Resolver & SIMBAD | Native CORS enabled (`access-control-allow-origin: *`). Returns live coordinates, proper motions ($\mu_\alpha \cos\delta, \mu_\delta$), and parallax. |
| **Reference Stars** | ESA Gaia DR3 via VizieR | Fetches nearby stationary stars to contrast against moving targets. |
| **Solar System Movers** | JPL Horizons API | Horizons API does not send CORS headers to browsers. Pre-fetched snapshot included for featured solar system bodies (3I/ATLAS, Makemake) labeled `ephemeris snapshot, generated 2026-11-15`. |

---

## Why Planet X is Hard to Spot (Feasibility Disclosure)

A hypothetical 5–10 $M_\oplus$ Planet X orbiting at 400–800 AU moves extremely slowly ($\approx 0.04\text{–}0.16^{\prime\prime}/\text{year}$) and is exceedingly faint (reflected sunlight scales as $1/r^4$). 

Because SPHEREx pixels are $6.15^{\prime\prime}$ across, a distant planet's annual shift is $<0.05$ pixels. Spotting such motion requires co-adding observations across multiple 6-month survey passes or cross-matching against baseline optical surveys (e.g. Rubin/LSST). This tool displays observation times and positions; it makes no detection claims.

---

## Quick Start (Run Locally)

### Prerequisites
- Node.js 18+

### Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser.

To produce a production static bundle for GitHub Pages, Netlify, or Cloudflare Pages:
```bash
npm run build
```
Output will be generated in `frontend/dist/`.

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `/` | Focus search bar |
| `Space` | Toggle track animation playback |
| `←` / `→` | Step backward / forward along observation timeline |
| `+` / `-` | Zoom in / Zoom out on sky chart |
| `0` or `R` | Reset pan & zoom to center |

---

## Attribution & Credits

- **SPHEREx:** NASA / JPL-Caltech.
- **IRSA:** NASA/IPAC Infrared Science Archive.
- **Gaia:** European Space Agency (ESA) Gaia Data Release 3.
- **CDS Strasbourg:** Sesame Name Resolver & SIMBAD astronomical database.
- **JPL:** NASA Jet Propulsion Laboratory Solar System Dynamics (SSD) Horizons.
- Built for **NASA Space Apps Challenge 2026**. Not an official NASA product.
