export const AI_INSIGHTS = {
  "WISE 0855-0714": {
    defaultChip: "motion",
    chips: [
      { id: "motion", label: "⚡ Why is it moving so fast?" },
      { id: "planetx", label: "🪐 Could this be Planet X?" },
      { id: "spectra", label: "🌈 Infrared Spectra & Water Ice" },
      { id: "spherex", label: "🔭 SPHEREx Discovery Strategy" },
    ],
    insights: {
      motion: `**WISE 0855-0714** possesses the **fourth-highest proper motion** of any known stellar system ($\sim 8.13''/\\text{yr}$). Because it is only **7.3 light-years** away (nearly our closest celestial neighbor after the Alpha Centauri system and Barnard's Star), its true space motion ($\sim 52\\text{ km/s}$) translates to an enormous apparent angular leap across the sky.

Between the initial 2014 WISE baseline and SPHEREx's 2026.5 QR3 epoch, WISE 0855 traverses nearly **100 arcseconds**—jumping through dozens of SPHEREx detector pixels while background stars stay stationary!`,

      planetx: `While WISE 0855 is **not** Planet X (it is unbound to our Sun and travels through interstellar space), it is the **most crucial astrophysical benchmark for finding Planet X**. 

Both objects have similar equilibrium temperatures ($\sim 250\\text{ K}$ for WISE 0855 vs $\sim 40\\text{ K}$ for Planet X) and are **virtually invisible in optical surveys like Hubble or Gaia**. An outer Solar System planet would appear as an extremely slow dipole ($\sim 0.16''/\\text{yr}$) with a similar deep-infrared thermal peak at 4.7 µm!`,

      spectra: `At $\\sim 250\\text{ K}$ ($-23^\\circ\\text{C}$), WISE 0855 has an atmosphere cold enough to host **water-ice ($\text{H}_2\text{O}$) clouds**—the first ever detected outside our Solar System!

Its SPHEREx 102-band spectrophotometric fingerprint reveals:
- **Major absorption dips** at $1.4\\,\\mu\\text{m}$ and $1.9\\,\\mu\\text{m}$ ($\text{H}_2\text{O}$ vapor).
- **Deep methane ($\text{CH}_4$) band** at $3.3\\,\\mu\\text{m}$.
- **Prominent thermal emission window** at $4.5–5.0\\,\\mu\\text{m}$ (SPHEREx Band 6), where cold substellar bodies radiate nearly all their internal heat.`,

      spherex: `In optical telescopes, WISE 0855 is completely undetectable ($V > 30\\text{ mag}$). However, SPHEREx's continuous all-sky survey maps it in **102 narrow spectral channels simultaneously** every 6 months.

By subtracting Epoch 1 from Epoch 2, stationary stars cancel out to zero, leaving a **clean, undeniable Dipole Signature** (negative blue residual at the old position, positive red residual at the new position) with zero optical contamination.`,
    },
  },

  "Barnard's Star": {
    defaultChip: "motion",
    chips: [
      { id: "motion", label: "⚡ Highest Proper Motion" },
      { id: "astrometry", label: "📐 Astrometric Calibration" },
      { id: "spectra", label: "🔴 M-Dwarf Near-IR Flares" },
      { id: "exoplanets", label: "🪐 Exoplanetary System" },
    ],
    insights: {
      motion: `**Barnard's Star** holds the reigning galactic record for the **fastest proper motion of any known star**: **$10.33''/\\text{yr}$** northward through Ophiuchus. Traveling at **$142.6\\text{ km/s}$**, it traverses the width of the full Moon every $\sim 180\\text{ years}$.

In our 3D timeline (2010 $\\rightarrow$ 2035), Barnard's Star shifts by over **250 arcseconds**, making it the ultimate real-time test of SPHEREx's time-domain astrometric pipeline!`,

      astrometry: `Because its proper motion, parallax ($547.4\\text{ mas}$), and radial velocity ($-110\\text{ km/s}$) are measured to sub-milliarcsecond precision by Gaia DR3, NASA and IPAC use Barnard's Star as the **primary astrometric calibration standard** for cross-registering multi-epoch SPHEREx spectral cubes with historical WISE and 2MASS datasets.`,

      spectra: `As an **M4Ve red dwarf**, Barnard's Star emits primarily in the near-infrared ($0.8–2.5\\,\\mu\\text{m}$). 

Its SPHEREx 102-band spectrum features deep **Titanium Oxide (TiO)** and **Vanadium Oxide (VO)** absorption bands in Bands 1–2, water absorption bands in Band 3 ($1.9\\,\\mu\\text{m}$), and periodic flare flux surges driven by magnetic reconnection in its convective envelope.`,

      exoplanets: `Barnard's Star hosts confirmed sub-Earth exoplanets (including *Barnard b*). Multi-epoch SPHEREx spectrophotometry allows astronomers to search for subtle infrared light reflected by outer planets and examine the star's stellar activity cycle over its 2-year nominal mission.`,
    },
  },

  "Epsilon Indi B": {
    defaultChip: "spectra",
    chips: [
      { id: "spectra", label: "🌈 T-Dwarf NIR Peaks" },
      { id: "motion", label: "⚡ Binary System Motion" },
      { id: "binary", label: "👥 T1 + T6 Binary Physics" },
      { id: "atmosphere", label: "☁️ Methane Clouds" },
    ],
    insights: {
      spectra: `**Epsilon Indi B** is the quintessential **T-dwarf laboratory**. Its SPHEREx 102-band spectrum showcases the dramatic spectroscopic transition between early and late T-dwarfs:
- **Spectral Peaks** at $1.05\\,\\mu\\text{m}$ ($Y$ band), $1.25\\,\\mu\\text{m}$ ($J$ band), $1.6\\,\\mu\\text{m}$ ($H$ band), and $2.1\\,\\mu\\text{m}$ ($K$ band).
- Extreme methane ($\text{CH}_4$) and water vapor ($\text{H}_2\text{O}$) absorption completely carve out the flux between these atmospheric windows.`,

      motion: `Located only **$11.9\\text{ light-years}$** from Earth, this brown dwarf pair sweeps across the southern celestial hemisphere with a rapid proper motion of **$4.70''/\\text{yr}$**. Over a 10-year span, its position shifts by nearly **47 arcseconds**—visible as a distinct dual-dipole in difference imaging.`,

      binary: `The system consists of two brown dwarfs orbiting each other: **Epsilon Indi Ba** (spectral type T1, $\sim 47\\,M_J$) and **Epsilon Indi Bb** (spectral type T6, $\sim 28\\,M_J$) with an orbital period of $\sim 15\\text{ years}$. SPHEREx's multi-epoch observations enable orbital astrometry tracking without requiring adaptive optics space telescopes.`,

      atmosphere: `At effective temperatures of $1,300\\text{ K}$ and $900\\text{ K}$, Epsilon Indi B's atmosphere marks the boundary where iron and silicate cloud decks sink below the visible photosphere, allowing methane molecules to dominate the near-infrared spectrum.`,
    },
  },

  "RW Aurigae": {
    defaultChip: "variability",
    chips: [
      { id: "variability", label: "⭐ Dramatic Dimming Events" },
      { id: "disk", label: "🪐 Circumstellar Protoplanetary Disk" },
      { id: "motion", label: "📍 Stationary Monopole Check" },
      { id: "spectra", label: "🔬 Infrared Dust Emission" },
    ],
    insights: {
      variability: `**RW Aurigae** is a classic **T Tauri young stellar object** that undergoes extraordinary dimming episodes. Over months, its visual and near-IR flux drops by **up to 3 full magnitudes (90% flux loss!)** before recovering.

In our 3D timeline and SPHEREx difference imaging, **its position does NOT move** ($\mu < 0.015''/\\text{yr}$), but its 3D glow pulses dramatically—creating a textbook **Monopole Residual Signature**!`,

      disk: `The cause of RW Aur's dramatic dimming is a tidal disruption event: a close flyby from companion star RW Aur B shredded its **circumstellar protoplanetary dust disk**, sending streams of opaque dust and millimeter-sized grains sweeping across our line of sight.`,

      motion: `Unlike WISE 0855 or Barnard's Star, RW Aurigae is distant ($530\\text{ ly}$). Its proper motion is negligible over the SPHEREx timeline. Comparing moving dipoles vs stationary flux monopoles is the primary method astronomers use to separate local moving candidates from distant young variable stars.`,

      spectra: `SPHEREx's 102 bands span the exact wavelengths where circumstellar dust reradiates absorbed starlight:
- Warm silicate emission feature at $0.75–1.2\\,\\mu\\text{m}$.
- Excess thermal emission in Bands 5–6 ($3.8–5.0\\,\\mu\\text{m}$) originating from the inner sublimation edge of the dust disk.`,
    },
  },

  "R Draconis": {
    defaultChip: "mira",
    chips: [
      { id: "mira", label: "💫 245-Day Pulsation Engine" },
      { id: "radii", label: "🔴 Stellar Radius Expansion" },
      { id: "spectra", label: "🌌 Silicate & Molecular Shells" },
      { id: "spherex", label: "📊 6-Month Cadence Sampling" },
    ],
    insights: {
      mira: `**R Draconis** is a prototypical **Mira-type pulsating red giant variable**. In a $\sim 245.6\\text{-day}$ cycle ($\sim 0.67\\text{ years}$), the entire star rhythmically breathes: expanding to several hundred times the size of our Sun, cooling, and then contracting while releasing tremendous bursts of energy.

Because SPHEREx surveys the sky on a **6-month cadence**, each consecutive survey epoch catches R Draconis at a completely different phase of its pulsation cycle!`,

      radii: `During its pulsation cycle, R Draconis's visual brightness changes by a factor of **over 1,000 (up to 8 magnitudes!)**. In the near-infrared, however, the flux changes by 1.5 to 2.5 magnitudes because as the star cools, its peak emission shifts directly into SPHEREx Bands 4–6 ($2.4–5.0\\,\\mu\\text{m}$).`,

      spectra: `As an Asymptotic Giant Branch (AGB) star, R Draconis has sloughed off its outer mantle into an expanding circumstellar envelope:
- Powerful **carbon monoxide (CO)** first overtone absorption at $2.3\\,\\mu\\text{m}$.
- Strong **water vapor ($\text{H}_2\text{O}$)** and **silicate dust** features in Bands 3–5.`,

      spherex: `In Difference Imaging Mode, R Draconis produces the **highest amplitude monopole residual in the northern sky**. Its 3D sphere scales and throbs with realistic blackbody temperature shifts, illustrating why multi-epoch time-domain spectroscopy is vital for studying late-stage stellar evolution.`,
    },
  },

  "Planet X Candidate (Sedna-Zone)": {
    defaultChip: "planetx",
    chips: [
      { id: "planetx", label: "🪐 What is the Planet X Signature?" },
      { id: "orbit", label: "🛰️ Extreme Outer Solar System Orbit" },
      { id: "spectra", label: "❄️ 42 K Thermal Ice Spectrum" },
      { id: "verification", label: "✅ How SPHEREx Confirms It" },
    ],
    insights: {
      planetx: `If **Planet X (Planet Nine)** exists in the distant scattered disk ($\sim 400–600\\text{ AU}$), it will manifest in SPHEREx data as a **slowly drifting, extremely cold infrared dipole**:
- Expected proper motion: $\sim 0.10–0.25''/\\text{yr}$ (driven primarily by Earth's annual parallax baseline of $\sim 2\\text{ AU}$).
- Apparent motion between SPHEREx DR1 (Month 0) and QR3 (Month 18): $\sim 0.25''$, cleanly detectable by sub-pixel centroiding across stacked bands.`,

      orbit: `Clustering in the arguments of perihelion of extreme Trans-Neptunian Objects (like Sedna, 2012 $\text{VP}_{113}$, and Leleākūhonua) suggests a perturbing planet of **$5–10\\text{ Earth masses}$** with an orbital semimajor axis of $\sim 450\\text{ AU}$ and period of $\sim 10,000–18,000\\text{ years}$.`,

      spectra: `At $\sim 40–50\\text{ K}$, reflected sunlight from Planet X is minuscule ($V > 24\\text{ mag}$), making it nearly invisible to optical survey telescopes. 

However, its internal radiogenic heat creates a **thermal infrared emission peak right at $4.0–5.0\\,\\mu\\text{m}$ (SPHEREx Band 6)**. Furthermore, atmospheric methane ($\text{CH}_4$) and nitrogen ice ($\text{N}_2$) produce unique spectral absorption fingerprints in Bands 4–5 that distinguish it from distant background galaxies or red stars.`,

      verification: `To confirm a Planet X candidate:
1. **Time-Domain Dipole Detection**: Identify a point source with consistent retrograde parallax displacement over 6-month and 12-month SPHEREx cadences.
2. **102-Band Spectrophotometry**: Verify the cold $\sim 45\\text{ K}$ blackbody slope with deep $3.3\\,\\mu\\text{m}$ methane absorption.
3. **Optical Veto**: Cross-match with Gaia DR3 and Pan-STARRS to confirm zero optical counterpart.`,
    },
  },
};
