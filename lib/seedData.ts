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
  // Brazil — 3 cities
  { district: "São Paulo", state: "SP", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { district: "Rio de Janeiro", state: "RJ", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { district: "Salvador", state: "BA", country: "Brazil", lat: -12.9714, lng: -38.5014 },
  
  // South Africa — 3 cities
  { district: "Johannesburg", state: "Gauteng", country: "South Africa", lat: -26.2041, lng: 28.0473 },
  { district: "Cape Town", state: "Western Cape", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { district: "Durban", state: "KwaZulu-Natal", country: "South Africa", lat: -29.8587, lng: 31.0218 },
  
  // Russia — 2 cities
  { district: "Moscow", state: "Central", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { district: "Saint Petersburg", state: "Northwest", country: "Russia", lat: 59.9311, lng: 30.3609 },
  
  // China — 2 cities
  { district: "Beijing", state: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
  { district: "Shanghai", state: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737 },
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

// Generate the 20 expanded BRICS submissions across all 10 locations (2 per city)
export function generateBricsSubmissions(): Submission[] {
  const bricsData: {
    loc: DistrictInfo;
    text: string;
    category: Submission["category"];
    urgency: 1 | 2 | 3 | 4 | 5;
    summary: string;
    lang: string;
  }[] = [
    // -------------------------------------------------------------
    // BRAZIL — São Paulo (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[0], // São Paulo
      text: "Buraco enorme e sem sinalização na Avenida Paulista causando acidentes graves de motos e carros.",
      category: "roads",
      urgency: 4,
      summary: "Large unmarked pothole on Paulista Avenue causing vehicular and motorcycle accidents.",
      lang: "Portuguese (Português)",
    },
    {
      loc: BRICS_LOCATIONS[0], // São Paulo
      text: "Falta de abastecimento de água potável no bairro periférico da Zona Leste há mais de quatro dias consecutivos.",
      category: "water",
      urgency: 4,
      summary: "Drinking water supply cut off in East Zone peripheral neighborhoods for 4 consecutive days.",
      lang: "Portuguese (Português)",
    },

    // -------------------------------------------------------------
    // BRAZIL — Rio de Janeiro (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[1], // Rio de Janeiro
      text: "Bueiro entupido e esgoto a céu aberto vazando diretamente na calçada em frente à escola municipal.",
      category: "sanitation",
      urgency: 4,
      summary: "Clogged storm drain and open sewage leaking directly in front of municipal school.",
      lang: "Portuguese (Português)",
    },
    {
      loc: BRICS_LOCATIONS[1], // Rio de Janeiro
      text: "Postes de iluminação pública apagados há duas semanas no túnel principal, facilitando assaltos.",
      category: "electricity",
      urgency: 3,
      summary: "Public lighting out in main tunnel for two weeks, creating severe safety risks.",
      lang: "Portuguese (Português)",
    },

    // -------------------------------------------------------------
    // BRAZIL — Salvador (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[2], // Salvador
      text: "Alagamento severo e bueiros rompidos na Avenida ACM após fortes chuvas bloqueando o tráfego e invadindo comércios.",
      category: "sanitation",
      urgency: 4,
      summary: "Severe flooding and collapsed drainage culvert on ACM Avenue blocking traffic and flooding shops.",
      lang: "Portuguese (Português)",
    },
    {
      loc: BRICS_LOCATIONS[2], // Salvador
      text: "Risco iminente de deslizamento de terra em encosta habitada sem contenção após temporal no Subúrbio Ferroviário.",
      category: "roads",
      urgency: 4,
      summary: "Imminent landslide risk and crumbling hillside infrastructure in Railway Suburbs without municipal retaining wall.",
      lang: "Portuguese (Português)",
    },

    // -------------------------------------------------------------
    // SOUTH AFRICA — Johannesburg (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[3], // Johannesburg
      text: "Loadshedding damaged municipal transformer leaving community health clinic without vaccine cold-chain refrigeration.",
      category: "electricity",
      urgency: 5,
      summary: "Blown power transformer leaves local health clinic without backup vaccine cold storage.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[3], // Johannesburg
      text: "Deep road potholes on Soweto arterial expressway damaging minibus commuter taxis daily.",
      category: "roads",
      urgency: 4,
      summary: "Severe potholes damaging public transport minibus taxis on main commuter route.",
      lang: "English / Zulu",
    },

    // -------------------------------------------------------------
    // SOUTH AFRICA — Cape Town (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[4], // Cape Town
      text: "Severely corroded water main pipe leaking high pressure clean treated water into coastal storm drains.",
      category: "water",
      urgency: 3,
      summary: "Corroded municipal water main discharging massive volumes of treated potable water.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[4], // Cape Town
      text: "Informal settlement sanitation chemical toilets unserviced for 10 days, posing extreme cholera risk.",
      category: "sanitation",
      urgency: 4,
      summary: "Unserviced municipal chemical toilets in informal settlement creating acute health hazards.",
      lang: "English / Xhosa",
    },

    // -------------------------------------------------------------
    // SOUTH AFRICA — Durban (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[5], // Durban
      text: "Critical municipal water supply shortage in Durban North; residential taps completely dry for 5 days with no relief tankers.",
      category: "water",
      urgency: 4,
      summary: "Critical water supply shortage in Durban North; residential taps dry for 5 consecutive days without relief tankers.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[5], // Durban
      text: "Collapsed stormwater canal near Bayhead logistics corridor causing heavy container freight bottlenecks.",
      category: "roads",
      urgency: 3,
      summary: "Collapsed stormwater culvert on port logistics corridor causing heavy freight congestion.",
      lang: "English / Zulu",
    },

    // -------------------------------------------------------------
    // RUSSIA — Moscow (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[6], // Moscow
      text: "Прорыв трубы центрального отопления в жилом квартале; нет горячей воды и тепла при температуре -15°C.",
      category: "water",
      urgency: 5,
      summary: "District heating pipeline burst leaving residential block without heat during -15°C winter.",
      lang: "Russian (Русский)",
    },
    {
      loc: BRICS_LOCATIONS[6], // Moscow
      text: "Глубокие ямы на дорожном покрытии внешней стороны МКАД после таяния снега повреждают колесные диски.",
      category: "roads",
      urgency: 4,
      summary: "Post-winter thaw potholes on outer ring road damaging automotive wheels and suspensions.",
      lang: "Russian (Русский)",
    },

    // -------------------------------------------------------------
    // RUSSIA — Saint Petersburg (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[7], // Saint Petersburg
      text: "Глубокие выбоины и трещины асфальта на основных магистралях после зимних заморозков разрушают общественный транспорт.",
      category: "roads",
      urgency: 4,
      summary: "Post-winter road damage, asphalt cracking, and deep potholes disrupting transit buses on main avenues.",
      lang: "Russian (Русский)",
    },
    {
      loc: BRICS_LOCATIONS[7], // Saint Petersburg
      text: "Аварийное состояние силового кабеля и искрение распределительного щита в жилом доме старого фонда.",
      category: "electricity",
      urgency: 3,
      summary: "Damaged high-voltage power feed and sparking distribution cabinet in historic residential block.",
      lang: "Russian (Русский)",
    },

    // -------------------------------------------------------------
    // CHINA — Beijing (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[8], // Beijing
      text: "朝阳区老旧小区主供水管道爆裂，导致三栋居民楼停水超过36小时，急需抢修。",
      category: "water",
      urgency: 5,
      summary: "Residential water main rupture cutting supply to 3 apartment buildings in Chaoyang for over 36 hours.",
      lang: "Chinese (中文)",
    },
    {
      loc: BRICS_LOCATIONS[8], // Beijing
      text: "商业步行街地下电力电缆老化频繁短路跳闸，商户冷柜停机造成经济损失。",
      category: "electricity",
      urgency: 4,
      summary: "Aging underground electrical cables tripping power to local commercial street merchants.",
      lang: "Chinese (中文)",
    },

    // -------------------------------------------------------------
    // CHINA — Shanghai (2 items)
    // -------------------------------------------------------------
    {
      loc: BRICS_LOCATIONS[9], // Shanghai
      text: "浦东新区工业园周边电网负荷过载频繁跳闸，导致多家制造企业车间断电停产。",
      category: "electricity",
      urgency: 4,
      summary: "Power grid overload and repeated transformer trips in Pudong industrial zone stalling manufacturing plants.",
      lang: "Chinese (中文)",
    },
    {
      loc: BRICS_LOCATIONS[9], // Shanghai
      text: "暴雨后地铁站接驳干道路面积水严重，下水管网反水导致非机动车道无法通行。",
      category: "sanitation",
      urgency: 3,
      summary: "Severe road waterlogging and drainage backflow near metro transit hub blocking bicycle and pedestrian lanes.",
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

// 70 total combined seed items (50 Indian + 20 BRICS)
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
