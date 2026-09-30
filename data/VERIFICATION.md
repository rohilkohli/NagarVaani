# National Demographic & NFHS-5 District Indicators Verification Log

**Generated:** 2026-09-30T10:27:22.539Z
**Data Sources:**
- Census of India 2011 (Office of the Registrar General & Census Commissioner of India)
- National Family Health Survey (NFHS-5), 2019-21 (Ministry of Health & Family Welfare / IIPS)
**Source Repository Mirror:** [https://github.com/pratapvardhan/NFHS-5](https://github.com/pratapvardhan/NFHS-5) (`district-level/`)
**Local Raw Dropzone:** `data/raw/nfhs5/` (for filling Phase 2 state CSVs or official data.gov.in tables)

## 1. Summary
- **Total Districts in Master Dataset:** 58
- **Districts with NFHS-5 Data Imported:** 30
- **Districts Left Null (Phase 2 States / Unmatched):** 28
- **Strict Policy:** Values were extracted strictly from verified NFHS-5 columns without fabrication, guessing, or interpolation. Unmatched districts retain explicit `null`.

## 2. NFHS-5 Infrastructure Indicators District-by-District Table

| State | District | NFHS District Match | Source File | Electricity (%) [Row] | Improved Water (%) [Row] | Improved Sanitation (%) [Row] | Status | Verified by Human |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Bihar | Patna | Patna | `NFHS-5-BR-Bihar.csv` | 99% [Row 2608] | 98.8% [Row 2609] | 61% [Row 2610] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Bihar | Gaya | Gaya | `NFHS-5-BR-Bihar.csv` | 97.9% [Row 944] | 99.2% [Row 945] | 44.4% [Row 946] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Bihar | Muzaffarpur | Muzaffarpur | `NFHS-5-BR-Bihar.csv` | 96.6% [Row 2192] | 99.9% [Row 2193] | 55.2% [Row 2194] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Bihar | Araria | Araria | `NFHS-5-BR-Bihar.csv` | 96.2% [Row 8] | 100% [Row 9] | 32.2% [Row 10] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Rajasthan | Jaipur | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Rajasthan | Jaisalmer | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Rajasthan | Sirohi | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Madhya Pradesh | Bhopal | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Madhya Pradesh | Barwani | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Madhya Pradesh | Vidisha | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttar Pradesh | Lucknow | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttar Pradesh | Varanasi | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttar Pradesh | Bahraich | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttar Pradesh | Balrampur | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttar Pradesh | Chitrakoot | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| West Bengal | Kolkata | Kolkata | `NFHS-5-WB-West-Bengal.csv` | 99.6% [Row 840] | 99.3% [Row 841] | 60.9% [Row 842] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| West Bengal | Birbhum | Birbhum | `NFHS-5-WB-West-Bengal.csv` | 97.8% [Row 112] | 99.4% [Row 113] | 55% [Row 114] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| West Bengal | Purulia | Puruliya | `NFHS-5-WB-West-Bengal.csv` | 88.6% [Row 1776] | 87.6% [Row 1777] | 29.2% [Row 1778] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Mumbai Suburban | Mumbai Suburban | `NFHS-5-MH-Maharashtra.csv` | 99.2% [Row 1672] | 99.8% [Row 1673] | 62.6% [Row 1674] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Mumbai City | Mumbai | `NFHS-5-MH-Maharashtra.csv` | 99.6% [Row 1776] | 100% [Row 1777] | 58.6% [Row 1778] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Pune | Pune | `NFHS-5-MH-Maharashtra.csv` | 99.4% [Row 2608] | 96.9% [Row 2609] | 79.6% [Row 2610] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Nagpur | Nagpur | `NFHS-5-MH-Maharashtra.csv` | 99.5% [Row 1880] | 99.5% [Row 1881] | 88.9% [Row 1882] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Gadchiroli | Gadchiroli | `NFHS-5-MH-Maharashtra.csv` | 95.8% [Row 944] | 83% [Row 945] | 62.4% [Row 946] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Maharashtra | Nandurbar | Nandurbar | `NFHS-5-MH-Maharashtra.csv` | 96.2% [Row 2088] | 94.6% [Row 2089] | 54.1% [Row 2090] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Tamil Nadu | Chennai | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Tamil Nadu | Ramanathapuram | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Tamil Nadu | Virudhunagar | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Telangana | Hyderabad | Hyderabad | `NFHS-5-TG-Telangana.csv` | 99.9% [Row 216] | 99.6% [Row 217] | 84.4% [Row 218] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Telangana | Bhadradri Kothagudem | Bhadradri Kothagudem | `NFHS-5-TG-Telangana.csv` | 99.4% [Row 112] | 99.1% [Row 113] | 75.3% [Row 114] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Andhra Pradesh | Visakhapatnam | Visakhapatnam | `NFHS-5-AP-Andhra-Pradesh.csv` | 99.6% [Row 944] | 91.8% [Row 945] | 77.8% [Row 946] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Andhra Pradesh | Vizianagaram | Vizianagaram | `NFHS-5-AP-Andhra-Pradesh.csv` | 99.5% [Row 1048] | 93.1% [Row 1049] | 61.7% [Row 1050] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Gujarat | Ahmedabad | Ahmedabad | `NFHS-5-GJ-Gujarat.csv` | 99.5% [Row 8] | 98.7% [Row 9] | 86.4% [Row 10] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Gujarat | Dahod | Dahod | `NFHS-5-GJ-Gujarat.csv` | 89.3% [Row 944] | 91% [Row 945] | 35.9% [Row 946] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Gujarat | Narmada | Narmada | `NFHS-5-GJ-Gujarat.csv` | 92.7% [Row 2088] | 96.8% [Row 2089] | 54.6% [Row 2090] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Karnataka | Bengaluru Urban | Bangalore | `NFHS-5-KA-Karnataka.csv` | 98.8% [Row 216] | 99.2% [Row 217] | 90.4% [Row 218] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Karnataka | Raichur | Raichur | `NFHS-5-KA-Karnataka.csv` | 99.7% [Row 2400] | 94% [Row 2401] | 53% [Row 2402] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Karnataka | Yadgir | Yadgir | `NFHS-5-KA-Karnataka.csv` | 99% [Row 3024] | 95.2% [Row 3025] | 37.4% [Row 3026] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Kerala | Thiruvananthapuram | Thiruvananthapuram | `NFHS-5-KL-Kerala.csv` | 99.9% [Row 1152] | 92.9% [Row 1153] | 95.4% [Row 1154] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Kerala | Wayanad | Wayanad | `NFHS-5-KL-Kerala.csv` | 97% [Row 1360] | 94.1% [Row 1361] | 97.6% [Row 1362] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Punjab | Amritsar | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Punjab | Firozpur | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Haryana | Gurugram | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Haryana | Nuh | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttarakhand | Dehradun | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Uttarakhand | Haridwar | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Himachal Pradesh | Shimla | Shimla | `NFHS-5-HP-Himachal-Pradesh.csv` | 100% [Row 840] | 97.3% [Row 841] | 87.3% [Row 842] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Himachal Pradesh | Chamba | Chamba | `NFHS-5-HP-Himachal-Pradesh.csv` | 99.1% [Row 112] | 85.5% [Row 113] | 86.5% [Row 114] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Jharkhand | Ranchi | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Jharkhand | Dumka | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Assam | Kamrup Metropolitan | Kamrup Metropolitan | `NFHS-5-AS-Assam.csv` | 99.2% [Row 1776] | 87.2% [Row 1777] | 65.2% [Row 1778] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Assam | Baksa | Baksa | `NFHS-5-AS-Assam.csv` | 98.1% [Row 8] | 89.8% [Row 9] | 68.9% [Row 10] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Assam | Darrang | Darrang | `NFHS-5-AS-Assam.csv` | 89.5% [Row 736] | 99.7% [Row 737] | 67.9% [Row 738] | MATCHED | Auto-verified from NFHS-5 factsheet CSV |
| Odisha | Khordha | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Odisha | Koraput | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Odisha | Kalahandi | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Odisha | Nabarangpur | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Chhattisgarh | Bastar | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |
| Chhattisgarh | Bijapur | — | `—` | null | null | null | UNMATCHED | No (Phase 2 State — not in NFHS-5 Phase 1 mirror; place official CSV in data/raw/nfhs5/ to populate) |

## 3. Census 2011 Demographic Indicators Verification (Population & Literacy)

Listing of official Census 2011 figures for each district with corresponding primary Census table references.

| State | District | Census 2011 Population | Population Source Table | Census 2011 Literacy Rate (%) | Literacy Source Table | Verified by Human |
| :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| Bihar | Patna | 58,38,465 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 70.68% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Bihar | Gaya | 43,59,700 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 63.67% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Bihar | Muzaffarpur | 48,01,062 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 63.56% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Bihar | Araria | 28,11,569 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 53.53% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Rajasthan | Jaipur | 66,26,178 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 75.51% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Rajasthan | Jaisalmer | 6,69,919 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 57.22% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Rajasthan | Sirohi | 10,36,346 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 55.25% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Madhya Pradesh | Bhopal | 23,68,145 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 80.4% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Madhya Pradesh | Barwani | 13,85,881 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 49.08% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Madhya Pradesh | Vidisha | 14,58,875 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 70.53% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttar Pradesh | Lucknow | 45,89,838 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 77.29% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttar Pradesh | Varanasi | 36,76,841 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 75.6% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttar Pradesh | Bahraich | 34,87,731 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 49.32% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttar Pradesh | Balrampur | 21,48,665 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 49.51% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttar Pradesh | Chitrakoot | 9,91,730 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 65.05% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| West Bengal | Kolkata | 44,96,694 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 86.31% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| West Bengal | Birbhum | 35,02,404 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 70.68% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| West Bengal | Purulia | 29,30,115 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 64.48% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Mumbai Suburban | 93,56,962 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 89.91% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Mumbai City | 30,85,411 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 89.21% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Pune | 94,29,408 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 86.15% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Nagpur | 46,53,570 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 88.39% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Gadchiroli | 10,72,942 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 74.36% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Maharashtra | Nandurbar | 16,48,295 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 64.38% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Tamil Nadu | Chennai | 46,46,732 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 90.18% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Tamil Nadu | Ramanathapuram | 13,53,445 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 80.72% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Tamil Nadu | Virudhunagar | 19,42,288 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 80.15% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Telangana | Hyderabad | 39,43,323 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 83.25% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Telangana | Bhadradri Kothagudem | 10,69,261 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 66.4% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Andhra Pradesh | Visakhapatnam | 42,90,589 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 66.91% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Andhra Pradesh | Vizianagaram | 23,44,474 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 58.89% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Gujarat | Ahmedabad | 72,14,225 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 85.31% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Gujarat | Dahod | 21,27,086 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 58.82% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Gujarat | Narmada | 5,90,297 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 72.31% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Karnataka | Bengaluru Urban | 96,21,551 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 87.67% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Karnataka | Raichur | 19,28,812 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 59.56% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Karnataka | Yadgir | 11,74,271 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 51.83% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Kerala | Thiruvananthapuram | 33,01,427 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 93.02% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Kerala | Wayanad | 8,17,420 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 89.03% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Punjab | Amritsar | 24,90,656 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 76.27% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Punjab | Firozpur | 20,29,074 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 68.92% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Haryana | Gurugram | 15,14,432 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 84.7% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Haryana | Nuh | 10,89,263 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 54.08% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttarakhand | Dehradun | 16,96,694 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 84.25% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Uttarakhand | Haridwar | 18,90,422 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 73.43% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Himachal Pradesh | Shimla | 8,14,010 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 83.64% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Himachal Pradesh | Chamba | 5,19,080 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 72.17% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Jharkhand | Ranchi | 29,14,253 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 76.06% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Jharkhand | Dumka | 13,21,442 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 61.02% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Assam | Kamrup Metropolitan | 12,53,938 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 88.71% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Assam | Baksa | 9,50,075 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 69.25% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Assam | Darrang | 9,28,500 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 63.08% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Odisha | Khordha | 22,51,673 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 86.88% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Odisha | Koraput | 13,79,647 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 49.21% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Odisha | Kalahandi | 15,76,869 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 59.22% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Odisha | Nabarangpur | 12,20,946 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 46.43% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Chhattisgarh | Bastar | 8,34,375 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 53.15% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |
| Chhattisgarh | Bijapur | 2,55,230 | Primary Census Abstract (PCA), Table A-1 (Census 2011) | 40.86% | Primary Census Abstract (PCA), Table A-5 (Census 2011) | no |

---
*Log produced automatically by `npm run import:nfhs5` (`scripts/import-nfhs5.ts`).*
