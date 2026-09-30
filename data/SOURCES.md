# National Demographic, Deprivation & Infrastructure Data Sources

This document records the provenance, publication year, licence, and retrieval date for every column in [`data/districts.csv`](file:///d:/NagarVaani/data/districts.csv) and [`data/districts.json`](file:///d:/NagarVaani/data/districts.json).

> **Data Integrity Policy:** Only verified figures published by official Government of India bodies (Registrar General & Census Commissioner of India, NITI Aayog, and Ministry of Health & Family Welfare / IIPS via NFHS-5) are populated in `data/districts.csv` and `data/districts.json`. Districts in states not yet released in the machine-readable Phase 1 factsheet dataset remain explicitly `null` — never guessed, fabricated, or interpolated. Full extraction line-by-line verification is logged in [`data/VERIFICATION.md`](file:///d:/NagarVaani/data/VERIFICATION.md).

---

## 1. Column Provenance & Metadata

| Column | Description | Primary Source Authority | Portal / Source Mirror | Reference Years | Licence | Retrieval Date | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `state` | State / Union Territory name | Office of the Registrar General & Census Commissioner, India | https://censusindia.gov.in / https://lgdirectory.gov.in | 2011 | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `district` | Official district name | Office of the Registrar General & Census Commissioner, India | https://censusindia.gov.in/census.website/data/census-tables | 2011 | GODL-India | 2026-09-30 | **Verified (Populated)** |
| `population_2011` | Total district population (persons) | Primary Census Abstract (PCA), Census of India 2011 & NIC Portals | https://censusindia.gov.in / https://data.gov.in | 2011 | GODL-India | 2026-09-30 | **Verified (Populated)** |
| `literacy_rate_2011` | Effective district literacy rate (%) for population aged 7+ | Final Population Totals / Census 2011 | https://censusindia.gov.in | 2011 | GODL-India | 2026-09-30 | **Verified (Populated)** |
| `aspirational_district` | Boolean flag (`true` if in the 112 Aspirational Districts Programme) | NITI Aayog — Aspirational Districts Programme (Champions of Change) | https://www.niti.gov.in/aspirational-districts-programme | 2018–Present | GODL-India | 2026-09-30 | **Verified (Populated)** |
| `nfhs5_electricity_pct` | Population living in households with electricity (%) | Open Government Data Platform India / MoHFW & IIPS | Primary: https://data.gov.in; Mirror: https://github.com/pratapvardhan/NFHS-5 (`district-level/`) | 2019–2021 | GODL-India / CC BY 4.0 | 2026-09-30 | **Verified (Populated for 30 districts)** |
| `nfhs5_improved_water_pct` | Population living in households with an improved drinking-water source (%) | Open Government Data Platform India / MoHFW & IIPS | Primary: https://data.gov.in; Mirror: https://github.com/pratapvardhan/NFHS-5 (`district-level/`) | 2019–2021 | GODL-India / CC BY 4.0 | 2026-09-30 | **Verified (Populated for 30 districts)** |
| `nfhs5_improved_sanitation_pct` | Population living in households using an improved sanitation facility (%) | Open Government Data Platform India / MoHFW & IIPS | Primary: https://data.gov.in; Mirror: https://github.com/pratapvardhan/NFHS-5 (`district-level/`) | 2019–2021 | GODL-India / CC BY 4.0 | 2026-09-30 | **Verified (Populated for 30 districts)** |
| `pmgsy_road_connectivity_pct` | Eligible rural habitations connected by all-weather roads (%) | Pradhan Mantri Gram Sadak Yojana (PMGSY) — OMMAS Portal | http://omms.nic.in / https://data.gov.in | — | GODL-India | 2026-09-30 | **Not loaded (`null`)** |

---

## 2. Important Methodological & Survey Caveats

> [!IMPORTANT]
> 1. **Sample-Survey vs Administrative Census Data:**
>    NFHS-5 figures are representative probability-sample survey estimates conducted during 2019–21 by the International Institute for Population Sciences (IIPS) under the Ministry of Health and Family Welfare (MoHFW), Government of India. They represent district-level sample survey estimates with associated sampling confidence intervals, not a 100% administrative enumeration.
>
> 2. **"Improved Drinking-Water Source" vs Jal Jeevan Mission Tap Coverage:**
>    In NFHS-5, an *"improved drinking-water source"* includes piped water into dwelling/yard/plot, public tap/standpipe, tubewell or borehole, protected dug well, protected spring, rainwater collection, and community reverse-osmosis/bottled water. **This indicator is not identical to Jal Jeevan Mission (JJM) administrative tap water coverage**, which specifically counts Functional Household Tap Connections (FHTC) registered directly in the JJM IMIS portal.
>
> 3. **Phase 1 vs Phase 2 State Coverage:**
>    The machine-readable GitHub repository mirror (`pratapvardhan/NFHS-5`) compiles the official Phase 1 district factsheets (21 states/UTs). Districts in states surveyed in Phase 2 (e.g. Uttar Pradesh, Madhya Pradesh, Rajasthan, Tamil Nadu, Punjab, Haryana, Uttarakhand, Jharkhand, Odisha, Chhattisgarh) are kept as `null` in the dataset and are never interpolated or guessed.

---

## 3. Verified District NFHS-5 Import Summary

The 30 districts with imported NFHS-5 survey values include:
- **Bihar:** Patna (`99.0%` elec, `98.8%` water, `61.0%` sanitation), Gaya (`97.9%`, `99.2%`, `44.4%`), Muzaffarpur (`96.6%`, `99.9%`, `55.2%`), Araria (`96.2%`, `100.0%`, `32.2%`).
- **Maharashtra:** Mumbai Suburban (`99.2%`, `99.8%`, `62.6%`), Mumbai City (`99.6%`, `100.0%`, `58.6%`), Pune (`99.4%`, `96.9%`, `79.6%`), Nagpur (`99.5%`, `99.5%`, `88.9%`), Gadchiroli (`95.8%`, `83.0%`, `62.4%`), Nandurbar (`96.2%`, `94.6%`, `54.1%`).
- **West Bengal:** Kolkata (`99.6%`, `99.3%`, `60.9%`), Birbhum (`97.8%`, `99.4%`, `55.0%`), Purulia (`88.6%`, `87.6%`, `29.2%`).
- **Gujarat:** Ahmedabad (`99.5%`, `98.7%`, `86.4%`), Dahod (`89.3%`, `91.0%`, `35.9%`), Narmada (`92.7%`, `96.8%`, `54.6%`).
- **Karnataka:** Bengaluru Urban (`98.8%`, `99.2%`, `90.4%`), Raichur (`99.7%`, `94.0%`, `53.0%`), Yadgir (`99.0%`, `95.2%`, `37.4%`).
- **Telangana:** Hyderabad (`99.9%`, `99.6%`, `84.4%`), Bhadradri Kothagudem (`99.4%`, `99.1%`, `75.3%`).
- **Andhra Pradesh:** Visakhapatnam (`99.6%`, `91.8%`, `77.8%`), Vizianagaram (`99.5%`, `93.1%`, `61.7%`).
- **Kerala:** Thiruvananthapuram (`99.9%`, `92.9%`, `95.4%`), Wayanad (`97.0%`, `94.1%`, `97.6%`).
- **Himachal Pradesh:** Shimla (`100.0%`, `97.3%`, `87.3%`), Chamba (`99.1%`, `85.5%`, `86.5%`).
- **Assam:** Kamrup Metropolitan (`99.2%`, `87.2%`, `65.2%`), Baksa (`98.1%`, `89.8%`, `68.9%`), Darrang (`89.5%`, `99.7%`, `67.9%`).

For the exact line-by-line verification and row coordinates in the official state CSVs, refer to [`data/VERIFICATION.md`](file:///d:/NagarVaani/data/VERIFICATION.md).
