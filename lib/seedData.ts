import { Firestore, collection, addDoc } from "firebase/firestore";
import { Submission } from "./types";

interface DistrictInfo {
  district: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
}

const INDIAN_DISTRICT_COORDS: Record<string, DistrictInfo> = {
  Patna: { district: "Patna", state: "Bihar", country: "India", lat: 25.5941, lng: 85.1376 },
  Jaipur: { district: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
  Bhopal: { district: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lng: 77.4126 },
  Lucknow: { district: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lng: 80.9462 },
  Kolkata: { district: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639 },
  Mumbai: { district: "Mumbai", state: "Maharashtra", country: "India", lat: 19.076, lng: 72.8777 },
  Chennai: { district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
  Hyderabad: { district: "Hyderabad", state: "Telangana", country: "India", lat: 17.385, lng: 78.4867 },
  Pune: { district: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { district: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lng: 72.5714 },
};

const BRICS_LOCATIONS: DistrictInfo[] = [
  // 3 Brazil
  { district: "São Paulo", state: "SP", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { district: "São Paulo", state: "SP", country: "Brazil", lat: -23.5615, lng: -46.6559 },
  { district: "Rio de Janeiro", state: "RJ", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  // 3 South Africa
  { district: "Johannesburg", state: "Gauteng", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { district: "Johannesburg", state: "Gauteng", country: "South Africa", lat: -26.1952, lng: 28.034 },
  { district: "Cape Town", state: "Western Cape", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  // 2 Russia
  { district: "Moscow", state: "Central", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { district: "Moscow", state: "Central", country: "Russia", lat: 55.7601, lng: 37.625 },
  // 2 China
  { district: "Beijing", state: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { district: "Beijing", state: "Beijing", country: "China", lat: 39.9289, lng: 116.3883 },
];

function getRandomDateInLast30Days(): Date {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  return new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo));
}

// Generate high-density dramatic Indian demo submissions
export function generateIndianSubmissions(): Submission[] {
  const list: Submission[] = [];
  let idCounter = 101;

  // -------------------------------------------------------------
  // CLUSTER 1: PATNA ROAD CRISIS HOTSPOT (15 complaints, Urgency 4-5)
  // Makes heatmap glow intense red over Patna
  // -------------------------------------------------------------
  const patnaLoc = INDIAN_DISTRICT_COORDS.Patna;
  const PATNA_ROAD_TEXTS = [
    "Massive 4-foot crater on Bailey Road near Secretariat causing continuous gridlock and 3 major scooter accidents yesterday.",
    "Unfinished flyover pillars on Ashok Rajpath left with exposed rusted rebar blocking ambulance transit to PMCH.",
    "Boring Road junction completely washed out after rain, deep submerged potholes throwing motorists off bikes.",
    "Kankarbagh main commercial avenue asphalt peeled off entirely, heavy loose gravel skidding two-wheelers.",
    "Open unbarricaded trench dug for drainage across Saguna More intersection causing severe bottlenecks.",
    "Sunken manhole frame in fast lane of New Bypass Road damaging vehicle axles daily.",
    "Cracked road divider bricks scattered across Fraser Road creating extreme nighttime hazards.",
    "Waterlogged underpass on Mithapur flyover link road impassable for school buses during morning hours.",
    "Heavy transport trucks destroyed local service road in Digha, dust pollution suffocating local shops.",
    "Pedestrian zebra crossing faded and signal broken outside St. Michael's School on Danapur Road.",
    "Deep cave-in on Exhibition Road near commercial bank; barricaded with only a tree branch.",
    "Bridge expansion joint gap on Mahatma Gandhi Setu feeder road widening dangerously under heavy traffic.",
    "Severe asphalt subsidence in front of Patna Junction railway station south gate.",
    "Paved footpath completely encroached and demolished by uncoordinated utility trenching on Boring Canal Road.",
    "Dangerous blind curve on Phulwari Sharif link road missing crash barriers and streetlights.",
  ];

  PATNA_ROAD_TEXTS.forEach((text, i) => {
    const latOffset = (Math.random() - 0.5) * 0.025;
    const lngOffset = (Math.random() - 0.5) * 0.025;
    list.push({
      id: `seed-in-${idCounter++}`,
      text,
      language: "Hindi / English",
      category: "roads",
      urgency: (i % 3 === 0 ? 5 : 4) as 4 | 5,
      summary_english: text.slice(0, 130),
      district: patnaLoc.district,
      state: patnaLoc.state,
      country: patnaLoc.country,
      lat: Number((patnaLoc.lat + latOffset).toFixed(5)),
      lng: Number((patnaLoc.lng + lngOffset).toFixed(5)),
      created_at: getRandomDateInLast30Days(),
      status: "classified",
    });
  });

  // -------------------------------------------------------------
  // CLUSTER 2: JAIPUR WATER CRISIS HOTSPOT (10 complaints, Urgency 5)
  // Critical acute water deprivation cluster
  // -------------------------------------------------------------
  const jaipurLoc = INDIAN_DISTRICT_COORDS.Jaipur;
  const JAIPUR_WATER_TEXTS = [
    "No water supply for 5 days. Children are suffering and community schools cannot operate.",
    "Borewell dried up. Village of 500 families affected with zero alternative supply for a week.",
    "Water pipeline burst near civil hospital, zero drinking water for 72 hours in Sanganer ward.",
    "Tanker mafia charging 2000 rupees for untreated saline water in Mansarovar slum cluster.",
    "Contaminated brownish sewage water mixing with household tap lines causing 14 cases of jaundice.",
    "Primary healthcare dispensary closed due to acute water shortage and dehydration among patients.",
    "No municipal tanker sent despite 14 urgent requests to Public Health Engineering Department.",
    "Elderly women walking 4 km in 43°C extreme heat to fetch untreated brackish well water in Amer.",
    "District hospital emergency dialysis unit at critical risk due to total municipal pipeline failure.",
    "Groundwater level collapsed entirely; public handpumps in Malviya Nagar pumping only red mud.",
  ];

  JAIPUR_WATER_TEXTS.forEach((text, i) => {
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;
    list.push({
      id: `seed-in-${idCounter++}`,
      text,
      language: "Hindi / Marwari",
      category: "water",
      urgency: 5,
      summary_english: text.slice(0, 130),
      district: jaipurLoc.district,
      state: jaipurLoc.state,
      country: jaipurLoc.country,
      lat: Number((jaipurLoc.lat + latOffset).toFixed(5)),
      lng: Number((jaipurLoc.lng + lngOffset).toFixed(5)),
      created_at: getRandomDateInLast30Days(),
      status: "prioritized",
    });
  });

  // -------------------------------------------------------------
  // CLUSTER 3: BHOPAL ELECTRICITY & POWER CRISIS (8 complaints, Urgency 4-5)
  // Transformer failures and hazardous lines
  // -------------------------------------------------------------
  const bhopalLoc = INDIAN_DISTRICT_COORDS.Bhopal;
  const BHOPAL_POWER_TEXTS = [
    "High-tension 11kV power line snapped and sagging 4 feet above children's public park in Kolar Road.",
    "Main neighborhood 250kVA transformer exploded; 48-hour continuous total blackout in Arera Colony.",
    "Overloaded distribution box sparking continuously above wooden market stalls in MP Nagar.",
    "Frequent voltage spikes up to 320V blew out home appliances and water pump motors across 3 blocks.",
    "Community health center vaccine refrigerators lost power; emergency backup diesel generator failed.",
    "Non-functional street lighting for 3 km on Hoshangabad highway resulting in repeated vehicle collisions.",
    "Exposed live underground power cable left uncovered in puddle near government primary school.",
    "Continuous power outage for 36 hours during extreme heatwave in Bairagarh residential ward.",
  ];

  BHOPAL_POWER_TEXTS.forEach((text, i) => {
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;
    list.push({
      id: `seed-in-${idCounter++}`,
      text,
      language: "Hindi",
      category: "electricity",
      urgency: (i % 2 === 0 ? 5 : 4) as 4 | 5,
      summary_english: text.slice(0, 130),
      district: bhopalLoc.district,
      state: bhopalLoc.state,
      country: bhopalLoc.country,
      lat: Number((bhopalLoc.lat + latOffset).toFixed(5)),
      lng: Number((bhopalLoc.lng + lngOffset).toFixed(5)),
      created_at: getRandomDateInLast30Days(),
      status: "classified",
    });
  });

  // -------------------------------------------------------------
  // REMAINING SPREAD: LUCKNOW, KOLKATA, MUMBAI, CHENNAI, HYDERABAD, PUNE, AHMEDABAD (17 complaints)
  // Covers Sanitation, Health, Education, Roads, Other
  // -------------------------------------------------------------
  const DIVERSE_SPREAD: {
    districtKey: keyof typeof INDIAN_DISTRICT_COORDS;
    category: Submission["category"];
    urgency: 1 | 2 | 3 | 4 | 5;
    text: string;
    lang: string;
  }[] = [
    {
      districtKey: "Lucknow",
      category: "sanitation",
      urgency: 4,
      text: "Open municipal sewage drain overflowing into vegetable market on Gomti Nagar link road.",
      lang: "Hindi",
    },
    {
      districtKey: "Lucknow",
      category: "health",
      urgency: 4,
      text: "Primary health clinic closed due to lack of anti-rabies vaccine and basic dressing gauze.",
      lang: "Hindi",
    },
    {
      districtKey: "Kolkata",
      category: "sanitation",
      urgency: 5,
      text: "Stormwater canal choked solid with industrial plastic debris causing toxic blackwater backflow into homes.",
      lang: "Bengali",
    },
    {
      districtKey: "Kolkata",
      category: "roads",
      urgency: 3,
      text: "Tram track crossing surface broken on MG Road causing dangerous bicycle tire entrapment.",
      lang: "Bengali",
    },
    {
      districtKey: "Mumbai",
      category: "sanitation",
      urgency: 4,
      text: "Dharavi public toilet block sewer connection broken, raw waste discharging near railway tracks.",
      lang: "Marathi",
    },
    {
      districtKey: "Mumbai",
      category: "roads",
      urgency: 4,
      text: "Western Express Highway flyover pothole cluster causing 45-minute ambulance delays to Lilavati Hospital.",
      lang: "Marathi / English",
    },
    {
      districtKey: "Chennai",
      category: "water",
      urgency: 4,
      text: "Seawater intrusion contaminated municipal groundwater wells in Velachery after drainage breach.",
      lang: "Tamil",
    },
    {
      districtKey: "Chennai",
      category: "education",
      urgency: 3,
      text: "Government higher secondary school perimeter wall collapsed during heavy north-east monsoon rain.",
      lang: "Tamil",
    },
    {
      districtKey: "Hyderabad",
      category: "health",
      urgency: 5,
      text: "Stagnant drainage lake near Musi river causing localized dengue cluster with 28 hospitalized children.",
      lang: "Telugu",
    },
    {
      districtKey: "Hyderabad",
      category: "electricity",
      urgency: 3,
      text: "Substation feeder line tripping every 20 minutes in HITEC City peripheral worker colony.",
      lang: "Telugu",
    },
    {
      districtKey: "Pune",
      category: "education",
      urgency: 4,
      text: "Zilla Parishad school building ceiling plaster falling in classrooms; unsafe for 180 primary students.",
      lang: "Marathi",
    },
    {
      districtKey: "Pune",
      category: "roads",
      urgency: 3,
      text: "Khadki railway underpass flooded with 3 feet of water during moderate rainfall.",
      lang: "Marathi",
    },
    {
      districtKey: "Ahmedabad",
      category: "sanitation",
      urgency: 4,
      text: "Hazardous chemical dye effluent discharged openly into Sabarmati river stormwater culvert.",
      lang: "Gujarati",
    },
    {
      districtKey: "Ahmedabad",
      category: "health",
      urgency: 3,
      text: "Municipal maternity center lacks portable sonography equipment and trained night nursing staff.",
      lang: "Gujarati",
    },
    {
      districtKey: "Lucknow",
      category: "other",
      urgency: 2,
      text: "Historic botanical garden public walking track damaged by fallen branches after squall.",
      lang: "Hindi",
    },
    {
      districtKey: "Kolkata",
      category: "other",
      urgency: 2,
      text: "Public library community reading room roof leaking during monsoon showers.",
      lang: "Bengali",
    },
    {
      districtKey: "Chennai",
      category: "other",
      urgency: 3,
      text: "Street name signage completely missing across newly formed municipal ward 142.",
      lang: "Tamil",
    },
  ];

  DIVERSE_SPREAD.forEach((item) => {
    const loc = INDIAN_DISTRICT_COORDS[item.districtKey];
    const latOffset = (Math.random() - 0.5) * 0.03;
    const lngOffset = (Math.random() - 0.5) * 0.03;
    list.push({
      id: `seed-in-${idCounter++}`,
      text: item.text,
      language: item.lang,
      category: item.category,
      urgency: item.urgency,
      summary_english: item.text.slice(0, 130),
      district: loc.district,
      state: loc.state,
      country: loc.country,
      lat: Number((loc.lat + latOffset).toFixed(5)),
      lng: Number((loc.lng + lngOffset).toFixed(5)),
      created_at: getRandomDateInLast30Days(),
      status: "classified",
    });
  });

  return list;
}

// Generate the 10 BRICS submissions
export function generateBricsSubmissions(): Submission[] {
  const bricsData: {
    loc: DistrictInfo;
    text: string;
    category: Submission["category"];
    urgency: 1 | 2 | 3 | 4 | 5;
    summary: string;
    lang: string;
  }[] = [
    // 3 Brazil
    {
      loc: BRICS_LOCATIONS[0],
      text: "Buraco enorme e sem sinalização na Avenida Paulista causando acidentes graves de motos e carros.",
      category: "roads",
      urgency: 4,
      summary: "Large unmarked pothole on Paulista Avenue causing vehicular and motorcycle accidents.",
      lang: "Portuguese (Português)",
    },
    {
      loc: BRICS_LOCATIONS[1],
      text: "Falta de abastecimento de água potável no bairro periférico há mais de quatro dias consecutivos.",
      category: "water",
      urgency: 5,
      summary: "No clean drinking water supply in peripheral neighborhood for four consecutive days.",
      lang: "Portuguese (Português)",
    },
    {
      loc: BRICS_LOCATIONS[2],
      text: "Bueiro entupido e esgoto a céu aberto vazando diretamente na calçada em frente à escola pública.",
      category: "sanitation",
      urgency: 4,
      summary: "Clogged storm drain and open sewage leaking in front of public primary school.",
      lang: "Portuguese (Português)",
    },
    // 3 South Africa
    {
      loc: BRICS_LOCATIONS[3],
      text: "Loadshedding damaged municipal transformer leaving community clinic without backup refrigeration.",
      category: "electricity",
      urgency: 5,
      summary: "Blown power transformer leaves local health clinic without vaccine refrigeration.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[4],
      text: "Severely corroded water main pipe leaking high pressure clean water into storm stormwater drains.",
      category: "water",
      urgency: 3,
      summary: "Severe municipal pipeline corrosion leaking high volume potable water.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[5],
      text: "Deep road potholes on township arterial road damaging minibus taxis during morning commuter rush.",
      category: "roads",
      urgency: 4,
      summary: "Severe potholes damaging public transport minibus taxis on main commuter route.",
      lang: "English / Zulu",
    },
    // 2 Russia
    {
      loc: BRICS_LOCATIONS[6],
      text: "Прорыв трубы центрального отопления в жилом квартале; нет горячей воды и тепла при температуре -15°C.",
      category: "water",
      urgency: 5,
      summary: "District heating pipeline burst leaving residential block without heat during -15°C winter.",
      lang: "Russian (Русский)",
    },
    {
      loc: BRICS_LOCATIONS[7],
      text: "Глубокие ямы на дорожном покрытии МКАД после таяния снега повреждают подвеску автомобилей.",
      category: "roads",
      urgency: 4,
      summary: "Post-winter thaw potholes on outer ring road damaging automotive suspensions.",
      lang: "Russian (Русский)",
    },
    // 2 China
    {
      loc: BRICS_LOCATIONS[8],
      text: "小区主供水管道爆裂，导致三栋居民楼停水超过36小时，急需抢修。",
      category: "water",
      urgency: 5,
      summary: "Residential water main rupture cutting supply to 3 apartment buildings for over 36 hours.",
      lang: "Chinese (中文)",
    },
    {
      loc: BRICS_LOCATIONS[9],
      text: "商业街地下电力电缆老化频繁短路跳闸，商户无法正常营业。",
      category: "electricity",
      urgency: 4,
      summary: "Aging underground electrical cables tripping power to local commercial street merchants.",
      lang: "Chinese (中文)",
    },
  ];

  let idCounter = 201;

  return bricsData.map((item) => {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    return {
      id: `seed-brics-${idCounter++}`,
      text: item.text,
      language: item.lang,
      category: item.category,
      urgency: item.urgency,
      summary_english: item.summary,
      district: item.loc.district,
      state: item.loc.state,
      country: item.loc.country,
      lat: Number((item.loc.lat + latOffset).toFixed(5)),
      lng: Number((item.loc.lng + lngOffset).toFixed(5)),
      created_at: getRandomDateInLast30Days(),
      status: "classified",
    };
  });
}

// 60 total combined seed items
export const ALL_SEED_SUBMISSIONS: Submission[] = [
  ...generateIndianSubmissions(),
  ...generateBricsSubmissions(),
];

// Seed function for Firestore database
export async function seedDatabase(db: Firestore): Promise<{ count: number }> {
  try {
    const submissionsCol = collection(db, "submissions");
    const all = ALL_SEED_SUBMISSIONS;
    let addedCount = 0;

    for (const sub of all) {
      const { id, ...dataToSave } = sub;
      await addDoc(submissionsCol, {
        ...dataToSave,
        created_at: dataToSave.created_at || new Date(),
      });
      addedCount++;
    }

    return { count: addedCount };
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
    throw error;
  }
}
