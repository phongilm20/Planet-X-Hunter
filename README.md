# SPHEREx Time-Domain Sky Explorer

**NASA Space Apps Challenge 2026 · Planet X and SPHEREx (Advanced)**

A public-facing web tool for inspecting, blinking, and analyzing multi-epoch near-infrared sky images from NASA's SPHEREx mission (0.75–5.0 µm, 102 spectral bands) to spot moving solar system bodies, high-proper-motion brown dwarfs, and variable stars.

---

## 150-Word Submission Description (NASA Space Apps Challenge)

> NASA's SPHEREx mission maps the entire sky every ~6 months in 102 near-infrared bands (0.75–5.0 µm) with a 6.15″/pixel detector, capturing over a billion objects across multiple epochs. The **SPHEREx Time-Domain Sky Explorer** provides a sober, high-precision observatory interface that makes multi-epoch astronomical data accessible to researchers and citizen scientists alike. Users can rapidly compare sky fields using a calibrated Blink Comparator (0.5–4.0 Hz), Synchronized Side-by-Side comparison, and Difference Imaging ($B - A$) with dipole/monopole detection. Every displayed astrometric value includes documented provenance and citation metadata. Incorporating discrete observational epochs from 2014 NEOWISE baselines through SPHEREx Surveys 1–5, the application addresses real instrument constraints—including Linear Variable Filter (LVF) wavelength shifts—to deliver an honest, scientifically rigorous platform for tracking fast brown dwarfs, outer solar system bodies, and evaluating outer-planet candidates.

---

## Key Features

1. **Blink Comparator:** Toggle between observation epochs at 0.5–4.0 Hz (Spacebar to play/pause, $\leftarrow/\rightarrow$ to step) to spot high proper motion objects jumping against stationary background stars—the exact optical technique Clyde Tombaugh used to discover Pluto in 1930.
2. **Synchronized Side-by-Side View:** Dual synchronized viewports with coupled pan and zoom for close scrutiny.
3. **Difference View ($B - A$):** High-precision frame subtraction isolating flux changes:
   - **Dipole signature:** Paired positive/negative residuals indicating moving bodies (e.g. WISE 0855, Barnard's Star).
   - **Monopole signature:** Single stationary residual indicating variable stars (e.g. R Draconis).
4. **102-Band SPHEREx Spectrophotometer:** Integrated near-infrared spectrum displaying molecular signatures ($\text{H}_2\text{O}$ at 1.4 µm, $\text{CH}_4$ at 1.66 µm and 3.3 µm, $\text{CO}_2$ ice at 4.26 µm, and $\text{CO}$ at 4.67 µm).
5. **Real Astronomical Mathematics:** Rigorous $\cos(\delta)$ proper motion projection, live expected displacement calculation, WCS header projection, and 30″ calibrated scale bars.
6. **Scientific Honesty & Instrument Caveats:**
   - **Linear Variable Filter (LVF) Warning:** Alerts users when subtracting images observed at different detector positions, where nominal wavelengths differ ($\lambda_A \neq \lambda_B$).
   - **Provenance Badges:** Clear labelling of data sources (`LIVE IRSA`, `CACHED`, or `SIMULATED`).
   - **Realistic Planet X Assessment:** Plain-language disclosure of SPHEREx's detection limits for trans-Neptunian bodies.

---

## Planet X / Planet Nine Feasibility Assessment

Could SPHEREx discover Planet X?
- **Expected Motion:** A hypothetical 5–10 $M_\oplus$ planet orbiting at 400–800 AU exhibits proper motion of only $\approx 0.04\text{–}0.16^{\prime\prime}/\text{yr}$.
- **Detector Resolution:** SPHEREx pixels are $6.15^{\prime\prime}$ across. The expected displacement over SPHEREx's 2-year baseline is $\le 0.3^{\prime\prime}$, corresponding to $\le 0.05$ pixels.
- **Feasibility:** Spotting such a faint, slow object by eye in a single 6-month blink is unfeasible. Detection requires sub-pixel centroid fitting, co-adding multiple survey passes to boost SNR, or cross-matching SPHEREx NIR positions against optical baselines from the Vera C. Rubin Observatory (LSST) or NASA's Nancy Grace Roman Space Telescope.

---

## Quick Start (Run Locally)

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Start the Backend API (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
*API runs at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).*

### 2. Start the Frontend (React + Vite + Tailwind CSS)
```bash
cd frontend
npm install
npm run dev
```
*Web application runs at `http://localhost:5173`.*

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Toggle Blink playback (Play / Pause) |
| `B` | Switch to Blink Comparator mode |
| `S` | Switch to Side-by-Side view |
| `D` | Switch to Difference image ($B - A$) |
| `←` / `→` | Step between Epoch A and Epoch B |
| `R` | Reset pan & zoom to center |
| `+` / `-` | Zoom in / Zoom out |

---

## Data Attribution & Acknowledgements

- **SPHEREx:** NASA / JPL-Caltech.
- **IRSA:** NASA/IPAC Infrared Science Archive.
- **Gaia:** European Space Agency (ESA) Gaia Data Release 3 (DR3).
- **WISE/NEOWISE:** NASA / IPAC / Caltech.
- **CDS Strasbourg:** Sesame Name Resolver and astronomical coordinate services.
