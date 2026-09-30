# National Demographic, Deprivation & Infrastructure Data Sources

This document records the provenance, publication year, licence, and retrieval date for every column in [`data/districts.csv`](file:///d:/NagarVaani/data/districts.csv) and [`data/districts.json`](file:///d:/NagarVaani/data/districts.json).

> **Data Integrity Policy:** Only verified figures published by the Government of India (Registrar General & Census Commissioner of India and NITI Aayog) are populated in `data/districts.csv` and `data/districts.json`. Columns whose district-level values could not be directly verified from machine-readable official tables without manual portal extraction are left `null` (empty in CSV) and listed under **MISSING - fill manually** below. An illustrative template is provided separately in [`data/districts.SAMPLE.csv`](file:///d:/NagarVaani/data/districts.SAMPLE.csv).

---

## 1. Column Provenance & Metadata

| Column | Description | Source Portal / Authority | Official URL | Reference Year | Licence | Retrieval Date | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `state` | State / Union Territory name | Office of the Registrar General & Census Commissioner, India | https://censusindia.gov.in / https://lgdirectory.gov.in | 2011 | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `district` | Official Census district name | Office of the Registrar General & Census Commissioner, India | https://censusindia.gov.in/census.website/data/census-tables | 2011 | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `population_2011` | Total district population (persons) | Primary Census Abstract (PCA), Census of India 2011 & District NIC Portals | https://censusindia.gov.in/census.website/data/census-tables & https://data.gov.in | 2011 | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `literacy_rate_2011` | Effective district literacy rate (%) for population aged 7+ | Final Population Totals / District Census Handbooks, Census of India 2011 | https://censusindia.gov.in/census.website/data/census-tables | 2011 | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `aspirational_district` | Boolean flag (`true` if in the 112 Aspirational Districts Programme) | NITI Aayog — Aspirational Districts Programme (Champions of Change) | https://www.niti.gov.in/aspirational-districts-programme / https://championsofchange.gov.in | 2018–Present | Government Open Data License – India (GODL-India) | 2026-09-30 | **Verified (Populated)** |
| `tap_water_coverage_pct` | Rural/household Functional Household Tap Connection (FHTC) coverage (%) | Jal Jeevan Mission (JJM) — Department of Drinking Water & Sanitation, Ministry of Jal Shakti | https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx | 2024–2026 | Government Open Data License – India (GODL-India) | 2026-09-30 | **MISSING (`null`) — fill manually** |
| `pmgsy_road_connectivity_pct` | Eligible rural habitations connected by all-weather roads (%) | Pradhan Mantri Gram Sadak Yojana (PMGSY) — OMMAS Portal, Ministry of Rural Development | http://omms.nic.in / https://data.gov.in | 2024–2026 | Government Open Data License – India (GODL-India) | 2026-09-30 | **MISSING (`null`) — fill manually** |
| `sanitation_coverage_pct` | Population living in households using an improved sanitation facility (%) | National Family Health Survey (NFHS-5) District Fact Sheets / Swachh Bharat Mission (SBM) | https://rchiips.org/nfhs/factsheet_NFHS-5.shtml / https://sbm.gov.in | 2019–2021 (NFHS-5) | Government Open Data License – India (GODL-India) | 2026-09-30 | **MISSING (`null`) — fill manually** |

---

## 2. Verified District Records (`data/districts.csv`)

All 20 districts in `data/districts.csv` have verified Census 2011 `population_2011` and `literacy_rate_2011` values and verified NITI Aayog `aspirational_district` flags:

- **Patna, Bihar:** Pop `5,838,465`, Literacy `70.68%` (https://patna.nic.in/demography/), Aspirational: `false`
- **Gaya, Bihar:** Pop `4,359,700`, Literacy `63.67%` (Census 2011 District Handbook Bihar), Aspirational: `true` (NITI Aayog ADP)
- **Muzaffarpur, Bihar:** Pop `4,801,062`, Literacy `63.56%` (Census 2011 District Handbook Bihar), Aspirational: `true` (NITI Aayog ADP)
- **Jaipur, Rajasthan:** Pop `6,626,178`, Literacy `75.51%` (https://rajasthan.gov.in / Census 2011), Aspirational: `false`
- **Bhopal, Madhya Pradesh:** Pop `2,368,145`, Literacy `80.40%` (https://bhopaldivisionmp.nic.in), Aspirational: `false`
- **Lucknow, Uttar Pradesh:** Pop `4,589,838`, Literacy `77.29%` (Census 2011 UP PCA), Aspirational: `false`
- **Varanasi, Uttar Pradesh:** Pop `3,676,841`, Literacy `75.60%` (https://varanasi.nic.in), Aspirational: `false`
- **Bahraich, Uttar Pradesh:** Pop `3,487,731`, Literacy `49.32%` (Census 2011 UP PCA), Aspirational: `true` (NITI Aayog ADP)
- **Kolkata, West Bengal:** Pop `4,496,694`, Literacy `86.31%` (Census 2011 WB PCA), Aspirational: `false`
- **Mumbai Suburban, Maharashtra:** Pop `9,356,962`, Literacy `89.91%` (Census 2011 MH PCA), Aspirational: `false`
- **Mumbai City, Maharashtra:** Pop `3,085,411`, Literacy `89.21%` (https://mumbaicity.gov.in), Aspirational: `false`
- **Pune, Maharashtra:** Pop `9,429,408`, Literacy `86.15%` (Census 2011 MH PCA), Aspirational: `false`
- **Nagpur, Maharashtra:** Pop `4,653,570`, Literacy `88.39%` (https://nagpur.gov.in), Aspirational: `false`
- **Chennai, Tamil Nadu:** Pop `4,646,732`, Literacy `90.18%` (Census 2011 TN PCA), Aspirational: `false`
- **Hyderabad, Telangana:** Pop `3,943,323`, Literacy `83.25%` (Census 2011 AP/TS PCA), Aspirational: `false`
- **Ahmedabad, Gujarat:** Pop `7,214,225`, Literacy `85.31%` (Census 2011 GJ PCA), Aspirational: `false`
- **Bengaluru Urban, Karnataka:** Pop `9,621,551`, Literacy `87.67%` (Census 2011 KA PCA), Aspirational: `false`
- **Ranchi, Jharkhand:** Pop `2,914,253`, Literacy `76.06%` (https://ranchi.nic.in), Aspirational: `true` (NITI Aayog ADP)
- **Kamrup Metropolitan (Guwahati), Assam:** Pop `1,253,938`, Literacy `88.71%` (Census 2011 AS PCA), Aspirational: `false`
- **Khordha (Bhubaneswar), Odisha:** Pop `2,251,673`, Literacy `86.88%` (Census 2011 OR PCA), Aspirational: `false`
- **Koraput, Odisha:** Pop `1,379,647`, Literacy `49.21%` (Census 2011 OR PCA), Aspirational: `true` (NITI Aayog ADP)
- **Bastar, Chhattisgarh:** Pop `834,375`, Literacy `53.15%` (https://bastar.gov.in), Aspirational: `true` (NITI Aayog ADP)

---

## 3. MISSING - Fill Manually

To avoid fabricating any statistics, the following three infrastructure columns are left `null` (blank in `data/districts.csv`) until populated from official government portals:

1. **`tap_water_coverage_pct` (Jal Jeevan Mission — Household Tap Water Coverage %)**
   - **Where to download:** Open https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx → Click your State → Read the **"Percentage of Households provided with Tap Water Supply"** column for each district.
   - **Range:** `0` to `100` (percentage).
2. **`pmgsy_road_connectivity_pct` (PMGSY — Habitation All-Weather Road Connectivity %)**
   - **Where to download:** Open http://omms.nic.in → **Progress Monitoring** → **Habitation Connectivity Status (CNCPL)** → Select State & District → Compute `(Connected Habitations / Eligible Habitations) * 100`, or download the district CSV from https://data.gov.in (search `"PMGSY district habitation connectivity"`).
   - **Range:** `0` to `100` (percentage).
3. **`sanitation_coverage_pct` (NFHS-5 — Improved Household Sanitation Facility %)**
   - **Where to download:** Open https://rchiips.org/nfhs/factsheet_NFHS-5.shtml → Select State → Open the District Fact Sheet PDF → Read Indicator #4: **"Population living in households that use an improved sanitation facility (%)"**.
   - **Range:** `0` to `100` (percentage).

Once filled into `data/districts.csv` (or `data/districts.json`), [`lib/nationalData.ts`](file:///d:/NagarVaani/lib/nationalData.ts) and [`lib/priority.ts`](file:///d:/NagarVaani/lib/priority.ts) automatically incorporate the non-null infrastructure gaps into the deprivation factor without any code changes.
