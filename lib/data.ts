import { Submission, PriorityRecommendation, BRICSCountry } from "./types";
import { ALL_SEED_SUBMISSIONS } from "./seedData";

export const BRICS_COUNTRIES: BRICSCountry[] = [
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    defaultCoords: { lat: 28.6139, lng: 77.2090 },
    sampleDistricts: [
      { state: "Maharashtra", districts: ["Mumbai Suburban", "Pune", "Nagpur", "Thane"] },
      { state: "Delhi NCT", districts: ["Central Delhi", "South Delhi", "North Delhi", "East Delhi"] },
      { state: "Karnataka", districts: ["Bengaluru Urban", "Mysuru", "Dharwad"] },
      { state: "Uttar Pradesh", districts: ["Lucknow", "Varanasi", "Kanpur Nagar", "Agra"] },
      { state: "Tamil Nadu", districts: ["Chennai", "Coimbatore", "Madurai"] }
    ]
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    defaultCoords: { lat: -23.5505, lng: -46.6333 },
    sampleDistricts: [
      { state: "São Paulo", districts: ["Zona Leste", "Zona Sul", "Centro", "Campinas"] },
      { state: "Rio de Janeiro", districts: ["Zona Norte", "Baixada Fluminense", "Niterói"] },
      { state: "Minas Gerais", districts: ["Belo Horizonte", "Uberlândia", "Contagem"] }
    ]
  },
  {
    code: "ZA",
    name: "South Africa",
    flag: "🇿🇦",
    defaultCoords: { lat: -26.2041, lng: 28.0473 },
    sampleDistricts: [
      { state: "Gauteng", districts: ["Johannesburg Central", "Soweto", "Tshwane/Pretoria", "Ekurhuleni"] },
      { state: "Western Cape", districts: ["City of Cape Town", "Khayelitsha", "Mitchells Plain"] },
      { state: "KwaZulu-Natal", districts: ["eThekwini/Durban", "Pietermaritzburg"] }
    ]
  },
  {
    code: "RU",
    name: "Russia",
    flag: "🇷🇺",
    defaultCoords: { lat: 55.7558, lng: 37.6173 },
    sampleDistricts: [
      { state: "Moscow Federal City", districts: ["Central Administrative Okrug", "Northern Okrug", "South-Eastern Okrug"] },
      { state: "Saint Petersburg", districts: ["Nevsky District", "Vasileostrovsky District", "Vyborgsky District"] },
      { state: "Sverdlovsk Oblast", districts: ["Yekaterinburg Central", "Ordzhonikidzevsky"] }
    ]
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    defaultCoords: { lat: 39.9042, lng: 116.4074 },
    sampleDistricts: [
      { state: "Beijing", districts: ["Chaoyang", "Haidian", "Dongcheng", "Fengtai"] },
      { state: "Shanghai", districts: ["Pudong New Area", "Huangpu", "Minhang", "Xuhui"] },
      { state: "Guangdong", districts: ["Tianhe (Guangzhou)", "Nanshan (Shenzhen)", "Bao'an"] }
    ]
  }
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  ...ALL_SEED_SUBMISSIONS,
  {
    id: "sub-101",
    text: "मुख्य सड़क पर गहरा गड्ढा है, बारिश का पानी भर जाने से कई बाइक वाले गिर चुके हैं। तत्काल मरम्मत चाहिए।",
    language: "Hindi (हिंदी)",
    category: "roads",
    urgency: 5,
    summary_english: "Deep hazardous pothole on main arterial road filled with rainwater causing frequent two-wheeler accidents. Urgent repair required.",
    district: "Mumbai Suburban",
    state: "Maharashtra",
    country: "India",
    lat: 19.0760,
    lng: 72.8777,
    created_at: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    status: "priority"
  },
  {
    id: "sub-102",
    text: "Há 4 dias sem abastecimento de água tratada na comunidade. O hospital local está dependendo de caminhão-pipa.",
    language: "Portuguese (Português)",
    category: "water",
    urgency: 5,
    summary_english: "No treated water supply for 4 consecutive days in the community. The local health clinic is forced to rely on emergency water tankers.",
    district: "Zona Leste",
    state: "São Paulo",
    country: "Brazil",
    lat: -23.5350,
    lng: -46.5100,
    created_at: new Date(Date.now() - 1000 * 60 * 120),
    status: "priority"
  },
  {
    id: "sub-103",
    text: "Frequent transformer sparks and load shedding in Sector 4 during peak evening hours, creating fire hazard near the market.",
    language: "English",
    category: "electricity",
    urgency: 4,
    summary_english: "Severe voltage fluctuation and transformer sparking near central market area posing immediate fire risk.",
    district: "Johannesburg Central",
    state: "Gauteng",
    country: "South Africa",
    lat: -26.2041,
    lng: 28.0473,
    created_at: new Date(Date.now() - 1000 * 60 * 240),
    status: "classified"
  },
  {
    id: "sub-104",
    text: "Прорыв канализационной трубы возле начальной школы №14. Сточные воды заливают пешеходную зону.",
    language: "Russian (Русский)",
    category: "sanitation",
    urgency: 4,
    summary_english: "Sewage pipe burst directly adjacent to primary school #14, causing toxic wastewater runoff across public pedestrian pathways.",
    district: "Central Administrative Okrug",
    state: "Moscow Federal City",
    country: "Russia",
    lat: 55.7512,
    lng: 37.6184,
    created_at: new Date(Date.now() - 1000 * 60 * 360),
    status: "classified"
  },
  {
    id: "sub-105",
    text: "社区中心路段路灯连续两周瘫痪，夜间发生多起行人摔倒，老年人出行安全受到威胁。",
    language: "Mandarin (中文)",
    category: "electricity",
    urgency: 3,
    summary_english: "Streetlights dysfunctional for two straight weeks around community center, compromising night pedestrian safety for senior citizens.",
    district: "Chaoyang",
    state: "Beijing",
    country: "China",
    lat: 39.9219,
    lng: 116.4436,
    created_at: new Date(Date.now() - 1000 * 60 * 520),
    status: "pending"
  },
  {
    id: "sub-106",
    text: "गंदा बदबूदार पानी नल में आ रहा है, बस्ती में 15 बच्चे बीमार पड़ चुके हैं। तुरंत पानी की जांच कराएं।",
    language: "Hindi (हिंदी)",
    category: "water",
    urgency: 5,
    summary_english: "Severely contaminated tap water supplied to residential cluster; at least 15 children reported gastrointestinal illness. Immediate bacteriological testing required.",
    district: "Lucknow",
    state: "Uttar Pradesh",
    country: "India",
    lat: 26.8467,
    lng: 80.9462,
    created_at: new Date(Date.now() - 1000 * 60 * 60),
    status: "priority"
  },
  {
    id: "sub-107",
    text: "Hospital regional sem gerador reserva funcionando durante quedas constantes de energia nesta semana de tempestade.",
    language: "Portuguese (Português)",
    category: "health",
    urgency: 5,
    summary_english: "Regional hospital backup generator failure amidst recurring storm power cuts, posing acute threat to ICU patients.",
    district: "Baixada Fluminense",
    state: "Rio de Janeiro",
    country: "Brazil",
    lat: -22.7556,
    lng: -43.4603,
    created_at: new Date(Date.now() - 1000 * 60 * 700),
    status: "priority"
  },
  {
    id: "sub-108",
    text: "Uncollected municipal waste accumulating for over 10 days outside secondary school, attracting pests and creating public health hazard.",
    language: "English",
    category: "sanitation",
    urgency: 4,
    summary_english: "Critical accumulation of uncollected municipal solid waste adjacent to secondary school grounds over 10 days.",
    district: "Khayelitsha",
    state: "Western Cape",
    country: "South Africa",
    lat: -34.0381,
    lng: 18.6750,
    created_at: new Date(Date.now() - 1000 * 60 * 850),
    status: "classified"
  }
];

/**
 * Derives aggregated priority recommendations from active submissions
 */
export function generatePriorityRecommendations(submissions: Submission[]): PriorityRecommendation[] {
  // Group submissions by category + district
  const groupMap = new Map<string, {
    category: string;
    district: string;
    items: Submission[];
  }>();

  submissions.forEach((item) => {
    const key = `${item.category}__${item.district}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        category: item.category,
        district: item.district,
        items: []
      });
    }
    groupMap.get(key)!.items.push(item);
  });

  const rawRecs = Array.from(groupMap.values()).map((group) => {
    const count = group.items.length;
    const avg_urgency = Number(
      (group.items.reduce((acc, curr) => acc + curr.urgency, 0) / count).toFixed(1)
    );
    
    // Estimate population affected based on urgency & count
    const estimated_population_affected = count * 8500 * (avg_urgency >= 4 ? 2.5 : 1.2);

    let ai_rationale = "";
    if (group.category === "water") {
      ai_rationale = `Critical potable water crisis detected in ${group.district}. Clustered citizen reports flag contamination and supply cutoff impacting schools and clinics.`;
    } else if (group.category === "roads") {
      ai_rationale = `Severe traffic disruption & accident risk in ${group.district}. Rain-induced arterial road erosion requires immediate PWD deployment.`;
    } else if (group.category === "electricity") {
      ai_rationale = `Power grid instability and fire hazards reported near public commercial hubs in ${group.district}.`;
    } else if (group.category === "sanitation") {
      ai_rationale = `Public health outbreak risk due to uncontained waste overflow and sewage leakage across dense residential corridors in ${group.district}.`;
    } else if (group.category === "health") {
      ai_rationale = `Critical healthcare infrastructure deficiency reported in ${group.district} needing immediate ministry oversight.`;
    } else {
      ai_rationale = `Multiple high-severity civic distress reports flagged in ${group.district} warranting priority municipal intervention.`;
    }

    // Weight score = (avg_urgency * 2) + count
    const priorityScore = (avg_urgency * 2) + count;

    return {
      category: group.category,
      district: group.district,
      count,
      avg_urgency,
      ai_rationale,
      estimated_population_affected: Math.round(estimated_population_affected),
      priorityScore
    };
  });

  // Sort descending by priority score
  rawRecs.sort((a, b) => b.priorityScore - a.priorityScore);

  return rawRecs.map((rec, idx) => ({
    rank: idx + 1,
    category: rec.category,
    district: rec.district,
    count: rec.count,
    avg_urgency: rec.avg_urgency,
    ai_rationale: rec.ai_rationale,
    estimated_population_affected: rec.estimated_population_affected
  }));
}
