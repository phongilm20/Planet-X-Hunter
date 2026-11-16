# 📚 SPHEREx & Planet X: Comprehensive Technical Resource Reference

**NASA Space Apps Challenge:** "Planet X and SPHEREx"  
**Challenge Link:** [https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/?tab=resources)  
**Document Purpose:** Exhaustive survey and technical specification of all data resources, astronomical archives, APIs, data formats, query protocols, and software libraries mandated and recommended for the project.

---

## 1. Resource Matrix & Architectural Role

| Resource Name | Providing Institution | Data Nature | Role in SPHEREx Hunter Project | Integration Layer |
|---|---|---|---|---|
| **NASA/IPAC IRSA** | Caltech / NASA | All-sky IR Archives & SPHEREx SDS | Primary data source for SPHEREx cutouts & infrared source catalogs | Backend (Astroquery / REST) |
| **SPHEREx SDS Data Products** | SPHEREx Science Team / Caltech | Hyperspectral FITS Cubes (102 bands) | Core observational imagery, time-domain epochs, and SED spectra | Backend Processing Engine |
| **CDS Aladin Lite v3** | Strasbourg Astronomical Data Centre | HiPS Deep Sky Interactive Atlas | Embedded interactive sky context, survey toggling, catalog overlay | Frontend Viewport |
| **ESA Gaia Archive (DR3)** | European Space Agency (ESA) | Optical Astrometry & Proper Motion | High-precision baseline to identify moving vs stationary objects | Frontend & Backend TAP |
| **NASA AllWISE & 2MASS** | NASA / IPAC / Caltech | Near- & Mid-Infrared Photometry | Cross-band confirmation of cold thermal signatures ($W1\text{--}W4$) | Backend / Aladin Layer |
| **NASA JPL Horizons / SBDB** | NASA JPL Solar System Dynamics | Ephemerides & Orbit Catalog | Filter out known solar system asteroids and comets | Backend API Proxy |
| **Backyard Worlds / Zooniverse** | NASA Citizen Science / Zooniverse | Time-Domain Citizen Science Paradigms | UX workflow blueprint for blink comparison & dipole tagging | Frontend UX / Guide |
| **Astropy & Photutils Stack** | Astropy Project (Open Source) | Astronomical Computation Framework | WCS projection, FITS parsing, photometry, difference imaging | Backend Core Engine |

---

## 2. Deep Dive: Resource Breakdown, Roles & Query Protocols

---

### Resource 1: NASA / IPAC Infrared Science Archive (IRSA)

#### A. What is it?
The **Infrared Science Archive (IRSA)**, curated by Caltech and NASA's Jet Propulsion Laboratory (JPL), is the official data repository for NASA's infrared, submillimeter, and time-domain astronomical missions. It hosts historical missions (IRAS, 2MASS, Spitzer, WISE/NEOWISE) and serves as the official distribution hub for the **SPHEREx Science Data System (SDS)**.

#### B. What role does it play in the main project?
- **Authoritative Data Ingestion:** Supplies raw and calibrated multi-epoch SPHEREx spectral cutouts and all-sky maps.
- **Archival Catalog Cross-Matching:** Allows cone searches and spatial cross-matching against millions of infrared sources to determine if a detected anomaly is an already cataloged object.
- **Photometric Validation:** Provides multi-band infrared flux measurements against which newly extracted 102-band SPHEREx spectra can be calibrated and validated.

#### C. How to use it: Formats & Data Structure
- **Protocols Supported:**
  1. **TAP (Table Access Protocol / IVOA Standard):** Used for advanced spatial and photometric querying via Astronomical Data Query Language (ADQL / SQL-92 derivative).
  2. **Cone Search:** Simple radial coordinate queries $(\alpha, \delta, r)$.
  3. **IRSA Cutout API (SIA / Simple Image Access):** Direct retrieval of sub-image FITS arrays.
- **Output Formats:**
  - `VOTable` (XML format with embedded metadata, IVOA standard).
  - `IPAC Table` (ASCII fixed-width format with strict data typing headers).
  - `CSV / TSV` (Comma/Tab-separated values).
  - `FITS` (Flexible Image Transport System images and binary tables).
- **Structure for Data Retrieval:**
  ```python
  # Python Astroquery syntax for querying IRSA TAP service:
  from astroquery.ipac.irsa import Irsa
  import astropy.units as u
  from astropy.coordinates import SkyCoord

  coord = SkyCoord(ra=133.79513, dec=-7.24515, unit="deg", frame="icrs")
  
  # Radial cone search query
  table = Irsa.query_region(
      coordinates=coord,
      catalog="allwise_p3as_psd",  # AllWISE Source Catalog
      spatial="Cone",
      radius=5.0 * u.arcmin
  )
  ```
  **Direct TAP ADQL REST Endpoint:**
  ```http
  GET https://irsa.ipac.caltech.edu/TAP/sync?QUERY=SELECT+ra,dec,w1mpro,w2mpro,w3mpro,w4mpro+FROM+allwise_p3as_psd+WHERE+CONTAINS(POINT('ICRS',ra,dec),CIRCLE('ICRS',133.79513,-7.24515,0.0833))=1&FORMAT=json
  ```
  **JSON Response Schema:**
  ```json
  {
    "data": [
      [133.79513, -7.24515, 14.21, 12.18, 9.45, 7.82]
    ],
    "fields": [
      {"name": "ra", "type": "float"},
      {"name": "dec", "type": "float"},
      {"name": "w1mpro", "type": "float"},
      {"name": "w2mpro", "type": "float"},
      {"name": "w3mpro", "type": "float"},
      {"name": "w4mpro", "type": "float"}
    ]
  }
  ```

---

### Resource 2: SPHEREx Mission Data Products (Simulated & SDS Releases)

#### A. What is it?
The data stream generated by the SPHEREx space observatory. The instrument features a $20\text{ cm}$ all-aluminum telescope with a $3.5^\circ \times 11.3^\circ$ field-of-view, focused onto **six $2048 \times 2048$ Hawaii-2RG (H2RG) mercury-cadmium-telluride (HgCdTe) detector arrays**. 

Each array is fitted with a Linear Variable Filter (LVF) that disperses light continuously across the detector:
- **Array 1:** $0.75\text{--}1.11\text{ µm}$ ($R \sim 41$)
- **Array 2:** $1.11\text{--}1.64\text{ µm}$ ($R \sim 41$)
- **Array 3:** $1.64\text{--}2.42\text{ µm}$ ($R \sim 41$)
- **Array 4:** $2.42\text{--}3.82\text{ µm}$ ($R \sim 35$)
- **Array 5:** $3.82\text{--}4.42\text{ µm}$ ($R \sim 110$)
- **Array 6:** $4.42\text{--}5.00\text{ µm}$ ($R \sim 130$)
Totaling **102 spectral channels** with a spatial pixel sampling of **$6.2\text{ arcseconds per pixel}$**.

#### B. What role does it play in the main project?
- **Core Observation Medium:** Supplies the multi-epoch 2D image slices and 3D hyperspectral data cubes $(\alpha, \delta, \lambda)$.
- **Time-Domain Cadence:** The 6-month survey interval provides the essential temporal separation ($\Delta t = 0.5\text{ yr}$) required to compute difference images, reveal proper motion dipoles, and detect photometric variability.
- **Spectral Energy Distribution (SED):** Allows extraction of physical near-infrared spectra to distinguish planetary candidates from ordinary stars.

#### C. How to use it: Formats & Data Structure
- **Format:** Multi-Extension FITS (MEF) files with standard FITS WCS (World Coordinate System) headers.
- **FITS Header & Data Structure (HDU layout):**
  - **HDU 0 (PRIMARY):** Global metadata header (Observation epoch, date, target ID, coordinate bounds, instrument status).
  - **HDU 1 (SCI - Science Array):** 2D or 3D floating-point matrix of calibrated surface brightness / flux density in $\text{MJy/sr}$.
  - **HDU 2 (ERR - Uncertainty Array):** $1\sigma$ error estimate matrix per pixel.
  - **HDU 3 (MASK - Quality Bitmask):** 16-bit integer bitmask flag array.
- **Bitmask Definitions:**
  | Bit Flag Value | Symbolic Flag | Meaning | Project Action |
  |---|---|---|---|
  | `0x0001` (1) | `SATURATED` | Detector well depth full | Highlight warning; exclude from SED fit |
  | `0x0002` (2) | `COSMIC_RAY` | High-energy proton/ion hit | Flag as artifact; mask out in diff image |
  | `0x0004` (4) | `DIFFRACTION_SPIKE`| Stray light / optical spider spike | Display visual flag on spectral graph |
  | `0x0008` (8) | `SOURCE_CONFUSION` | Spatial PSF overlap | Mark high uncertainty in photometric error |
  | `0x0000` (0) | `CLEAN` | High-fidelity scientific pixel | Standard photometric extraction |
- **Structure for Data Retrieval:**
  ```python
  from astropy.io import fits
  from astropy.wcs import WCS

  with fits.open("spherex_cutout_dr1_band50.fits") as hdul:
      header = hdul["PRIMARY"].header
      sci_data = hdul["SCI"].data        # 2D numpy array [256, 256]
      err_data = hdul["ERR"].data        # 2D numpy array [256, 256]
      mask_data = hdul["MASK"].data      # 2D uint16 array [256, 256]
      wcs = WCS(header)
  ```

---

### Resource 3: CDS Aladin Lite v3 & HiPS

#### A. What is it?
**Aladin Lite v3** is a lightweight, browser-based celestial sky viewer developed by the Centre de Données astronomiques de Strasbourg (CDS). It renders multi-resolution all-sky surveys utilizing the **HiPS** (Hierarchical Progressive Surveys) standard based on HEALPix tessellation.

#### B. What role does it play in the main project?
- **Contextual Visualization:** Gives users an intuitive, pan-and-zoom interactive view of the wider cosmological landscape surrounding any queried coordinate.
- **Multi-Wavelength Cross-Examination:** Allows one-click switching between AllWISE (mid-IR), 2MASS (near-IR), and DSS2 (optical) tiles to verify candidate physical properties in real time.
- **Catalog Projection:** Enables dynamic overlay of high-density catalogs (Gaia DR3 astrometry vectors, SIMBAD identifiers, AllWISE detections).

#### C. How to use it: Formats & Data Structure
- **Format:** HTML5 Canvas / WebGL library consuming remote HiPS tiles (JPEG/PNG/FITS format organized in HEALPix order directory trees `Norder/Dir/Npix`).
- **Initialization & Script Embedding:**
  ```html
  <script type="text/javascript" src="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.js" charset="utf-8"></script>
  <link rel="stylesheet" href="https://aladin.cds.unistra.fr/AladinLite/api/v3/latest/aladin.min.css" />
  ```
- **JavaScript API Structure for Retrieval & Interaction:**
  ```javascript
  // Initialize Aladin Lite v3
  const aladin = window.A.aladin('#aladin-container', {
    survey: 'P/allWISE/color',          // Primary HiPS survey ID
    fov: 0.1,                           // Field of view in degrees (6 arcmin)
    target: '133.795130 -7.245150',      // RA & Dec target center
    cooFrame: 'J2000',                  // Coordinate reference frame
    showReticle: true,
  });

  // Switch surveys dynamically
  aladin.setImageSurvey('P/2MASS/color'); // or 'P/DSS2/color'

  // Hook into viewport interactions to sync with SPHEREx viewer
  aladin.on('positionChanged', (coords) => {
    console.log(`New center: RA = ${coords.ra}, Dec = ${coords.dec}`);
  });

  // Overlay custom Gaia or candidate catalog
  const catalog = window.A.catalog({ name: 'Candidate Anomaly', sourceSize: 18, color: '#00E5FF' });
  aladin.addCatalog(catalog);
  catalog.addSources([
    window.A.marker(133.795130, -7.245150, { popupTitle: 'WISE 0855 Dipole', popupDesc: 'Proper Motion: 8.1"/yr' })
  ]);
  ```

---

### Resource 4: ESA Gaia Mission Archive (Gaia DR3)

#### A. What is it?
The European Space Agency's (ESA) **Gaia space telescope** has measured high-precision positions, parallaxes, and proper motions for over **1.8 billion astronomical objects** with sub-milliarcsecond precision. Gaia Data Release 3 (DR3) includes full 5-parameter astrometry $(\alpha, \delta, \varpi, \mu_\alpha^*, \mu_\delta)$ and broad-band photometry ($G, G_{\text{BP}}, G_{\text{RP}}$).

#### B. What role does it play in the main project?
- **Filtering Known Stationary Stars:** In time-domain difference imaging, background stars subtract to zero. Gaia catalog overlays verify that the canceled objects are known stationary stars.
- **The "Planet X" Smoking Gun:** A hypothetical Planet X or an ultra-cold sub-brown dwarf ($T < 300\text{ K}$) is completely invisible to Gaia's optical detectors ($G > 21\text{ mag}$). Therefore, **any significant dipole found in SPHEREx difference imaging that has NO Gaia DR3 counterpart is a top-tier candidate for an undiscovered cold object or Solar System planet**.
- **Proper Motion Vector Calibration:** For known moving targets (e.g., Barnard's Star, $\varepsilon$ Indi B), Gaia proper motions provide the exact ground-truth vector against which SPHEREx dipole separations can be tested.

#### C. How to use it: Formats & Data Structure
- **Format:** TAP / ADQL query returning JSON, CSV, or VOTable from ESA or CDS mirrors (`https://gea.esac.esa.int/tap-server/tap` or VizieR `I/355/gaiadr3`).
- **Structure for Data Retrieval (ADQL Query):**
  ```sql
  SELECT source_id, ra, dec, pmra, pmdec, parallax, phot_g_mean_mag
  FROM gaiadr3.gaia_source
  WHERE 1=CONTAINS(
    POINT('ICRS', ra, dec),
    CIRCLE('ICRS', 133.79513, -7.24515, 0.0833) -- 5 arcmin radius in degrees
  )
  AND phot_g_mean_mag < 20.0
  ```
- **Retrieved Schema & Fields:**
  - `source_id`: Unique 64-bit integer identifier.
  - `ra`, `dec`: Coordinate centroid in degrees (Epoch J2016.0).
  - `pmra`: Proper motion in RA: $\mu_\alpha^* = \mu_\alpha \cos \delta$ in $\text{mas/yr}$.
  - `pmdec`: Proper motion in Dec: $\mu_\delta$ in $\text{mas/yr}$.
  - `parallax`: Trigonometric parallax $\varpi$ in $\text{mas}$ (distance $d = 1000/\varpi\text{ pc}$).
  - `phot_g_mean_mag`: Mean magnitude in Gaia $G$-band ($330\text{--}1050\text{ nm}$).

---

### Resource 5: NASA AllWISE & 2MASS Infrared Catalogs

#### A. What is it?
- **AllWISE:** Combines data from the Wide-field Infrared Survey Explorer (WISE) cryogenic and NEOWISE post-cryogenic surveys in four mid-infrared bands:
  - $W1$: $3.4\text{ µm}$
  - $W2$: $4.6\text{ µm}$
  - $W3$: $12\text{ µm}$
  - $W4$: $22\text{ µm}$
- **2MASS (Two Micron All Sky Survey):** Ground-based near-infrared survey covering $J$ ($1.25\text{ µm}$), $H$ ($1.65\text{ µm}$), and $K_s$ ($2.16\text{ µm}$).

#### B. What role does it play in the main project?
- **Color-Color Diagnostic Filtering:** Ultra-cold substellar objects and brown dwarfs have distinctive colors due to atmospheric methane absorption at $3.3\text{ µm}$:
  $$W1 - W2 > 1.5\text{ to } 4.0\text{ mag}$$
  This color excess directly validates candidates detected in SPHEREx Band 5 & 6 ($4.0\text{--}5.0\text{ µm}$).
- **Multi-Decadal Baseline:** Comparing 2MASS (circa 2000), WISE (circa 2010), and SPHEREx (2024–2026) expands the observational baseline to **over 25 years**, allowing the detection of extremely slow-moving outer Solar System objects!

#### C. How to use it: Formats & Data Structure
- **Format:** IPAC ASCII table format, IRSA REST JSON API.
- **Structure for Data Retrieval:**
  ```http
  GET https://irsa.ipac.caltech.edu/cgi-bin/Gator/nph-query?spatial=Cone&radius=300&radunits=arcsec&objstr=133.79513+-7.24515&catalog=allwise_p3as_psd&outfmt=1
  ```
- **Retrieved Key Fields:**
  - `designation`: Sexagesimal source designation (e.g., `WISE J085510.83-071442.5`).
  - `w1mpro`, `w2mpro`, `w3mpro`, `w4mpro`: Profile-fit photometric magnitudes.
  - `w1sigmpro`, `w2sigmpro`: Profile-fit magnitude photometric uncertainties.
  - `pmra`, `pmdec`: Motion estimates from WISE multi-epoch co-adds.

---

### Resource 6: NASA JPL Horizons & Small-Body Database (SBDB)

#### A. What is it?
NASA JPL's **Solar System Dynamics (SSD)** group maintains the authoritative database of all known solar system objects: over 1.3 million asteroids, comets, Centaurs, Kuiper Belt Objects (KBOs), and Trans-Neptunian Objects (TNOs).

#### B. What role does it play in the main project?
- **Known Object Vetting:** When a moving dipole is detected in SPHEREx difference images, the project must query JPL SBDB/Horizons to check if a known main-belt asteroid or comet crossed the field of view during the observation timestamp.
- **Candidate Elimination:** If the dipole matches a known asteroid ephemeris, it is flagged as a "Known Solar System Asteroid". If no match exists and the motion vector indicates an orbit beyond Neptune ($v < 3\text{ km/s}$ / proper motion $< 5\text{ arcsec/yr}$ with parallax $< 10\text{ arcsec}$), it is flagged as a **High-Priority Planet X Candidate**.

#### C. How to use it: Formats & Data Structure
- **Format:** Modern REST JSON API.
- **Endpoint Structure:**
  ```http
  GET https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Ceres&phys-par=1
  ```
  **Ephemeris Query Endpoint (Horizons API):**
  ```http
  GET https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND='301'&EPHEM_TYPE='OBSERVER'&CENTER='@399'&START_TIME='2026-01-01'&STOP_TIME='2026-01-02'&STEP_SIZE='1d'&QUANTITIES='1,2,3'
  ```
- **Structure of Retrieved JSON:**
  ```json
  {
    "signature": {"version": "1.3", "source": "NASA/JPL SBDB API"},
    "object": {
      "fullname": "1 Ceres (A801 AA)",
      "orbit_class": {"name": "Asteroid", "code": "MBA"},
      "orbit": {
        "elements": [
          {"name": "e", "value": "0.0789"},
          {"name": "a", "value": "2.767"}
        ]
      }
    }
  }
  ```

---

### Resource 7: Citizen Science Precedents (Backyard Worlds: Planet 9 & Zooniverse)

#### A. What is it?
**Backyard Worlds: Planet 9** is a renowned NASA-funded citizen science project hosted on Zooniverse. It enlists hundreds of thousands of volunteers to visually inspect multi-epoch infrared difference flipbooks from NASA's WISE telescope to uncover brown dwarfs and hypothetical trans-Neptunian planets.

#### B. What role does it play in the main project?
- **UI/UX Paradigm Blueprint:** Backyard Worlds validated that human visual pattern recognition is vastly superior to purely automated scripts in spotting faint dipoles amidst optical diffraction artifacts and cosmic ray spikes.
- **Workflow & Educational Onboarding:** Provides the architectural basis for our application's "Auto-Blink Comparator", interactive tutorial walkthrough, and visual dipole vs monopole classification guide.

#### C. How to use it: Visual Data Structure
- **Blink Flipbook Structure:** Alternating display of time-separated epochs ($E_1, E_2$) with crosshair centering and synchronized zoom.
- **User Classification Tags:** Categorizing anomalies into structured taxonomic tags:
  1. `DIPOLE_MOVING_TARGET` (Positive/negative adjacent pair indicating true physical motion)
  2. `MONOPOLE_VARIABLE` (Pulsating star or accretion flare at fixed coordinate)
  3. `DIFFRACTION_ARTIFACT` (Spike from off-axis bright star)
  4. `GHOST_INTERNAL_REFLECTION` (Optical aberration moving with telescope scan direction)

---

### Resource 8: Astronomical Python Scientific Stack (Astropy, SciPy, Photutils)

#### A. What is it?
The open-source computational backbone of modern astrophysics:
- **Astropy:** Standard library for astronomy in Python (World Coordinate System handling, FITS file I/O, physical units, celestial angle manipulation).
- **Photutils:** Astropy package for source detection and astronomical photometry (aperture photometry, PSF fitting).
- **SciPy & NumPy:** Vectorized multidimensional array processing, convolution, morphological filters (`maximum_filter`, `minimum_filter`), and statistical outlier filtering.

#### B. What role does it play in the main project?
- **Backend Computation Engine:** Executes the difference imaging subtraction, co-add exposure stacking, automated dipole clustering algorithms, and synthetic PSF rendering on demand.

#### C. How to use it: Formats & Code Implementation
- **Data Structure:** NumPy n-dimensional floating-point arrays (`np.ndarray`) mapped to Astropy `WCS` instances.
- **Code Architecture:**
  ```python
  from astropy.wcs import WCS
  from astropy.coordinates import SkyCoord
  import numpy as np
  from scipy.ndimage import maximum_filter, minimum_filter

  # 1. Transform world coordinates to array indices
  wcs = WCS(naxis=2)
  wcs.wcs.crpix = [128.5, 128.5]
  wcs.wcs.cdelt = [-0.00034, 0.00034] # ~1.22 arcsec/pixel
  wcs.wcs.crval = [ra_deg, dec_deg]
  wcs.wcs.ctype = ["RA---TAN", "DEC--TAN"]

  # 2. Vectorized Difference Subtraction
  diff_array = epoch2_array - epoch1_array

  # 3. Z-Score Anomaly Filtering
  z_score = (diff_array - np.mean(diff_array)) / np.std(diff_array)
  pos_mask = z_score > 3.2
  neg_mask = z_score < -3.2
  ```

---

## 3. Summary: How All Resources Connect in the Application Pipeline

```
                                [NASA/IPAC IRSA] 
                                        │ (Cutout / TAP API)
                                        ▼
    [User Coordinate Input] ──► [FastAPI Backend Engine] ◄── [Astropy / Photutils]
         (RA / Dec / Target)            │  (Difference Subtraction,
                                        │   Dipole Detection, 102-Band SED)
                                        ▼
    ┌───────────────────────────────────┼───────────────────────────────────┐
    │ (Base64 PNG Cutouts & WCS)        │ (102-Band SED JSON)               │ (IRSA / Catalog JSON)
    ▼                                   ▼                                   ▼
[Epoch Viewer & Blink Engine]   [102-Band Plotly Spectrograph]      [Gaia & AllWISE Catalogs]
    │                                   │                                   │
    └───────────────────────────────────┼───────────────────────────────────┘
                                        │
                                        ▼
                         [CDS Aladin Lite v3 Context View]
                                        │
                                        ▼
                         [Citizen Scientist Discovery Dossier]
```
