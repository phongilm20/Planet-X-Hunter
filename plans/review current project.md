# 🔍 Project Audit & Architecture Review: Planet-X-Hunter

**Target Project:** `Planet-X-Hunter` (SPHEREx Time-Domain Sky Explorer)  
**Evaluation Scope:** Codebase validation against the NASA Space Apps Challenge 2026 "Planet X and SPHEREx" requirements.  
**Auditor:** Senior Computational Astrophysicist & Software Systems Architect  
**Status:** Functional Prototype with Critical Architectural Discrepancies & Severe Runtime Bugs  

---

## 1. Executive Evaluation Scorecard

| Evaluation Dimension | Weight | Current Score | Status | Summary Assessment |
|---|:---:|:---:|:---:|---|
| **NASA Challenge Compliance** | 20% | **65 / 100** | ⚠️ Partial | Core concepts present (blink, diff, SED, 5 targets), but relies on synthetic shortcuts rather than authentic IRSA/FITS pipelines. |
| **Scientific & Astrophysical Rigor** | 20% | **58 / 100** | ❌ Deficient | Missing `astropy` / `astroquery` dependencies; hardcoded synthetic PSFs; dipole pairing fails at varying FOVs. |
| **Algorithm & Computational Logic** | 20% | **52 / 100** | 🚨 Critical Bugs | Fatal bug in Blink mode (returns Epoch 1 twice); band indexing mismatch between backend (5 bands) and frontend (6 bands). |
| **Frontend UI/UX & Citizen Science** | 20% | **78 / 100** | ⚠️ Good / Fragile | Polished Tailwind dark theme and interactive Plotly graph, but broken coordinate parsing (no sexagesimal) and viewport clipping on standard screens. |
| **Code Architecture & Maintainability** | 20% | **70 / 100** | ⚠️ Moderate | Clean component separation, but tightly coupled mock generators and lack of unit tests / error boundaries. |
| **OVERALL COMPOSITE SCORE** | **100%** | **64.6 / 100** | **GRADE: C (Needs Significant Remodeling)** |

---

## 2. In-Depth Gap Analysis: Requirements vs. Current Implementation

### 2.1 Critical Bug #1: Fatal Epoch Parameter Mismatch in Blink Mode (Breaking Core Feature)

#### The Requirement:
The challenge mandates an **Auto-Blink Comparator** to alternate between Epoch 1 (Month 0 baseline) and Epoch 2 (Month 6 cadence) so that users can visually observe physical motion across time.

#### What the Current Code Does:
In `frontend/src/App.jsx`:
- Line 128:
  ```javascript
  const epochParam = mode === 'blink' ? 'epoch1' : mode;
  ```
- Line 156:
  ```javascript
  epoch: 'epoch2',
  ```
The frontend sends HTTP GET requests with `?epoch=epoch1` and `?epoch=epoch2`.

Now look at `backend/main.py`:
- Lines 95–96:
  ```python
  epoch_int = int(epoch) if epoch in ("1", "2") else 1
  data = generate_star_field(ra, dec, fov, band, epoch=epoch_int, size=size, target=target)
  ```
Because `'epoch1'` and `'epoch2'` do **not** match `"1"` or `"2"`, the conditional evaluates to `False`, and `epoch_int` defaults to `1` in **both** requests!

#### The Consequence:
**The backend generates and serves Epoch 1 for both frames.** When the user engages Blink mode, the comparator crossfades between identical images of Epoch 1. The moving target never moves, completely sabotaging the primary scientific purpose of the application!

---

### 2.2 Critical Bug #2: Detector Band Definition & Metadata Schism

#### The Requirement:
SPHEREx features **six (6) focal plane detector arrays**, each covering specific wavelength channels totaling **102 bands** ($0.75\text{--}5.00\text{ µm}$).

#### What the Current Code Does:
1. In `backend/main.py` (lines 176–182):
   ```python
   detector_bands = [
       {"name": "NIR-Short", "start_idx": 0, "end_idx": 19, "color": "#4fc3f7"},
       {"name": "NIR-Mid",   "start_idx": 20, "end_idx": 39, "color": "#81c784"},
       {"name": "NIR-Long",  "start_idx": 40, "end_idx": 59, "color": "#fff176"},
       {"name": "SWIR-1",    "start_idx": 60, "end_idx": 79, "color": "#ffb74d"},
       {"name": "SWIR-2",    "start_idx": 80, "end_idx": 101, "color": "#e57373"},
   ]
   ```
   The backend defines **5 detector bands** with arbitrary non-standard names (`NIR-Short`, `NIR-Mid`, etc.).
2. In `backend/spherex_engine.py` (lines 98–105) and `frontend/src/data/targets.js` (lines 70–77):
   ```javascript
   export const SPHEREX_BANDS = [
     { id: 1, name: "Band 1", startWl: 0.75, endWl: 1.11, startCh: 1, endCh: 17 },
     { id: 2, name: "Band 2", startWl: 1.11, endWl: 1.64, startCh: 18, endCh: 34 },
     { id: 3, name: "Band 3", startWl: 1.64, endWl: 2.42, startCh: 35, endCh: 51 },
     { id: 4, name: "Band 4", startWl: 2.42, endWl: 3.82, startCh: 52, endCh: 68 },
     { id: 5, name: "Band 5", startWl: 3.82, endWl: 4.42, startCh: 69, endCh: 85 },
     { id: 6, name: "Band 6", startWl: 4.42, endWl: 5.00, startCh: 86, endCh: 102 },
   ];
   ```
   Here, the instrument is correctly split into **6 bands**.

#### The Consequence:
The backend transmits a 5-band payload over `/api/spectrum`, while the frontend UI components expect 6 SPHEREx detectors. This causes mismatched colored bounding regions on the 102-band Plotly chart and incorrect band-to-detector mapping.

---

### 2.3 Critical Deficiency #3: Missing Core Astrophysics Dependencies in `requirements.txt`

#### The Requirement:
To interact with NASA/IPAC IRSA and manipulate astronomical images, the backend must use `astropy` and `astroquery`.

#### What the Current Code Does:
In `backend/requirements.txt`:
```text
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
numpy>=1.26.0
Pillow>=10.4.0
scipy>=1.13.0
pydantic>=2.9.0
python-multipart>=0.0.9
```
Notice that `astropy` and `astroquery` are **completely absent**!

In `backend/main.py`:
```python
irsa_available = False
try:
    from astroquery.ipac.irsa import Irsa
    import astropy.units as u
    from astropy.coordinates import SkyCoord
    irsa_available = True
except ImportError:
    pass
```
When any developer or evaluator clones the repository and runs `pip install -r requirements.txt`, `irsa_available` will **always evaluate to `False`**!

#### The Consequence:
The application silently bypasses all live IRSA connections and permanently generates synthetic random numbers (`rng.integers(5, 11)`). The user is never informed that IRSA queries are completely disabled due to uninstalled packages.

---

### 2.4 Deficiency #4: Purely Synthetic Mock Simulation with Hardcoded Fallbacks

#### The Requirement:
The tool should be capable of handling arbitrary sky coordinates or ingesting real/simulated SPHEREx FITS cubes released by NASA SDS and IPAC.

#### What the Current Code Does:
In `backend/spherex_engine.py`:
- Line 127: The entire star field is artificially synthesized using an MD5 hash of the coordinate string as a random seed:
  ```python
  coord_key = f"{round(ra, 4)}_{round(dec, 4)}"
  seed = int(hashlib.md5(coord_key.encode()).hexdigest()[:8], 16)
  ```
- It generates 18 to 26 artificial 2D Gaussians (`make_gaussian_psf`).
- For any coordinate outside the 5 hardcoded NASA targets:
  - No target motion is simulated ($dt = 0.0$).
  - Difference imaging produces an empty field of pure subtracted noise ($\Delta I \approx 0$).
  - Anomaly detection finds zero targets.
- The 102-band spectrum is generated from heuristic formulas (e.g. `14.5 * (1.15 / wavelengths) ** 1.4` or sine waves) rather than sampling real or simulated astronomical data cubes.

#### The Consequence:
The application is essentially a closed demo that only functions on the 5 pre-baked coordinates. It cannot serve as a true generalized sky explorer tool for new candidate discoveries across the celestial sphere.

---

### 2.5 UI/UX Defect #5: Coordinate Input Only Supports Decimal Floats (Broken Sexagesimal)

#### The Requirement:
Astronomers, students, and Space Apps participants frequently work with coordinates in sexagesimal notation:
- RA: `08h55m10.83s` or `08:55:10.83`
- Dec: `-07°14'42.5"` or `-07:14:42.5`

#### What the Current Code Does:
In `frontend/src/components/ControlPanel.jsx` (lines 41–48):
```javascript
const handleManualCoords = (e) => {
  e.preventDefault();
  const parsedRa = parseFloat(inputRa);
  const parsedDec = parseFloat(inputDec);
  if (!isNaN(parsedRa) && !isNaN(parsedDec) && onCoordsChange) {
    onCoordsChange(parsedRa, parsedDec);
  }
};
```
`parseFloat("08:55:10.83")` evaluates to `8.0`.
`parseFloat("-07:14:42.5")` evaluates to `-7.0`.

#### The Consequence:
Entering standard astronomical coordinates teleports the viewer to completely incorrect sky positions without warning, causing user frustration and failing standard astronomical usability tests.

---

### 2.6 Usability Defect #6: Rigid Anomaly Clustering Fails Across Different FOVs

#### The Requirement:
Dipoles must be detected regardless of the selected Field of View ($1.0\text{ arcmin}$ to $15.0\text{ arcmin}$).

#### What the Current Code Does:
In `backend/spherex_engine.py` (lines 318–322):
```python
if a1["polarity"] != a2["polarity"]:
    dist = np.hypot(a1["x"] - a2["x"], a1["y"] - a2["y"])
    if dist < 24.0:
        a1["type"] = "dipole"
```
The spatial clustering threshold is hardcoded to a fixed **24.0 pixels** on the image matrix.
However, the pixel scale changes dynamically with FOV:
$$\text{arcsec per pixel} = \frac{\text{FOV}_{\text{arcmin}} \times 60}{256}$$
- At $\text{FOV} = 15'$, pixel scale is $3.51''/\text{px}$. A motion of $5''$ spans $1.4\text{ pixels}$.
- At $\text{FOV} = 1'$, pixel scale is $0.23''/\text{px}$. A motion of $8''$ spans **$34.8\text{ pixels}$**!

#### The Consequence:
When a user zooms in to inspect a fast-moving object at $\text{FOV} = 1.0'$, the positive and negative peaks are separated by $> 24\text{ pixels}$. The algorithm **fails to recognize the dipole** and misclassifies both peaks as two independent variable star monopoles!

---

### 2.7 Usability Defect #7: Fixed-Height Screen Overflow on Standard Laptops

#### The Requirement:
Public-facing web applications must render reliably across various display resolutions (1080p, 1440p, laptops with 125%/150% DPI scaling).

#### What the Current Code Does:
In `frontend/src/App.jsx` (line 232):
```html
<div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0B0F19]">
```
The layout enforces `h-screen overflow-hidden` with multi-tier nested cards having large fixed min-heights (e.g. 512px EpochViewer, 400px SpectrumChart, 350px AladinViewer).

#### The Consequence:
On common 14-inch and 15.6-inch laptop screens ($1920\times1080$ at 125% or 150% scaling, effective viewport height $\approx 720\text{--}864\text{px}$), the bottom half of the 102-band spectrograph and the status bar are completely cut off off-screen and cannot be scrolled into view!

---

### 2.8 Missing Feature #8: Lack of Scientific Export / Discovery Dossier Generation

#### The Requirement:
A citizen science tool must enable users who discover an anomaly or dipole to document and export their findings to share with NASA or the scientific community.

#### What the Current Code Does:
There is zero capability to:
- Export the current cutout as an astronomical standard FITS file.
- Export the 102-band spectrum as a calibrated CSV / VO-Table.
- Generate a "Candidate Discovery Dossier" (JSON / PDF / Shareable Link).
- Log user classification votes or candidate flags.

---

## 3. Detailed File-by-File Defect Log

| File Path | Lines | Defect Classification | Detailed Description | Impact on User |
|---|---|---|---|---|
| `backend/main.py` | 95–96 | **Functional Bug (Severity: High)** | Checks `epoch in ("1", "2")`, ignoring `"epoch1"` and `"epoch2"` sent by frontend. | Blink mode breaks completely; renders static duplicate frame. |
| `backend/main.py` | 176–182 | **Architectural Conflict (Severity: Med)** | Defines 5 detector bands instead of SPHEREx's 6 bands. | Spectrum chart detector bands visually conflict with frontend data definitions. |
| `backend/requirements.txt` | 1–7 | **Environment Omission (Severity: High)** | Omission of `astropy` and `astroquery`. | IRSA live querying silently fails on fresh installation. |
| `backend/spherex_engine.py` | 321 | **Algorithmic Flaw (Severity: High)** | Hardcoded `dist < 24.0` pixels for dipole pairing without FOV scaling. | Zooms ($\le 2'$) cause dipoles to be falsely classified as monopoles. |
| `backend/spherex_engine.py` | 442–470 | **Rendering Issue (Severity: Low)** | Custom base64 diverging colormap uses fixed RGB values without linear normalization safeguard. | Contrast can wash out in saturated fields. |
| `frontend/src/App.jsx` | 128, 156 | **API Contract Bug (Severity: High)** | Passes `epoch1` and `epoch2` string literals to backend API. | Contributes to the Blink mode failure. |
| `frontend/src/App.jsx` | 232 | **CSS Layout Bug (Severity: Med)** | Root `h-screen overflow-hidden` without responsive scroll container. | Spectrum chart cut off on laptops and tablets. |
| `frontend/src/components/ControlPanel.jsx` | 43–45 | **Input Validation Bug (Severity: High)** | Raw `parseFloat` on RA/Dec inputs without regex for sexagesimal strings. | Sexagesimal inputs (`HH:MM:SS`, `DD:MM:SS`) silently fail or corrupt position. |
| `frontend/src/components/AladinViewer.jsx` | 45–55 | **Resilience Defect (Severity: Med)** | Polling timer gives up after 15s if CDN is unreachable with no fallback UI. | Offline users or firewall-restricted users see an ugly broken black square. |
| `frontend/src/components/EpochViewer.jsx` | 155–160 | **State Handling Bug (Severity: Med)** | Blink layer depends on `cutoutDataEpoch2?.image` which is never populated because of App.jsx epoch mismatch. | Flickers or shows single image during auto-blink. |

---

## 4. Conclusion & Recommended Action Plan

The current `Planet-X-Hunter` project has a **strong visual concept and modern UI styling**, but suffers from **critical bugs in its core differentiating features** (Blink mode is non-functional, detector band specifications conflict, and coordinate input fails for astronomical notation).

### Immediate Remediation Steps:
1. **Fix the API Contract & Epoch Parsing:** Harmonize `App.jsx` and `main.py` so that `epoch1` $\rightarrow$ `1` and `epoch2` $\rightarrow$ `2`.
2. **Align 6-Band SPHEREx Detector Definitions:** Correct `detector_bands` in `main.py` to match the 6 physical LVF detector arrays.
3. **Add `astropy` and `astroquery` to `requirements.txt`:** Ensure seamless live IRSA queries.
4. **Implement Robust Sexagesimal Coordinate Parser:** Add regex-based converter supporting `HH:MM:SS.ss` and `±DD:MM:SS.s`.
5. **Scale Dipole Clustering by WCS Pixel Scale:** Calculate pixel distance dynamically based on arcseconds: $\text{dist\_px} \times \text{pixel\_scale} \le \text{max\_motion\_arcsec}$.
6. **Implement Responsive Scrolling Layout:** Replace rigid `h-screen overflow-hidden` with a flex-wrap or responsive scroll architecture.
7. **Introduce Candidate Discovery Dossier & Export Module:** Allow exporting cutouts (FITS/PNG) and SED spectra (CSV/JSON).
