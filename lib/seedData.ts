import { Firestore, collection, addDoc } from "firebase/firestore";
import { Submission } from "./types";

export interface DistrictCoordsInfo {
  district: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  isAspirational?: boolean;
  isRural?: boolean;
}

export const INDIAN_DISTRICT_COORDS: Record<string, DistrictCoordsInfo> = {
  // Bihar (4 districts)
  Patna: { district: "Patna", state: "Bihar", country: "India", lat: 25.5941, lng: 85.1376 },
  Gaya: { district: "Gaya", state: "Bihar", country: "India", lat: 24.7955, lng: 85.0002, isAspirational: true },
  Muzaffarpur: { district: "Muzaffarpur", state: "Bihar", country: "India", lat: 26.1209, lng: 85.3647, isAspirational: true },
  Araria: { district: "Araria", state: "Bihar", country: "India", lat: 26.1500, lng: 87.5200, isAspirational: true, isRural: true },

  // Uttar Pradesh (5 districts)
  Lucknow: { district: "Lucknow", state: "Uttar Pradesh", country: "India", lat: 26.8467, lng: 80.9462 },
  Varanasi: { district: "Varanasi", state: "Uttar Pradesh", country: "India", lat: 25.3176, lng: 82.9739 },
  Bahraich: { district: "Bahraich", state: "Uttar Pradesh", country: "India", lat: 27.5705, lng: 81.5977, isAspirational: true, isRural: true },
  Balrampur: { district: "Balrampur", state: "Uttar Pradesh", country: "India", lat: 27.4300, lng: 82.1800, isAspirational: true, isRural: true },
  Chitrakoot: { district: "Chitrakoot", state: "Uttar Pradesh", country: "India", lat: 25.2000, lng: 80.9000, isAspirational: true, isRural: true },

  // Rajasthan (3 districts)
  Jaipur: { district: "Jaipur", state: "Rajasthan", country: "India", lat: 26.9124, lng: 75.7873 },
  Jaisalmer: { district: "Jaisalmer", state: "Rajasthan", country: "India", lat: 26.9157, lng: 70.9083, isAspirational: true, isRural: true },
  Sirohi: { district: "Sirohi", state: "Rajasthan", country: "India", lat: 24.8826, lng: 72.8624, isAspirational: true },

  // Madhya Pradesh (3 districts)
  Bhopal: { district: "Bhopal", state: "Madhya Pradesh", country: "India", lat: 23.2599, lng: 77.4126 },
  Barwani: { district: "Barwani", state: "Madhya Pradesh", country: "India", lat: 22.0370, lng: 74.9030, isAspirational: true, isRural: true },
  Vidisha: { district: "Vidisha", state: "Madhya Pradesh", country: "India", lat: 23.5251, lng: 77.8081, isAspirational: true },

  // Maharashtra (4 districts)
  Mumbai: { district: "Mumbai", state: "Maharashtra", country: "India", lat: 19.0760, lng: 72.8777 },
  Pune: { district: "Pune", state: "Maharashtra", country: "India", lat: 18.5204, lng: 73.8567 },
  Nagpur: { district: "Nagpur", state: "Maharashtra", country: "India", lat: 21.1458, lng: 79.0882 },
  Gadchiroli: { district: "Gadchiroli", state: "Maharashtra", country: "India", lat: 20.1800, lng: 80.0000, isAspirational: true, isRural: true },

  // West Bengal (3 districts)
  Kolkata: { district: "Kolkata", state: "West Bengal", country: "India", lat: 22.5726, lng: 88.3639 },
  Birbhum: { district: "Birbhum", state: "West Bengal", country: "India", lat: 23.8400, lng: 87.6200, isRural: true },
  Purulia: { district: "Purulia", state: "West Bengal", country: "India", lat: 23.3300, lng: 86.3600, isRural: true },

  // Tamil Nadu (3 districts)
  Chennai: { district: "Chennai", state: "Tamil Nadu", country: "India", lat: 13.0827, lng: 80.2707 },
  Ramanathapuram: { district: "Ramanathapuram", state: "Tamil Nadu", country: "India", lat: 9.3639, lng: 78.8395, isAspirational: true, isRural: true },
  Virudhunagar: { district: "Virudhunagar", state: "Tamil Nadu", country: "India", lat: 9.5680, lng: 77.9624, isAspirational: true },

  // Telangana (2 districts)
  Hyderabad: { district: "Hyderabad", state: "Telangana", country: "India", lat: 17.3850, lng: 78.4867 },
  BhadradriKothagudem: { district: "Bhadradri Kothagudem", state: "Telangana", country: "India", lat: 17.5500, lng: 80.6200, isAspirational: true, isRural: true },

  // Andhra Pradesh (2 districts)
  Visakhapatnam: { district: "Visakhapatnam", state: "Andhra Pradesh", country: "India", lat: 17.6868, lng: 83.2185 },
  Vizianagaram: { district: "Vizianagaram", state: "Andhra Pradesh", country: "India", lat: 18.1067, lng: 83.3956, isAspirational: true },

  // Gujarat (3 districts)
  Ahmedabad: { district: "Ahmedabad", state: "Gujarat", country: "India", lat: 23.0225, lng: 72.5714 },
  Dahod: { district: "Dahod", state: "Gujarat", country: "India", lat: 22.8300, lng: 74.2600, isAspirational: true, isRural: true },
  Narmada: { district: "Narmada", state: "Gujarat", country: "India", lat: 21.8700, lng: 73.5000, isAspirational: true, isRural: true },

  // Karnataka (3 districts)
  BengaluruUrban: { district: "Bengaluru Urban", state: "Karnataka", country: "India", lat: 12.9716, lng: 77.5946 },
  Raichur: { district: "Raichur", state: "Karnataka", country: "India", lat: 16.2076, lng: 77.3463, isAspirational: true, isRural: true },
  Yadgir: { district: "Yadgir", state: "Karnataka", country: "India", lat: 16.7700, lng: 77.1400, isAspirational: true, isRural: true },

  // Kerala (2 districts)
  Thiruvananthapuram: { district: "Thiruvananthapuram", state: "Kerala", country: "India", lat: 8.5241, lng: 76.9366 },
  Wayanad: { district: "Wayanad", state: "Kerala", country: "India", lat: 11.6854, lng: 76.1320, isAspirational: true, isRural: true },

  // Punjab (2 districts)
  Amritsar: { district: "Amritsar", state: "Punjab", country: "India", lat: 31.6340, lng: 74.8723 },
  Firozpur: { district: "Firozpur", state: "Punjab", country: "India", lat: 30.9237, lng: 74.6065, isAspirational: true, isRural: true },

  // Haryana (2 districts)
  Gurugram: { district: "Gurugram", state: "Haryana", country: "India", lat: 28.4595, lng: 77.0266 },
  Nuh: { district: "Nuh", state: "Haryana", country: "India", lat: 28.1100, lng: 77.0000, isAspirational: true, isRural: true },

  // Uttarakhand (2 districts)
  Dehradun: { district: "Dehradun", state: "Uttarakhand", country: "India", lat: 30.3165, lng: 78.0322 },
  Haridwar: { district: "Haridwar", state: "Uttarakhand", country: "India", lat: 29.9457, lng: 78.1642, isAspirational: true },

  // Himachal Pradesh (2 districts)
  Shimla: { district: "Shimla", state: "Himachal Pradesh", country: "India", lat: 31.1048, lng: 77.1734 },
  Chamba: { district: "Chamba", state: "Himachal Pradesh", country: "India", lat: 32.5500, lng: 76.1300, isAspirational: true, isRural: true },

  // Jharkhand (2 districts)
  Ranchi: { district: "Ranchi", state: "Jharkhand", country: "India", lat: 23.3441, lng: 85.3096, isAspirational: true },
  Dumka: { district: "Dumka", state: "Jharkhand", country: "India", lat: 24.2600, lng: 87.2500, isAspirational: true, isRural: true },

  // Assam (3 districts)
  KamrupMetropolitan: { district: "Kamrup Metropolitan", state: "Assam", country: "India", lat: 26.1445, lng: 91.7362 },
  Baksa: { district: "Baksa", state: "Assam", country: "India", lat: 26.6800, lng: 91.4300, isAspirational: true, isRural: true },
  Darrang: { district: "Darrang", state: "Assam", country: "India", lat: 26.4500, lng: 92.0300, isAspirational: true, isRural: true },

  // Odisha (4 districts)
  Khordha: { district: "Khordha", state: "Odisha", country: "India", lat: 20.1900, lng: 85.6200 },
  Koraput: { district: "Koraput", state: "Odisha", country: "India", lat: 18.8135, lng: 82.7118, isAspirational: true, isRural: true },
  Kalahandi: { district: "Kalahandi", state: "Odisha", country: "India", lat: 19.9100, lng: 83.1600, isAspirational: true, isRural: true },
  Nabarangpur: { district: "Nabarangpur", state: "Odisha", country: "India", lat: 19.2300, lng: 82.5500, isAspirational: true, isRural: true },

  // Chhattisgarh (2 districts)
  Bastar: { district: "Bastar", state: "Chhattisgarh", country: "India", lat: 19.0700, lng: 82.0300, isAspirational: true, isRural: true },
  Bijapur: { district: "Bijapur", state: "Chhattisgarh", country: "India", lat: 18.8000, lng: 80.8200, isAspirational: true, isRural: true },
};

export const BRICS_LOCATIONS: DistrictCoordsInfo[] = [
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

interface SeedTemplate {
  loc: DistrictCoordsInfo;
  text: string;
  lang: string;
  category: "roads" | "water" | "electricity" | "sanitation" | "health" | "education";
  urgency: 1 | 2 | 3 | 4 | 5;
  translation: string;
  summary: string;
}

export function generateIndianSubmissions(): Submission[] {
  let idCounter = 101;

  const templates: SeedTemplate[] = [
    // 1. Bihar — Patna (Roads crisis hotspot)
    {
      loc: INDIAN_DISTRICT_COORDS.Patna,
      text: "बेली रोड पर सचिवालय के पास 4 फीट गहरा गड्ढा है, लगातार जाम और कल 3 स्कूटर दुर्घटनाएं हुईं।",
      lang: "Hindi",
      category: "roads",
      urgency: 5,
      translation: "Massive 4-foot pothole on Bailey Road near Secretariat causing continuous gridlock and 3 scooter accidents yesterday.",
      summary: "Severe crater causing road gridlock and accidents near Secretariat.",
    },
    {
      loc: INDIAN_DISTRICT_COORDS.Patna,
      text: "कंकड़बाग मुख्य मार्ग पर डामर पूरी तरह उखड़ गया है, बजरी से दोपहिया वाहन फिसल रहे हैं।",
      lang: "Hindi",
      category: "roads",
      urgency: 4,
      translation: "Asphalt peeled off entirely on Kankarbagh main road; loose gravel causing two-wheelers to skid.",
      summary: "Damaged road surface with loose gravel skidding vehicles.",
    },
    {
      loc: INDIAN_DISTRICT_COORDS.Patna,
      text: "अशोक राजपथ पर फ्लाईओवर का काम अधूरा छूटा है, खुली लोहे की छड़ें एंबुलेंस का रास्ता रोक रही हैं।",
      lang: "Hindi",
      category: "roads",
      urgency: 5,
      translation: "Unfinished flyover pillars on Ashok Rajpath left with exposed rusted rebar blocking ambulances.",
      summary: "Flyover construction debris obstructing hospital transit route.",
    },

    // 2. Bihar — Gaya (Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Gaya,
      text: "बोधगया वार्ड 4 में सार्वजनिक चापाकल 15 दिनों से खराब है, 300 परिवारों को पीने का पानी नहीं मिल रहा।",
      lang: "Hindi",
      category: "water",
      urgency: 4,
      translation: "Public handpump in Bodh Gaya ward 4 broken for 15 days; 300 families left without drinking water.",
      summary: "Broken community handpump leaving 300 families without potable water.",
    },

    // 3. Bihar — Muzaffarpur (Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Muzaffarpur,
      text: "कांटी प्राथमिक स्वास्थ्य केंद्र में डॉक्टर अनुपस्थित हैं और जीवनरक्षक दवाओं का अभाव है।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "Doctors absent and essential lifesaving medicines unavailable at Kanti Primary Health Centre.",
      summary: "Absence of medical staff and drugs at rural primary health centre.",
    },

    // 4. Bihar — Araria (Rural / Aspirational, Roads / Drainage)
    {
      loc: INDIAN_DISTRICT_COORDS.Araria,
      text: "जोकीहाट प्रखंड में पुलिया टूटने से 4 गांवों का संपर्क जिला मुख्यालय से पूरी तरह कट गया है।",
      lang: "Hindi",
      category: "roads",
      urgency: 5,
      translation: "Culvert collapse in Jokihat block completely severing 4 villages from district headquarters.",
      summary: "Bridge culvert collapsed, disconnecting rural villages.",
    },

    // 5. Rajasthan — Jaipur (Water crisis cluster)
    {
      loc: INDIAN_DISTRICT_COORDS.Jaipur,
      text: "सांगानेर क्षेत्र में मुख्य पाइपलाइन फटने से 5 दिनों से पेयजल आपूर्ति ठप है, बच्चे परेशान हैं।",
      lang: "Hindi",
      category: "water",
      urgency: 5,
      translation: "Main pipeline burst in Sanganer cutting drinking water supply for 5 days; children suffering.",
      summary: "Pipeline rupture halting water supply for 5 straight days.",
    },
    {
      loc: INDIAN_DISTRICT_COORDS.Jaipur,
      text: "मानसरोवर में सीवर का गंदा पानी पीने के पानी की लाइन में मिल रहा है, पीलिया फैलने का डर।",
      lang: "Hindi",
      category: "water",
      urgency: 5,
      translation: "Contaminated sewage mixing with household drinking water lines in Mansarovar causing disease risk.",
      summary: "Sewage contamination entering domestic drinking water supply.",
    },

    // 6. Rajasthan — Jaisalmer (Rural / Aspirational, Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Jaisalmer,
      text: "पोकरण के ग्रामीण ढाणी में 11kV की हाई टेंशन तार नीचे लटकी हुई है, ऊंट करंट की चपेट में आने का खतरा है।",
      lang: "Hindi",
      category: "electricity",
      urgency: 5,
      translation: "11kV high tension power wire sagging dangerously close to ground in Pokhran rural hamlet.",
      summary: "Sagging high-voltage transmission wire endangering livestock and villagers.",
    },

    // 7. Rajasthan — Sirohi (Aspirational, Sanitation)
    {
      loc: INDIAN_DISTRICT_COORDS.Sirohi,
      text: "शिवगंज सामुदायिक शौचालय में पानी की आपूर्ति और सफाई न होने से भारी दुर्गंध और गंदगी है।",
      lang: "Hindi",
      category: "sanitation",
      urgency: 3,
      translation: "Lack of water supply and maintenance in Sheoganj community toilet causing extreme filth.",
      summary: "Unmaintained community toilet with severe sanitation hazards.",
    },

    // 8. Madhya Pradesh — Bhopal (Power & Grid)
    {
      loc: INDIAN_DISTRICT_COORDS.Bhopal,
      text: "कोलार रोड पर 250kVA ट्रांसफार्मर में तेज स्पार्किंग हो रही है, आसपास के 120 घरों में 24 घंटे से ब्लैकआउट।",
      lang: "Hindi",
      category: "electricity",
      urgency: 5,
      translation: "250kVA transformer heavily sparking on Kolar Road, leaving 120 homes in blackout for 24 hours.",
      summary: "Sparking distribution transformer causing prolonged neighborhood blackout.",
    },

    // 9. Madhya Pradesh — Barwani (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Barwani,
      text: "पाटी ब्लॉक के उप स्वास्थ्य केंद्र में प्रसूति वार्ड बंद पड़ा है, गर्भवती महिलाओं को 40 किमी दूर जाना पड़ रहा है।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "Maternity ward locked at Pati block sub-health centre; pregnant mothers forced to travel 40 km.",
      summary: "Closed rural maternity facility forcing long emergency transit.",
    },

    // 10. Madhya Pradesh — Vidisha (Aspirational, Education)
    {
      loc: INDIAN_DISTRICT_COORDS.Vidisha,
      text: "बासौदा के शासकीय प्राथमिक विद्यालय की छत से प्लास्टर गिर रहा है, बारिश में कक्षा में पानी भरता है।",
      lang: "Hindi",
      category: "education",
      urgency: 4,
      translation: "Plaster falling from ceiling at Basoda Govt Primary School; classroom floods during rain.",
      summary: "Deteriorated school ceiling endangering primary students.",
    },

    // 11. Uttar Pradesh — Lucknow (Sanitation & Drainage)
    {
      loc: INDIAN_DISTRICT_COORDS.Lucknow,
      text: "चौक इलाके में मुख्य नाला जाम होने से सड़कों पर सीवर का पानी भर गया है, बाजार में बदबू से महामारी का खतरा।",
      lang: "Hindi",
      category: "sanitation",
      urgency: 4,
      translation: "Main municipal storm drain blocked in Chowk market causing sewage backflow onto streets.",
      summary: "Overflowing sewage and blocked municipal drain in commercial center.",
    },

    // 12. Uttar Pradesh — Varanasi (Water / Heritage)
    {
      loc: INDIAN_DISTRICT_COORDS.Varanasi,
      text: "दशाश्वमेध घाट के पास मुख्य जल आपूर्ति वाल्व क्षतिग्रस्त, हजारों तीर्थयात्रियों को पीने का पानी नहीं।",
      lang: "Hindi",
      category: "water",
      urgency: 4,
      translation: "Damaged municipal water valve near Dashashwamedh Ghat depriving thousands of pilgrims of drinking water.",
      summary: "Broken drinking water valve near crowded pilgrimage ghat.",
    },

    // 13. Uttar Pradesh — Bahraich (Rural / Aspirational, Health / Floods)
    {
      loc: INDIAN_DISTRICT_COORDS.Bahraich,
      text: "महसी तहसील में बाढ़ के बाद बुखार और संक्रामक बीमारियों का प्रकोप, प्राथमिक स्वास्थ्य केंद्र में दवाएं नहीं हैं।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "Fever and infectious disease outbreak following floods in Mahasi; rural PHC has no antibiotic stock.",
      summary: "Post-flood viral outbreak in aspirational district with depleted PHC medicines.",
    },

    // 14. Uttar Pradesh — Balrampur (Rural / Aspirational, Roads)
    {
      loc: INDIAN_DISTRICT_COORDS.Balrampur,
      text: "तुलसीपुर मार्ग पर राप्ती नदी का बांध संपर्क मार्ग बह गया है, स्कूली बच्चों की नाव पलटने की नौबत है।",
      lang: "Hindi",
      category: "roads",
      urgency: 5,
      translation: "Embankment access road along Rapti river washed out on Tulsipur route, endangering student transit.",
      summary: "Washed out river embankment road isolating rural hamlets.",
    },

    // 15. Uttar Pradesh — Chitrakoot (Rural / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Chitrakoot,
      text: "मानिकपुर पठारी क्षेत्र में सभी बोरवेल सूख गए हैं, टैंकर भी 3 दिन में एक बार आता है।",
      lang: "Hindi",
      category: "water",
      urgency: 5,
      translation: "Borewells completely dry in Manikpur plateau region; municipal tanker arrives only once every 3 days.",
      summary: "Severe drought condition in plateau village with critical water scarcity.",
    },

    // 16. Maharashtra — Mumbai (Roads / Drainage)
    {
      loc: INDIAN_DISTRICT_COORDS.Mumbai,
      text: "अंधेरी सबवे येथे साचलेले पाणी आणि मोठे खड्डे यामुळे गाड्या बंद पडत आहेत, प्रचंड वाहतूक कोंडी झाली आहे.",
      lang: "Marathi",
      category: "roads",
      urgency: 4,
      translation: "Waterlogging and large craters in Andheri subway stalling vehicles and triggering severe traffic gridlock.",
      summary: "Subway waterlogging and potholes causing vehicle breakdown and traffic paralysis.",
    },

    // 17. Maharashtra — Pune (Sanitation)
    {
      loc: INDIAN_DISTRICT_COORDS.Pune,
      text: "हडपसर मुख्य चौकात आठवडाभरापासून कचऱ्याचा ढीग साचला आहे, महापालिकेने कचरा उचलणे बंद केले आहे.",
      lang: "Marathi",
      category: "sanitation",
      urgency: 4,
      translation: "Piles of uncollected garbage accumulating at Hadapsar junction for a week; municipal trucks have stopped coming.",
      summary: "Uncollected municipal waste pile creating public health hazard.",
    },

    // 18. Maharashtra — Nagpur (Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Nagpur,
      text: "मानेवाडा भागात वीज खांबावर शॉर्ट सर्किट होऊन ठिणग्या पडत आहेत, वीज पुरवठा खंडित झाला आहे.",
      lang: "Marathi",
      category: "electricity",
      urgency: 5,
      translation: "Live sparks raining from electric pole short circuit in Manewada area, completely disrupting supply.",
      summary: "Hazardous electric pole sparking endangering pedestrians and cutting power.",
    },

    // 19. Maharashtra — Gadchiroli (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Gadchiroli,
      text: "धानोरा तालुक्यातील प्राथमिक आरोग्य केंद्रात सर्पदंशाचे इंजेक्शन उपलब्ध नाही, रुग्णांना वेळीच उपचार मिळत नाहीत.",
      lang: "Marathi",
      category: "health",
      urgency: 5,
      translation: "Anti-snake venom injections unavailable at Dhanora primary health centre; patients facing life threats.",
      summary: "Critical shortage of antivenom in remote tribal health center.",
    },

    // 20. West Bengal — Kolkata (Roads / Tram)
    {
      loc: INDIAN_DISTRICT_COORDS.Kolkata,
      text: "শ্যামবাজার পাঁচ মাথার মোড়ে ট্রাম লাইনের পাশে পিচ উঠে বিপজ্জনক গর্ত তৈরি হয়েছে, পথচারী ও বাইক দুর্ঘটনায় পড়ছে।",
      lang: "Bengali",
      category: "roads",
      urgency: 4,
      translation: "Asphalt disintegrated along tram tracks near Shyambazar junction creating perilous potholes and bike accidents.",
      summary: "Dangerous potholes along tramway tracks causing commuter injuries.",
    },

    // 21. West Bengal — Birbhum (Rural, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Birbhum,
      text: "রামপুরহাট ব্লকে নলবাহিত পানীয় জলের পাইপ ফেটে নোংরা জল ঢুকছে, গ্রামে পেটের রোগ ছড়াচ্ছে।",
      lang: "Bengali",
      category: "water",
      urgency: 5,
      translation: "Piped water pipeline burst in Rampurhat block sucking in filth and spreading diarrhea in village.",
      summary: "Contaminated piped drinking water causing gastrointestinal illness.",
    },

    // 22. West Bengal — Purulia (Rural, Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Purulia,
      text: "ঝালদা গ্রামের কৃষি বিদ্যুৎ সংযোগের ট্রান্সফরমার গত ১২ দিন ধরে পোড়া অবস্থায় পড়ে আছে।",
      lang: "Bengali",
      category: "electricity",
      urgency: 4,
      translation: "Agricultural power transformer in Jhalda village burned out for 12 days, stalling crop irrigation.",
      summary: "Burned agricultural transformer paralyzing rural field irrigation.",
    },

    // 23. Tamil Nadu — Chennai (Sanitation / Drainage)
    {
      loc: INDIAN_DISTRICT_COORDS.Chennai,
      text: "வேளச்சேரி மெயின் ரோட்டில் பாதாள சாக்கடை நிரம்பி வழிந்து துர்நாற்றம் வீசுகிறது, கொசுக்கள் உற்பத்தியாகின்றன.",
      lang: "Tamil",
      category: "sanitation",
      urgency: 4,
      translation: "Underground drainage overflowing on Velachery Main Road creating foul stench and mosquito breeding.",
      summary: "Overflowing underground sewer polluting main transit corridor.",
    },

    // 24. Tamil Nadu — Ramanathapuram (Rural / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Ramanathapuram,
      text: "கடலோர கிராமத்தில் உப்பு நீர் மட்டுமே வருகிறது, காவிரி கூட்டுக் குடிநீர் திட்டம் 20 நாட்களாக செயல்படவில்லை.",
      lang: "Tamil",
      category: "water",
      urgency: 5,
      translation: "Coastal village getting only saline groundwater; Cauvery combined drinking water scheme broken for 20 days.",
      summary: "Saline groundwater intrusion and failure of combined water scheme.",
    },

    // 25. Tamil Nadu — Virudhunagar (Aspirational, Education)
    {
      loc: INDIAN_DISTRICT_COORDS.Virudhunagar,
      text: "அரசு மேல்நிலைப் பள்ளியில் கழிவறை வசதி பழுதடைந்துள்ளதால் மாணவிகள் மிகுந்த சிரமத்திற்கு ஆளாகின்றனர்.",
      lang: "Tamil",
      category: "education",
      urgency: 4,
      translation: "Damaged sanitation blocks in Government Higher Secondary School causing acute distress to girl students.",
      summary: "Damaged school toilets impacting attendance and dignity of female students.",
    },

    // 26. Telangana — Hyderabad (Roads)
    {
      loc: INDIAN_DISTRICT_COORDS.Hyderabad,
      text: "కూకట్‌పల్లి మెయిన్ రోడ్డుపై భారీ గుంతలు పడి ద్విచక్ర వాహనదారులు కింద పడుతున్నారు, వెంటనే రీకార్పెటింగ్ చేయాలి.",
      lang: "Telugu",
      category: "roads",
      urgency: 4,
      translation: "Deep craters on Kukatpally main road throwing two-wheeler riders off; urgent resurfacing needed.",
      summary: "Severe road craters injuring commuters on major urban artery.",
    },

    // 27. Telangana — Bhadradri Kothagudem (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.BhadradriKothagudem,
      text: "ఏజెన్సీ గిరిజన ప్రాంతాల్లో మలేరియా కేసులు పెరుగుతున్నాయి, ప్రాథమిక వైద్య కేంద్రంలో మందుల కొరత ఉంది.",
      lang: "Telugu",
      category: "health",
      urgency: 5,
      translation: "Rising malaria cases in agency tribal belt; local primary health center facing acute drug shortages.",
      summary: "Malaria spike in tribal area with depleted dispensary medicines.",
    },

    // 28. Andhra Pradesh — Visakhapatnam (Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Visakhapatnam,
      text: "గాజువాక పారిశ్రామిక ప్రాంతంలో తరచుగా విద్యుత్ హెచ్చుతగ్గుల వల్ల గృహోపకరణాలు కాలిపోతున్నాయి.",
      lang: "Telugu",
      category: "electricity",
      urgency: 4,
      translation: "Severe voltage fluctuations in Gajuwaka industrial zone burning home appliances and electronics.",
      summary: "Erratic voltage surges damaging electrical appliances in residential colony.",
    },

    // 29. Andhra Pradesh — Vizianagaram (Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Vizianagaram,
      text: "గ్రామీణ ప్రాంతంలో తాగునీటి బోరుబావి మోటారు కాలిపోయింది, గ్రామస్తులు చెరువు నీరు త్రాగాల్సి వస్తోంది.",
      lang: "Telugu",
      category: "water",
      urgency: 5,
      translation: "Borewell motor burned in rural habitation; villagers forced to consume contaminated pond water.",
      summary: "Burned borewell pump forcing rural community to drink unfiltered pond water.",
    },

    // 30. Gujarat — Ahmedabad (Roads / Traffic)
    {
      loc: INDIAN_DISTRICT_COORDS.Ahmedabad,
      text: "નરોડા જીઆઈડીસી રોડ પર ભારે વાહનોથી મોટા ખાડા પડ્યા છે, વરસાદ પછી કાદવ અને અકસ્માત સર્જાય છે.",
      lang: "Gujarati",
      category: "roads",
      urgency: 4,
      translation: "Heavy industrial vehicles carved huge craters on Naroda GIDC road; mud and accidents after rain.",
      summary: "Industrial road craters causing skidding and severe accidents.",
    },

    // 31. Gujarat — Dahod (Rural / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Dahod,
      text: "ગરબાડા તાલુકાના અંતરિયાળ ગામમાં હેન્ડપંપ બગડી ગયેલ છે, મહિલાઓને 3 કિમી દૂરથી પાણી લાવવું પડે છે.",
      lang: "Gujarati",
      category: "water",
      urgency: 5,
      translation: "Handpump damaged in remote village of Garbada taluka; women walking 3 km to fetch water.",
      summary: "Broken handpump in tribal taluka forcing women to walk long distances for water.",
    },

    // 32. Gujarat — Narmada (Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Narmada,
      text: "ડેડિયાપાડા સામૂહિક આરોગ્ય કેન્દ્રમાં એમ્બ્યુલન્સ સેવા બંધ છે, ગંભીર દર્દીઓને પહોંચાડવામાં મુશ્કેલી પડે છે.",
      lang: "Gujarati",
      category: "health",
      urgency: 5,
      translation: "Ambulance service non-operational at Dediapada Community Health Centre; critical patients stranded.",
      summary: "Ground ambulance breakdown at rural CHC hampering emergency response.",
    },

    // 33. Karnataka — Bengaluru Urban (Roads / Potholes)
    {
      loc: INDIAN_DISTRICT_COORDS.BengaluruUrban,
      text: "ಮಾರತ್‌ಹಳ್ಳಿ ಬ್ರಿಡ್ಜ್ ಬಳಿ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿಗಳು ಬಿದ್ದಿವೆ, ಪ್ರತಿದಿನ ವಾಹನ ದಟ್ಟಣೆ ಮತ್ತು ಸವಾರರಿಗೆ ಗಾಯಗಳಾಗುತ್ತಿವೆ.",
      lang: "Kannada",
      category: "roads",
      urgency: 4,
      translation: "Huge craters near Marathahalli bridge causing daily traffic jams and rider injuries.",
      summary: "Dangerous potholes on major tech corridor causing injuries and gridlock.",
    },

    // 34. Karnataka — Raichur (Rural / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Raichur,
      text: "ದೇವದುರ್ಗ ತಾಲೂಕಿನ ಹಳ್ಳಿಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ಕೊಳಕು ನೀರು ಬರುತ್ತಿದೆ, ಫ್ಲೋರೈಡ್ ಸಮಸ್ಯೆ ಹೆಚ್ಚಾಗಿದೆ.",
      lang: "Kannada",
      category: "water",
      urgency: 5,
      translation: "Drinking water pipe broken in Devadurga village dispensing muddy water; worsening fluoride poisoning risk.",
      summary: "Contaminated rural water pipe increasing fluorosis and infection risks.",
    },

    // 35. Karnataka — Yadgir (Rural / Aspirational, Education)
    {
      loc: INDIAN_DISTRICT_COORDS.Yadgir,
      text: "ಸರ್ಕಾರಿ ಕಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯಲ್ಲಿ ಕುಡಿಯುವ ನೀರು ಮತ್ತು ಶೌಚಾಲಯವಿಲ್ಲದೆ ಮಕ್ಕಳು ಶಾಲೆಗೆ ಬರಲು ನಿರಾಕರಿಸುತ್ತಿದ್ದಾರೆ.",
      lang: "Kannada",
      category: "education",
      urgency: 4,
      translation: "No drinking water or functional toilet in Govt primary school; children dropping out.",
      summary: "Lack of basic sanitation and water facilities driving primary school absenteeism.",
    },

    // 36. Kerala — Thiruvananthapuram (Sanitation / Canal)
    {
      loc: INDIAN_DISTRICT_COORDS.Thiruvananthapuram,
      text: "അട്ടക്കുളങ്ങര തോട് പ്ലാസ്റ്റിക് മാലിന്യങ്ങൾ അടിഞ്ഞ് മൂടിക്കിടക്കുന്നു, മഴ പെയ്താൽ റോഡിലേക്ക് മലിനജലം കയറുന്നു.",
      lang: "Malayalam",
      category: "sanitation",
      urgency: 4,
      translation: "Attakkulangara drainage canal choked with plastic waste, flooding street with dirty water during rain.",
      summary: "Choked storm canal causing dirty street flooding during monsoons.",
    },

    // 37. Kerala — Wayanad (Rural / Aspirational, Roads / Landslide)
    {
      loc: INDIAN_DISTRICT_COORDS.Wayanad,
      text: "മേപ്പാടി മലയോര റോഡിൽ മണ്ണിടിച്ചിൽ ഭീഷണിയുണ്ട്, ക്രാഷ് ബാരിയറുകൾ തകർന്ന് കൊക്കയിലേക്ക് വീഴാൻ സാധ്യതയുണ്ട്.",
      lang: "Malayalam",
      category: "roads",
      urgency: 5,
      translation: "Landslide hazard on Meppadi hill road; damaged crash barriers pose severe plunge risk into gorge.",
      summary: "Landslide hazard and collapsed guardrails on vulnerable hillside corridor.",
    },

    // 38. Punjab — Amritsar (Sanitation / Gutter)
    {
      loc: INDIAN_DISTRICT_COORDS.Amritsar,
      text: "ਪੁਤਲੀਘਰ ਚੌਂਕ ਨੇੜੇ ਸੀਵਰੇਜ ਓਵਰਫਲੋਅ ਹੋਣ ਕਾਰਨ ਗੰਦਾ ਪਾਣੀ ਦੁਕਾਨਾਂ ਅੰਦਰ ਵੜ ਰਿਹਾ ਹੈ, ਬਿਮਾਰੀਆਂ ਫੈਲਣ ਦਾ ਡਰ।",
      lang: "Punjabi",
      category: "sanitation",
      urgency: 4,
      translation: "Sewage overflow near Putlighar chowk seeping into shops; high risk of disease outbreak.",
      summary: "Commercial center sewer overflow flooding retail storefronts.",
    },

    // 39. Punjab — Firozpur (Border / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Firozpur,
      text: "ਸਰਹੱਦੀ ਪਿੰਡ ਵਿੱਚ ਨਹਿਰੀ ਪਾਣੀ ਦੀ ਸਪਲਾਈ 20 ਦਿਨਾਂ ਤੋਂ ਬੰਦ ਹੈ, ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ ਬਹੁਤ ਜ਼ਹਿਰੀਲਾ ਹੈ।",
      lang: "Punjabi",
      category: "water",
      urgency: 5,
      translation: "Canal drinking water supply disconnected for 20 days in border village; groundwater heavily toxic.",
      summary: "Border village deprived of canal drinking water facing toxic groundwater exposure.",
    },

    // 40. Haryana — Gurugram (Roads / Underpass)
    {
      loc: INDIAN_DISTRICT_COORDS.Gurugram,
      text: "Golf Course Extension road underpass flooded with 3 feet water after brief drizzle, commuters stranded.",
      lang: "English",
      category: "roads",
      urgency: 4,
      translation: "Golf Course Extension road underpass flooded with 3 feet water after brief drizzle, commuters stranded.",
      summary: "Urban underpass severe drainage failure causing stranded traffic.",
    },

    // 41. Haryana — Nuh (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Nuh,
      text: "तावडू सामुदायिक स्वास्थ्य केंद्र में बाल रोग विशेषज्ञ नहीं हैं, नवजात शिशुओं को रैफर करना पड़ रहा है।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "No pediatrician available at Tauru Community Health Centre; newborn infants forced into emergency referral.",
      summary: "Absence of pediatric specialist at rural healthcare center.",
    },

    // 42. Uttarakhand — Dehradun (Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Dehradun,
      text: "राजपुर रोड पर पुराने ट्रांसफार्मर में बार-बार धमाका हो रहा है, आवासीय कॉलोनी में 18 घंटे से बिजली नहीं।",
      lang: "Hindi",
      category: "electricity",
      urgency: 4,
      translation: "Aging transformer repeatedly blowing up on Rajpur Road; residential colony dark for 18 hours.",
      summary: "Repeated transformer explosions and power disruption on hill city avenue.",
    },

    // 43. Uttarakhand — Haridwar (Aspirational, Sanitation)
    {
      loc: INDIAN_DISTRICT_COORDS.Haridwar,
      text: "ज्वालापुर क्षेत्र में नालियों की सफाई न होने से गंदा पानी सड़क पर बह रहा है और डेंगू के मच्छर पनप रहे हैं।",
      lang: "Hindi",
      category: "sanitation",
      urgency: 4,
      translation: "Uncleaned drains in Jwalapur flooding street with sludge; dengue mosquito infestation spreading.",
      summary: "Stagnant drain water causing dengue mosquito outbreak in dense settlement.",
    },

    // 44. Himachal Pradesh — Shimla (Roads / Winter)
    {
      loc: INDIAN_DISTRICT_COORDS.Shimla,
      text: "ढली बाईपास पर सड़क धंसने से दरारें आ गई हैं, भारी वाहनों के गिरने का गंभीर खतरा बना हुआ है।",
      lang: "Hindi",
      category: "roads",
      urgency: 5,
      translation: "Road subsidence and deep fissures on Dhalli bypass; severe hazard of heavy vehicle rollover.",
      summary: "Highway subsidence and ground fissures posing fatal vehicular hazard.",
    },

    // 45. Himachal Pradesh — Chamba (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Chamba,
      text: "तीसा दुर्गम क्षेत्र में प्राथमिक स्वास्थ्य केंद्र तक एंबुलेंस सड़क बर्फबारी और मलबे से बंद पड़ी है।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "Ambulance road to Tissa remote primary health center blocked with debris and snowfall.",
      summary: "Critical health access corridor blocked in remote mountainous district.",
    },

    // 46. Jharkhand — Ranchi (Water / Borewell)
    {
      loc: INDIAN_DISTRICT_COORDS.Ranchi,
      text: "डोरंडा में नगर निगम का डीप बोरवेल खराब पड़ा है, 500 मजदूर परिवारों को पानी के लिए भटकना पड़ रहा है।",
      lang: "Hindi",
      category: "water",
      urgency: 4,
      translation: "Municipal deep borewell damaged in Doranda; 500 daily-wage families wandering for water.",
      summary: "Deep municipal borewell breakdown affecting low-income worker colony.",
    },

    // 47. Jharkhand — Dumka (Rural / Aspirational, Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Dumka,
      text: "शिकारीपाड़ा प्रखंड के 5 आदिवासी गांवों में 15 दिनों से ट्रांसफार्मर जला हुआ है, रात में जंगली जानवरों का डर।",
      lang: "Hindi",
      category: "electricity",
      urgency: 5,
      translation: "Transformer burned out for 15 days across 5 tribal hamlets in Shikaripara; danger from wild animals in darkness.",
      summary: "Burned rural transformer plunging tribal forest hamlets into complete darkness.",
    },

    // 48. Assam — Kamrup Metropolitan (Sanitation / Flash Flood)
    {
      loc: INDIAN_DISTRICT_COORDS.KamrupMetropolitan,
      text: "গুৱাহাটীৰ অনিল নগৰত অলপ বৰষুণতে কৃত্ৰিম বানপানী সৃষ্টি হৈছে, নলাৰ আবৰ্জনা ঘৰৰ ভিতৰত সোমাইছে।",
      lang: "Assamese",
      category: "sanitation",
      urgency: 4,
      translation: "Artificial flash floods in Anil Nagar, Guwahati after slight rain; drainage filth entering houses.",
      summary: "Urban drainage congestion flooding residential rooms with dirty floodwater.",
    },

    // 49. Assam — Baksa (Rural / Aspirational, Roads)
    {
      loc: INDIAN_DISTRICT_COORDS.Baksa,
      text: "তামুলপুৰ-বাক্সা সংযোগী বাঁহৰ দলংখন ভাগি যোৱাত ছাত্ৰ-ছাত্ৰী আৰু ৰোগীসকল নদী পাৰ হ'ব পৰা নাই।",
      lang: "Assamese",
      category: "roads",
      urgency: 5,
      translation: "Bamboo bridge connecting Tamulpur-Baksa collapsed; students and patients unable to cross river.",
      summary: "Collapsed rural bamboo river bridge stranding patients and schoolchildren.",
    },

    // 50. Odisha — Khordha (Roads / Drainage)
    {
      loc: INDIAN_DISTRICT_COORDS.Khordha,
      text: "ଭୁବନେଶ୍ୱର ରସୁଲଗଡ଼ ଛକ ନିକଟରେ ରାସ୍ତା ଖାଲଖମା ହୋଇ କାଦୁଅ ଜମିଛି, ଦୁଇଚକିଆ ଯାନ ଦୁର୍ଘଟଣାଗ୍ରସ୍ତ ହେଉଛି।",
      lang: "Odia",
      category: "roads",
      urgency: 4,
      translation: "Deep craters and mud accumulation near Rasulgarh square, Bhubaneswar; two-wheelers constantly crashing.",
      summary: "Severe potholes and slick mud on major transit intersection injuring motorists.",
    },

    // 51. Odisha — Koraput (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Koraput,
      text: "ଲକ୍ଷ୍ମୀପୁର ଗୋଷ୍ଠୀ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରରେ ଆମ୍ବୁଲାନ୍ସ ନାହିଁ, ଗର୍ଭବତୀ ମହିଳାଙ୍କୁ ଖଟିଆରେ ବୋହି ଡାକ୍ତରଖାନା ନେବାକୁ ପଡୁଛି।",
      lang: "Odia",
      category: "health",
      urgency: 5,
      translation: "No ambulance at Laxmipur community health centre; pregnant woman carried on cot through forest trail.",
      summary: "Lack of ambulance forcing villagers to carry patients on cots through hilly trails.",
    },

    // 52. Odisha — Kalahandi (Rural / Aspirational, Water)
    {
      loc: INDIAN_DISTRICT_COORDS.Kalahandi,
      text: "ଥୁଆମୂଳ ରାମପୁର ବ୍ଲକରେ ନଳକୂପରୁ ଲାଲ ପାଣି ବାହାରୁଛି, ବିଶୁଦ୍ଧ ପାନୀୟ ଜଳ ନପାଇ ଗ୍ରାମବାସୀ ଝାଡ଼ାବାନ୍ତିରେ ଆକ୍ରାନ୍ତ।",
      lang: "Odia",
      category: "water",
      urgency: 5,
      translation: "Tube-well pumping reddish muddy water in Thuamul Rampur block; acute diarrhea outbreak among villagers.",
      summary: "Red silt contamination in drinking tubewell causing acute diarrhea cluster.",
    },

    // 53. Odisha — Nabarangpur (Aspirational, Education)
    {
      loc: INDIAN_DISTRICT_COORDS.Nabarangpur,
      text: "ଉମରକୋଟ ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟର କାନ୍ଥ ଫାଟି ବିପଦପୂର୍ଣ୍ଣ ହୋଇଛି, ପିଲାମାନେ ଗଛ ତଳେ ପାଠ ପଢ଼ିବାକୁ ବାଧ୍ୟ।",
      lang: "Odia",
      category: "education",
      urgency: 4,
      translation: "Fissured walls of Umerkote primary school deemed hazardous; children forced to study under trees.",
      summary: "Structurally unsafe primary school building forcing open-air classes.",
    },

    // 54. Chhattisgarh — Bastar (Rural / Aspirational, Electricity)
    {
      loc: INDIAN_DISTRICT_COORDS.Bastar,
      text: "दरभा विकासखंड के अंदरूनी गांव में बिजली के खंभे गिर गए हैं, 20 दिनों से अस्पताल और स्कूल अंधेरे में हैं।",
      lang: "Hindi",
      category: "electricity",
      urgency: 5,
      translation: "Fallen electric poles in Darbha interior villages; local clinic and school in dark for 20 days.",
      summary: "Fallen transmission poles paralyzing remote health sub-center and village power.",
    },

    // 55. Chhattisgarh — Bijapur (Rural / Aspirational, Health)
    {
      loc: INDIAN_DISTRICT_COORDS.Bijapur,
      text: "भोपालपटनम सामुदायिक स्वास्थ्य केंद्र में जीवनरक्षक ऑक्सीजन सिलेंडर और मलेरिया जांच किट उपलब्ध नहीं हैं।",
      lang: "Hindi",
      category: "health",
      urgency: 5,
      translation: "Lifesaving oxygen cylinders and rapid malaria testing kits completely out of stock at Bhopalpatnam CHC.",
      summary: "Depleted oxygen cylinders and malaria diagnostic kits in remote tribal CHC.",
    },
  ];

  return templates.map((tmpl, idx) => {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;
    return {
      id: `seed-in-${idCounter++}`,
      text: tmpl.text,
      original_text: tmpl.text,
      language: tmpl.lang,
      detected_language: tmpl.lang,
      english_translation: tmpl.translation,
      category: tmpl.category,
      urgency: tmpl.urgency,
      summary_english: tmpl.summary,
      district: tmpl.loc.district,
      state: tmpl.loc.state,
      country: tmpl.loc.country,
      lat: Number((tmpl.loc.lat + latOffset).toFixed(5)),
      lng: Number((tmpl.loc.lng + lngOffset).toFixed(5)),
      synthetic: true,
      created_at: getRandomDateInLast30Days(),
      status:
        idx % 5 === 0
          ? "resolved"
          : idx % 5 === 1
            ? "in_progress"
            : idx % 5 === 2
              ? "acknowledged"
              : idx % 5 === 3
                ? "priority"
                : "classified",
      source: idx % 3 === 0 ? "voice" : idx % 3 === 1 ? "whatsapp" : "web",
      upvotes: (idx * 5 + 3) % 20 + 2,
    };
  });
}

// Generate realistic BRICS extension seed data
export function generateBricsSubmissions(): Submission[] {
  const bricsData = [
    // BRAZIL — São Paulo (2 items)
    {
      loc: BRICS_LOCATIONS[0],
      text: "Cratera perigosa de 3 metros na Avenida Paulista perto do MASP danificando suspensão de veículos.",
      category: "roads" as const,
      urgency: 4 as const,
      translation: "Dangerous 3-meter road crater on Avenida Paulista near MASP damaging vehicle suspensions.",
      summary: "Deep road pothole near major cultural avenue in São Paulo.",
      lang: "Portuguese",
    },
    {
      loc: BRICS_LOCATIONS[0],
      text: "Falta total de água encanada no bairro da Zona Leste há mais de 4 dias consecutivos.",
      category: "water" as const,
      urgency: 5 as const,
      translation: "Complete tap water outage in Zona Leste neighborhood for more than 4 consecutive days.",
      summary: "Severe water supply failure impacting residential block in São Paulo.",
      lang: "Portuguese",
    },

    // BRAZIL — Rio de Janeiro (2 items)
    {
      loc: BRICS_LOCATIONS[1],
      text: "Esgoto a céu aberto escorrendo pela ladeira da comunidade provocando mau cheiro e proliferação de mosquitos.",
      category: "sanitation" as const,
      urgency: 4 as const,
      translation: "Open raw sewage running down hillside road causing foul smell and dangerous mosquito proliferation.",
      summary: "Open sewage channel overflowing down community street in Rio.",
      lang: "Portuguese",
    },
    {
      loc: BRICS_LOCATIONS[1],
      text: "Cabos elétricos caídos na calçada soltando faíscas perto de creche comunitária.",
      category: "electricity" as const,
      urgency: 5 as const,
      translation: "Downed live electrical power cables sparking on sidewalk near community preschool.",
      summary: "Live downed electrical cables sparking adjacent to preschool in Rio.",
      lang: "Portuguese",
    },

    // SOUTH AFRICA — Johannesburg (2 items)
    {
      loc: BRICS_LOCATIONS[3],
      text: "Stage 6 load shedding causing continuous 10-hour power cuts, municipal water pumps failed in Soweto.",
      category: "electricity" as const,
      urgency: 5 as const,
      translation: "Stage 6 load shedding causing continuous 10-hour power cuts, municipal water pumps failed in Soweto.",
      summary: "Severe prolonged power blackout causing downstream water pump failure in Soweto.",
      lang: "English",
    },
    {
      loc: BRICS_LOCATIONS[3],
      text: "Burst high-pressure water main flooding intersection in Braamfontein for over 48 hours.",
      category: "water" as const,
      urgency: 4 as const,
      translation: "Burst high-pressure water main flooding intersection in Braamfontein for over 48 hours.",
      summary: "High-pressure municipal water main rupture flooding city center intersection.",
      lang: "English",
    },

    // SOUTH AFRICA — Cape Town (2 items)
    {
      loc: BRICS_LOCATIONS[4],
      text: "Blocked stormwater drains overflowing onto main highway in Khayelitsha after winter rains.",
      category: "sanitation" as const,
      urgency: 4 as const,
      translation: "Blocked stormwater drains overflowing onto main highway in Khayelitsha after winter rains.",
      summary: "Blocked stormwater drainage flooding highway in Khayelitsha.",
      lang: "English",
    },

    // RUSSIA — Moscow (2 items)
    {
      loc: BRICS_LOCATIONS[6],
      text: "Аварийный прорыв теплотрассы горячего водоснабжения во дворе жилого комплекса, пар блокирует видимость.",
      category: "water" as const,
      urgency: 5 as const,
      translation: "Severe heating main rupture in residential courtyard, scalding steam blinding roadway.",
      summary: "District heating pipeline burst creating scalding steam hazard in residential block.",
      lang: "Russian",
    },
    {
      loc: BRICS_LOCATIONS[6],
      text: "Глубокая просадка дорожного покрытия на выезде с третьего транспортного кольца, угроза ДТП.",
      category: "roads" as const,
      urgency: 4 as const,
      translation: "Deep road surface subsidence on Third Ring Road exit ramp causing imminent crash hazard.",
      summary: "Subsided asphalt crater on Moscow highway exit ramp.",
      lang: "Russian",
    },

    // CHINA — Beijing (2 items)
    {
      loc: BRICS_LOCATIONS[8],
      text: "朝阳区老旧小区主供水管道爆裂，导致三栋居民楼停水超过36小时，急需抢修。",
      category: "water" as const,
      urgency: 5 as const,
      translation: "Water main rupture cutting domestic supply to 3 residential buildings in Chaoyang for 36 hours.",
      summary: "Water main break cutting residential supply in Chaoyang for 36 hours.",
      lang: "Chinese",
    },
    {
      loc: BRICS_LOCATIONS[8],
      text: "商业步行街地下电力电缆老化频繁短路跳闸，商户冷柜停机造成经济损失。",
      category: "electricity" as const,
      urgency: 4 as const,
      translation: "Aging underground electrical cables repeatedly tripping power to commercial pedestrian street.",
      summary: "Underground electrical grid overload tripping commercial district power.",
      lang: "Chinese",
    },
  ];

  let idCounter = 201;

  return bricsData.map((item) => {
    const latOffset = (Math.random() - 0.5) * 0.02;
    const lngOffset = (Math.random() - 0.5) * 0.02;

    return {
      id: `seed-brics-${idCounter++}`,
      text: item.text,
      original_text: item.text,
      language: item.lang,
      detected_language: item.lang,
      english_translation: item.translation,
      category: item.category,
      urgency: item.urgency,
      summary_english: item.summary,
      district: item.loc.district,
      state: item.loc.state,
      country: item.loc.country,
      lat: Number((item.loc.lat + latOffset).toFixed(5)),
      lng: Number((item.loc.lng + lngOffset).toFixed(5)),
      synthetic: true,
      created_at: getRandomDateInLast30Days(),
      status: "classified" as const,
      source: "web",
      upvotes: 4,
    };
  });
}

// Combined seed items with synthetic: true on every single record
export const ALL_SEED_SUBMISSIONS: Submission[] = [
  ...generateIndianSubmissions(),
  ...generateBricsSubmissions(),
].map((sub, idx) => ({
  ...sub,
  synthetic: true,
  source: sub.source || (idx % 3 === 0 ? "whatsapp" : "web"),
  upvotes: sub.upvotes ?? ((idx * 7 + 3) % 18 + 1),
}));

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
        synthetic: true,
      });
      addedCount++;
    }

    return { count: addedCount };
  } catch (error) {
    console.error("Error seeding Firestore database:", error);
    throw error;
  }
}
