# ⚖️ Architectural Trade-off Analysis: Dropping the Backend vs. Keeping It

**Project:** SPHEREx Time-Domain Sky Explorer & Planet X Hunter  
**Context:** NASA Space Apps Challenge 2026 — "Planet X and SPHEREx"  
**Topic:** Feasibility, performance, and risk analysis of eliminating the Python FastAPI backend in favor of a 100% client-side SPA.

---

## 1. Computation & Performance Reality Check

### Does the Math Require a Backend?
**No.** The current mathematical pipeline in `backend/spherex_engine.py` operates on $256 \times 256$ arrays (65,536 float elements):
- **Image Subtraction ($\Delta I = E_2 - E_1$):** 65,536 element-wise operations $\approx 0.5\text{ ms}$ in JavaScript (`Float32Array`).
- **Z-Score Normalization:** Background mean, standard deviation, and array division $\approx 1.2\text{ ms}$.
- **Morphological Peak Finding:** $7 \times 7$ local extremum filtering $\approx 2.5\text{ ms}$.
- **102-Band Spectrum:** Slicing an array of 102 floats $\approx 0.01\text{ ms}$.

**Total browser execution time:** $< 5\text{ ms}$ per frame. Modern JavaScript V8 engines and WebGL canvas shaders can execute this at 60 FPS without frame drops.

---

## 2. Potential Drawbacks of Dropping the Backend

While computational throughput is not an issue in the browser, eliminating the backend introduces the following structural and scientific drawbacks:

| # | Drawback | Severity | Detailed Description | Potential Mitigation |
|---|---|:---:|---|---|
| **1** | **CORS (Cross-Origin Resource Sharing) Blocking** | 🔴 High | Many NASA/IPAC IRSA endpoints and JPL Horizons APIs do not send `Access-Control-Allow-Origin: *` headers. Direct browser `fetch()` requests will be blocked by the browser's security sandbox. CDS Strasbourg (Aladin HiPS / SIMBAD) supports CORS, but raw NASA servers often do not. | Use a lightweight, serverless edge proxy (e.g., Next.js / Vercel API rewrite, Cloudflare Worker), or stick to CORS-enabled mirrors (CDS VizieR, ESA Gaia TAP). |
| **2** | **Heavy Bandwidth on Raw 3D FITS Cubes** | 🟡 Medium | Authentic SPHEREx data releases contain 3D hyperspectral data cubes (102 bands $\times$ spatial dimensions). A full FITS cube can range from **50 MB to 500 MB+**. Downloading raw uncompressed cubes directly onto client devices (especially mobile or slow connections) creates massive latency. A backend can download the cube on the server, extract the requested 2D slice or 102-point spectrum, and transmit a lightweight 20 KB JSON payload. | Pre-process data into static multi-epoch JSON/PNG cutouts for key benchmark targets, or rely on remote Cutout APIs (SIA) that crop on NASA's servers before delivery. |
| **3** | **Scientific Credibility & Academic Perception** | 🟡 Medium | In NASA hackathons, judges often include astrophysicists and research software engineers. Python + `astropy` (`astropy.wcs`, `astropy.io.fits`, `astroquery`) is the undisputed standard lingua franca of NASA astrophysics. A repository containing standard `astropy` pipelines carries inherent scientific authority over a pure web-app simulation. | If going pure frontend, clearly document the mathematical formulas (WCS TAN projection, asinh stretch, Z-score dipole pairing) in the UI and README to demonstrate astrophysics rigor. |
| **4** | **FITS Parsing Overhead in JavaScript** | 🟢 Low | Native FITS parsing in JS requires third-party libraries (e.g., `fitsjs`, `astronomy-engine`). While functional, JavaScript FITS parsers have fewer features, slower WCS coordinate transformations, and less active maintenance compared to Python's gold-standard `astropy.wcs` / `wcslib`. | Use Aladin Lite v3's built-in FITS loader or serve pre-extracted FITS headers and pixel matrices as JSON/PNG. |
| **5** | **Loss of API Key & Token Encapsulation** | 🟢 Low | If querying astronomical services that require API keys or credentials in the future, client-side requests expose keys in browser network traffic. | Most NASA/IRSA/CDS public archives do not require authentication for public science tiers. |

---

## 3. Advantages of Dropping the Backend

For comparison, here are the operational advantages of moving to a 100% client-side architecture:

1. **Guaranteed Uptime & Zero Server Crashes:** Free hosting tiers (Render, Railway, Fly.io) put servers to sleep after inactivity. When a hackathon judge opens the app, a sleeping backend causes 30–60 second cold starts or failed connection errors. A static SPA on GitHub Pages or Vercel loads instantly 100% of the time.
2. **Instant Response Latency:** Subtracting frames and scrubbing through the 102-band slider happens at 60 FPS in memory without waiting for HTTP round-trips to an API server.
3. **Zero Maintenance & Infrastructure Cost:** No Python environments to configure, no Docker containers, and no server bills.

---

## 4. Decision Matrix

* **Choose 100% Client-Side SPA if:**
  - The primary goal is a smooth, crash-proof live demo for hackathon judges on GitHub Pages / Vercel.
  - The app displays curated benchmark targets + live Aladin Lite HiPS surveys.
  - You want the simplest, lowest-maintenance codebase.

* **Keep the Python Backend if:**
  - You plan to directly ingest raw local `.fits` cubes or perform server-side `astropy.wcs` astrometric plate solving.
  - You need a dedicated proxy to bypass CORS restrictions on specific NASA/IPAC endpoints.
  - You want to highlight `astropy` integration in your NASA hackathon submission repository.
