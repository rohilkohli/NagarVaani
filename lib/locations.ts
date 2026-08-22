export interface CountryLocation {
  id: string;
  name: string;
  code: string;
  flag: string;
  lat: number;
  lng: number;
  states: {
    name: string;
    districts: string[];
  }[];
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  zoom: number;
  label: string;
  isEstimated: boolean;
}

export const COUNTRIES_DATA: CountryLocation[] = [
  {
    id: "India",
    name: "India",
    code: "IN",
    flag: "🇮🇳",
    lat: 20.5937,
    lng: 78.9629,
    states: [
      {
        name: "Maharashtra",
        districts: ["Mumbai Suburban", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur"]
      },
      {
        name: "Delhi NCT",
        districts: ["Central Delhi", "South Delhi", "North Delhi", "East Delhi", "New Delhi", "Dwarka", "Rohini"]
      },
      {
        name: "Karnataka",
        districts: ["Bengaluru Urban", "Mysuru", "Dharwad", "Mangaluru", "Belagavi", "Hubballi", "Kalaburagi"]
      },
      {
        name: "Uttar Pradesh",
        districts: ["Lucknow", "Varanasi", "Kanpur Nagar", "Agra", "Noida (GB Nagar)", "Prayagraj", "Ghaziabad", "Meerut"]
      },
      {
        name: "Tamil Nadu",
        districts: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore"]
      },
      {
        name: "Gujarat",
        districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar", "Jamnagar"]
      },
      {
        name: "West Bengal",
        districts: ["Kolkata", "North 24 Parganas", "Howrah", "Darjeeling", "South 24 Parganas", "Siliguri"]
      },
      {
        name: "Telangana",
        districts: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Secunderabad"]
      },
      {
        name: "Andhra Pradesh",
        districts: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"]
      },
      {
        name: "Rajasthan",
        districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar"]
      },
      {
        name: "Madhya Pradesh",
        districts: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"]
      },
      {
        name: "Kerala",
        districts: ["Thiruvananthapuram", "Ernakulam (Kochi)", "Kozhikode", "Thrissur", "Kollam", "Kannur"]
      },
      {
        name: "Punjab",
        districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali"]
      },
      {
        name: "Haryana",
        districts: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar"]
      },
      {
        name: "Bihar",
        districts: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga"]
      },
      {
        name: "Odisha",
        districts: ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Berhampur"]
      },
      {
        name: "Assam",
        districts: ["Guwahati (Kamrup)", "Dibrugarh", "Silchar", "Jorhat", "Nagaon", "Tezpur"]
      },
      {
        name: "Jharkhand",
        districts: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh"]
      },
      {
        name: "Chhattisgarh",
        districts: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon"]
      },
      {
        name: "Uttarakhand",
        districts: ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani", "Roorkee"]
      },
      {
        name: "Himachal Pradesh",
        districts: ["Shimla", "Dharamshala", "Mandi", "Solan", "Kullu", "Manali"]
      },
      {
        name: "Goa",
        districts: ["North Goa (Panaji)", "South Goa (Margao)", "Vasco da Gama", "Mapusa"]
      },
      {
        name: "Jammu & Kashmir",
        districts: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur"]
      }
    ]
  },
  {
    id: "Brazil",
    name: "Brazil",
    code: "BR",
    flag: "🇧🇷",
    lat: -14.235,
    lng: -51.9253,
    states: [
      {
        name: "São Paulo",
        districts: ["Zona Leste", "Zona Sul", "Centro", "Zona Norte", "Campinas", "Guarulhos", "São Bernardo do Campo", "Santo André"]
      },
      {
        name: "Rio de Janeiro",
        districts: ["Zona Sul (Copacabana)", "Zona Norte (Tijuca)", "Centro", "Baixada Fluminense", "Niterói", "Duque de Caxias", "São Gonçalo"]
      },
      {
        name: "Minas Gerais",
        districts: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Uberaba"]
      },
      {
        name: "Bahia",
        districts: ["Salvador (Centro)", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Ilhéus"]
      },
      {
        name: "Paraná",
        districts: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "Foz do Iguaçu"]
      },
      {
        name: "Rio Grande do Sul",
        districts: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí"]
      },
      {
        name: "Pernambuco",
        districts: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista"]
      },
      {
        name: "Ceará",
        districts: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato"]
      },
      {
        name: "Distrito Federal",
        districts: ["Brasília (Plano Piloto)", "Taguatinga", "Ceilândia", "Águas Claras", "Samambaia", "Gama"]
      },
      {
        name: "Santa Catarina",
        districts: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Itajaí"]
      },
      {
        name: "Goiás",
        districts: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas"]
      },
      {
        name: "Amazonas",
        districts: ["Manaus Centro", "Zona Leste de Manaus", "Zona Norte de Manaus", "Parintins", "Itacoatiara"]
      }
    ]
  },
  {
    id: "Russia",
    name: "Russia",
    code: "RU",
    flag: "🇷🇺",
    lat: 61.524,
    lng: 105.3188,
    states: [
      {
        name: "Moscow Federal City",
        districts: ["Central Administrative Okrug", "Northern Okrug", "South-Eastern Okrug", "Western Okrug", "North-Eastern Okrug", "Southern Okrug"]
      },
      {
        name: "Saint Petersburg",
        districts: ["Nevsky District", "Vasileostrovsky District", "Vyborgsky District", "Tsentralny District", "Primorsky District", "Petrogradsky District"]
      },
      {
        name: "Moscow Oblast",
        districts: ["Khimki", "Balashikha", "Podolsk", "Mytishchi", "Korolyov", "Lyubertsy", "Krasnogorsk"]
      },
      {
        name: "Sverdlovsk Oblast",
        districts: ["Yekaterinburg Central", "Ordzhonikidzevsky", "Kirovsky", "Nizhny Tagil", "Kamensk-Uralsky"]
      },
      {
        name: "Krasnodar Krai",
        districts: ["Krasnodar Central", "Sochi (Adler)", "Sochi (Tsentralny)", "Novorossiysk", "Armavir", "Anapa"]
      },
      {
        name: "Tatarstan Republic",
        districts: ["Kazan (Vakhitovsky)", "Kazan (Novo-Savinovsky)", "Naberezhnye Chelny", "Nizhnekamsk", "Almetyevsk"]
      },
      {
        name: "Novosibirsk Oblast",
        districts: ["Novosibirsk Central", "Leninsky District", "Kalininsky District", "Berdsk", "Iskitim"]
      },
      {
        name: "Nizhny Novgorod Oblast",
        districts: ["Nizhny Novgorod (Nizhegorodsky)", "Avtozavodsky District", "Dzerzhinsk", "Arzamas", "Sarov"]
      },
      {
        name: "Rostov Oblast",
        districts: ["Rostov-on-Don (Voroshilovsky)", "Taganrog", "Shakhty", "Novocherkassk", "Volgodonsk"]
      },
      {
        name: "Samara Oblast",
        districts: ["Samara (Leninsky)", "Tolyatti (Avtozavodsky)", "Syzran", "Novokuybyshevsk"]
      }
    ]
  },
  {
    id: "South Africa",
    name: "South Africa",
    code: "ZA",
    flag: "🇿🇦",
    lat: -30.5595,
    lng: 22.9375,
    states: [
      {
        name: "Gauteng",
        districts: ["Johannesburg Central", "Soweto", "Sandton", "Tshwane (Pretoria)", "Ekurhuleni (East Rand)", "Centurion", "Roodepoort", "Midrand"]
      },
      {
        name: "Western Cape",
        districts: ["City of Cape Town (CBD)", "Khayelitsha", "Mitchells Plain", "Stellenbosch", "George", "Paarl", "Bellville", "Wynberg"]
      },
      {
        name: "KwaZulu-Natal",
        districts: ["eThekwini (Durban Central)", "Pinetown", "Umlazi", "Pietermaritzburg (Msunduzi)", "Newcastle", "Richards Bay"]
      },
      {
        name: "Eastern Cape",
        districts: ["Nelson Mandela Bay (Gqeberha/Port Elizabeth)", "Buffalo City (East London)", "Mthatha", "Makhanda (Grahamstown)"]
      },
      {
        name: "Free State",
        districts: ["Mangaung (Bloemfontein)", "Welkom (Matjhabeng)", "Sasolburg", "Bethlehem", "Kroonstad"]
      },
      {
        name: "Limpopo",
        districts: ["Polokwane", "Thohoyandou", "Mokopane", "Tzaneen", "Phalaborwa"]
      },
      {
        name: "Mpumalanga",
        districts: ["Mbombela (Nelspruit)", "Emalahleni (Witbank)", "Secunda", "Middelburg"]
      },
      {
        name: "North West",
        districts: ["Rustenburg", "Mahikeng", "Potchefstroom (JB Marks)", "Klerksdorp (Matlosana)"]
      },
      {
        name: "Northern Cape",
        districts: ["Kimberley (Sol Plaatje)", "Upington (Dawid Kruiper)", "Springbok", "De Aar"]
      }
    ]
  },
  {
    id: "China",
    name: "China",
    code: "CN",
    flag: "🇨🇳",
    lat: 35.8617,
    lng: 104.1954,
    states: [
      {
        name: "Beijing",
        districts: ["Chaoyang", "Haidian", "Dongcheng", "Xicheng", "Fengtai", "Shijingshan", "Tongzhou", "Changping"]
      },
      {
        name: "Shanghai",
        districts: ["Pudong New Area", "Huangpu", "Minhang", "Xuhui", "Jing'an", "Changning", "Yangpu", "Hongkou"]
      },
      {
        name: "Guangdong",
        districts: ["Tianhe (Guangzhou)", "Yuexiu (Guangzhou)", "Nanshan (Shenzhen)", "Futian (Shenzhen)", "Bao'an", "Dongguan", "Foshan (Nanhai)"]
      },
      {
        name: "Zhejiang",
        districts: ["Xihu (Hangzhou)", "Binjiang (Hangzhou)", "Ningbo (Haishu)", "Wenzhou", "Jiaxing", "Yiwu"]
      },
      {
        name: "Jiangsu",
        districts: ["Xuanwu (Nanjing)", "Suzhou Industrial Park", "Gusu (Suzhou)", "Wuxi (Liangxi)", "Changzhou", "Nantong"]
      },
      {
        name: "Sichuan",
        districts: ["Wuhou (Chengdu)", "Jinjiang (Chengdu)", "High-Tech Zone (Chengdu)", "Mianyang", "Nanchong", "Yibin"]
      },
      {
        name: "Hubei",
        districts: ["Wuchang (Wuhan)", "Jianghan (Wuhan)", "Optics Valley (Wuhan)", "Yichang", "Xiangyang"]
      },
      {
        name: "Shandong",
        districts: ["Lixia (Jinan)", "Shinan (Qingdao)", "Laoshan (Qingdao)", "Yantai", "Weifang"]
      },
      {
        name: "Chongqing",
        districts: ["Yuzhong", "Jiangbei", "Yubei", "Jiulongpo", "Shapingba", "Nan'an"]
      },
      {
        name: "Shaanxi",
        districts: ["Yanta (Xi'an)", "Beilin (Xi'an)", "Weiyang (Xi'an)", "Baoji", "Xianyang"]
      }
    ]
  }
];

// District & State Estimated Coordinates Mapping
const DISTRICT_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  // INDIA - Maharashtra
  "mumbai suburban": { lat: 19.1136, lng: 72.8697 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "thane": { lat: 19.2183, lng: 72.9781 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  "aurangabad": { lat: 19.8762, lng: 75.3433 },
  "solapur": { lat: 17.6599, lng: 75.9064 },
  "kolhapur": { lat: 16.7050, lng: 74.2433 },
  "maharashtra": { lat: 19.7515, lng: 75.7139 },

  // INDIA - Delhi NCT
  "central delhi": { lat: 28.6448, lng: 77.2167 },
  "south delhi": { lat: 28.5355, lng: 77.1994 },
  "north delhi": { lat: 28.7041, lng: 77.1025 },
  "east delhi": { lat: 28.6280, lng: 77.2950 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "dwarka": { lat: 28.5921, lng: 77.0460 },
  "rohini": { lat: 28.7495, lng: 77.0565 },
  "delhi nct": { lat: 28.7041, lng: 77.1025 },

  // INDIA - Karnataka
  "bengaluru urban": { lat: 12.9716, lng: 77.5946 },
  "mysuru": { lat: 12.2958, lng: 76.6394 },
  "dharwad": { lat: 15.4589, lng: 75.0078 },
  "mangaluru": { lat: 12.9141, lng: 74.8560 },
  "belagavi": { lat: 15.8497, lng: 74.4977 },
  "hubballi": { lat: 15.3647, lng: 75.1240 },
  "kalaburagi": { lat: 17.3297, lng: 76.8343 },
  "karnataka": { lat: 15.3173, lng: 75.7139 },

  // INDIA - Uttar Pradesh
  "lucknow": { lat: 26.8467, lng: 80.9462 },
  "varanasi": { lat: 25.3176, lng: 82.9739 },
  "kanpur nagar": { lat: 26.4499, lng: 80.3319 },
  "agra": { lat: 27.1767, lng: 78.0081 },
  "noida (gb nagar)": { lat: 28.5355, lng: 77.3910 },
  "noida": { lat: 28.5355, lng: 77.3910 },
  "prayagraj": { lat: 25.4358, lng: 81.8463 },
  "ghaziabad": { lat: 28.6692, lng: 77.4538 },
  "meerut": { lat: 28.9845, lng: 77.7064 },
  "uttar pradesh": { lat: 26.8467, lng: 80.9462 },

  // INDIA - Tamil Nadu
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "coimbatore": { lat: 11.0168, lng: 76.9558 },
  "madurai": { lat: 9.9252, lng: 78.1198 },
  "tiruchirappalli": { lat: 10.7905, lng: 78.7047 },
  "salem": { lat: 11.6643, lng: 78.1460 },
  "tirunelveli": { lat: 8.7139, lng: 77.7567 },
  "vellore": { lat: 12.9165, lng: 79.1325 },
  "tamil nadu": { lat: 11.1271, lng: 78.6569 },

  // INDIA - Gujarat
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "surat": { lat: 21.1702, lng: 72.8311 },
  "vadodara": { lat: 22.3072, lng: 73.1812 },
  "rajkot": { lat: 22.3039, lng: 70.8022 },
  "bhavnagar": { lat: 21.7645, lng: 72.1519 },
  "gandhinagar": { lat: 23.2156, lng: 72.6369 },
  "jamnagar": { lat: 22.4707, lng: 70.0577 },
  "gujarat": { lat: 22.2587, lng: 71.1924 },

  // INDIA - West Bengal
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "north 24 parganas": { lat: 22.6168, lng: 88.4029 },
  "howrah": { lat: 22.5958, lng: 88.2636 },
  "darjeeling": { lat: 27.0410, lng: 88.2663 },
  "south 24 parganas": { lat: 22.1352, lng: 88.4019 },
  "siliguri": { lat: 26.7271, lng: 88.3953 },
  "west bengal": { lat: 22.9868, lng: 87.8550 },

  // INDIA - Telangana & Andhra Pradesh
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "secunderabad": { lat: 17.4399, lng: 78.4983 },
  "warangal": { lat: 17.9689, lng: 79.5941 },
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "vijayawada": { lat: 16.5062, lng: 80.6480 },
  "guntur": { lat: 16.3067, lng: 80.4365 },
  "telangana": { lat: 18.1124, lng: 79.0193 },
  "andhra pradesh": { lat: 15.9129, lng: 79.7400 },

  // INDIA - Rajasthan & others
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "jodhpur": { lat: 26.2389, lng: 73.0243 },
  "udaipur": { lat: 24.5854, lng: 73.7125 },
  "indore": { lat: 22.7196, lng: 75.8577 },
  "bhopal": { lat: 23.2599, lng: 77.4126 },
  "thiruvananthapuram": { lat: 8.5241, lng: 76.9366 },
  "ernakulam (kochi)": { lat: 9.9312, lng: 76.2673 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "ludhiana": { lat: 30.9010, lng: 75.8573 },
  "amritsar": { lat: 31.6340, lng: 74.8723 },
  "gurugram": { lat: 28.4595, lng: 77.0266 },
  "patna": { lat: 25.5941, lng: 85.1376 },
  "bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "guwahati (kamrup)": { lat: 26.1445, lng: 91.7362 },
  "guwahati": { lat: 26.1445, lng: 91.7362 },
  "ranchi": { lat: 23.3441, lng: 85.3096 },
  "raipur": { lat: 21.2514, lng: 81.6296 },
  "dehradun": { lat: 30.3165, lng: 78.0322 },
  "shimla": { lat: 31.1048, lng: 77.1734 },
  "panaji": { lat: 15.4909, lng: 73.8278 },
  "srinagar": { lat: 34.0837, lng: 74.7973 },

  // BRAZIL
  "zona leste": { lat: -23.5412, lng: -46.5298 },
  "zona sul": { lat: -23.6500, lng: -46.6833 },
  "centro": { lat: -23.5505, lng: -46.6333 },
  "zona norte": { lat: -23.4900, lng: -46.6200 },
  "campinas": { lat: -22.9099, lng: -47.0626 },
  "guarulhos": { lat: -23.4538, lng: -46.5333 },
  "são paulo": { lat: -23.5505, lng: -46.6333 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729 },
  "zona sul (copacabana)": { lat: -22.9711, lng: -43.1822 },
  "zona norte (tijuca)": { lat: -22.9329, lng: -43.2437 },
  "niterói": { lat: -22.8833, lng: -43.1039 },
  "belo horizonte": { lat: -19.9167, lng: -43.9345 },
  "salvador (centro)": { lat: -12.9714, lng: -38.5014 },
  "curitiba": { lat: -25.4290, lng: -49.2671 },
  "porto alegre": { lat: -30.0346, lng: -51.2177 },
  "recife": { lat: -8.0476, lng: -34.8770 },
  "fortaleza": { lat: -3.7319, lng: -38.5267 },
  "brasília (plano piloto)": { lat: -15.7975, lng: -47.8919 },
  "brasília": { lat: -15.7975, lng: -47.8919 },
  "florianópolis": { lat: -27.5954, lng: -48.5480 },
  "goiânia": { lat: -16.6869, lng: -49.2648 },
  "manaus centro": { lat: -3.1190, lng: -60.0217 },
  "manaus": { lat: -3.1190, lng: -60.0217 },

  // RUSSIA
  "central administrative okrug": { lat: 55.7558, lng: 37.6173 },
  "moscow federal city": { lat: 55.7558, lng: 37.6173 },
  "moscow": { lat: 55.7558, lng: 37.6173 },
  "saint petersburg": { lat: 59.9343, lng: 30.3351 },
  "nevsky district": { lat: 59.8800, lng: 30.4500 },
  "tsentralny district": { lat: 59.9300, lng: 30.3600 },
  "khimki": { lat: 55.8889, lng: 37.4417 },
  "yekaterinburg central": { lat: 56.8389, lng: 60.6057 },
  "yekaterinburg": { lat: 56.8389, lng: 60.6057 },
  "krasnodar central": { lat: 45.0355, lng: 38.9753 },
  "sochi (adler)": { lat: 43.4289, lng: 39.9234 },
  "sochi": { lat: 43.5855, lng: 39.7231 },
  "kazan (vakhitovsky)": { lat: 55.7887, lng: 49.1221 },
  "kazan": { lat: 55.7887, lng: 49.1221 },
  "novosibirsk central": { lat: 55.0084, lng: 82.9357 },
  "novosibirsk": { lat: 55.0084, lng: 82.9357 },
  "nizhny novgorod (nizhegorodsky)": { lat: 56.2965, lng: 43.9361 },
  "nizhny novgorod": { lat: 56.2965, lng: 43.9361 },
  "rostov-on-don (voroshilovsky)": { lat: 47.2357, lng: 39.7015 },
  "samara (leninsky)": { lat: 53.1959, lng: 50.1001 },

  // SOUTH AFRICA
  "johannesburg central": { lat: -26.2041, lng: 28.0473 },
  "johannesburg": { lat: -26.2041, lng: 28.0473 },
  "soweto": { lat: -26.2708, lng: 27.8585 },
  "sandton": { lat: -26.1076, lng: 28.0567 },
  "tshwane (pretoria)": { lat: -25.7479, lng: 28.2293 },
  "pretoria": { lat: -25.7479, lng: 28.2293 },
  "city of cape town (cbd)": { lat: -33.9249, lng: 18.4241 },
  "cape town": { lat: -33.9249, lng: 18.4241 },
  "stellenbosch": { lat: -33.9321, lng: 18.8602 },
  "ethekwini (durban central)": { lat: -29.8587, lng: 31.0218 },
  "durban": { lat: -29.8587, lng: 31.0218 },
  "nelson mandela bay (gqeberha/port elizabeth)": { lat: -33.9608, lng: 25.6022 },
  "port elizabeth": { lat: -33.9608, lng: 25.6022 },
  "mangaung (bloemfontein)": { lat: -29.0852, lng: 26.1596 },
  "polokwane": { lat: -23.9045, lng: 29.4689 },
  "mbombela (nelspruit)": { lat: -25.4753, lng: 30.9694 },
  "rustenburg": { lat: -25.6544, lng: 27.2438 },
  "kimberley (sol plaatje)": { lat: -28.7282, lng: 24.7499 },

  // CHINA
  "chaoyang": { lat: 39.9219, lng: 116.4431 },
  "haidian": { lat: 39.9593, lng: 116.2984 },
  "dongcheng": { lat: 39.9284, lng: 116.4164 },
  "beijing": { lat: 39.9042, lng: 116.4074 },
  "pudong new area": { lat: 31.2215, lng: 121.5447 },
  "huangpu": { lat: 31.2317, lng: 121.4844 },
  "shanghai": { lat: 31.2304, lng: 121.4737 },
  "tianhe (guangzhou)": { lat: 23.1246, lng: 113.3614 },
  "guangzhou": { lat: 23.1291, lng: 113.2644 },
  "nanshan (shenzhen)": { lat: 22.5333, lng: 113.9304 },
  "futian (shenzhen)": { lat: 22.5218, lng: 114.0550 },
  "shenzhen": { lat: 22.5431, lng: 114.0579 },
  "xihu (hangzhou)": { lat: 30.2592, lng: 120.1302 },
  "hangzhou": { lat: 30.2741, lng: 120.1551 },
  "xuanwu (nanjing)": { lat: 32.0620, lng: 118.7969 },
  "nanjing": { lat: 32.0603, lng: 118.7969 },
  "wuhou (chengdu)": { lat: 30.6419, lng: 104.0435 },
  "chengdu": { lat: 30.5728, lng: 104.0668 },
  "wuchang (wuhan)": { lat: 30.5539, lng: 114.3162 },
  "wuhan": { lat: 30.5928, lng: 114.3055 },
  "lixia (jinan)": { lat: 36.6512, lng: 117.0427 },
  "yuzhong": { lat: 29.5630, lng: 106.5516 },
  "chongqing": { lat: 29.5630, lng: 106.5516 },
  "yanta (xi'an)": { lat: 34.2225, lng: 108.9480 },
  "xi'an": { lat: 34.3416, lng: 108.9398 }
};

export function getStatesForCountry(countryName: string): string[] {
  const c = COUNTRIES_DATA.find((item) => item.name.toLowerCase() === countryName.toLowerCase() || item.id.toLowerCase() === countryName.toLowerCase());
  if (c && c.states.length > 0) {
    return c.states.map((s) => s.name);
  }
  return COUNTRIES_DATA[0].states.map((s) => s.name);
}

export function getDistrictsForState(countryName: string, stateName: string): string[] {
  const c = COUNTRIES_DATA.find((item) => item.name.toLowerCase() === countryName.toLowerCase() || item.id.toLowerCase() === countryName.toLowerCase());
  if (c) {
    const s = c.states.find((st) => st.name.toLowerCase() === stateName.toLowerCase());
    if (s && s.districts.length > 0) {
      return s.districts;
    }
  }
  return [];
}

/**
 * Calculates estimated coordinates (lat, lng, zoom, label) for a given country, state, and district.
 */
export function getLocationCoordinates(countryName: string, stateName?: string, districtName?: string): LocationCoordinates {
  const cleanDistrict = districtName?.trim().toLowerCase() || "";
  const cleanState = stateName?.trim().toLowerCase() || "";
  const cleanCountry = countryName?.trim().toLowerCase() || "india";

  // 1. Direct district match
  if (cleanDistrict) {
    if (DISTRICT_COORDINATES_MAP[cleanDistrict]) {
      return {
        lat: DISTRICT_COORDINATES_MAP[cleanDistrict].lat,
        lng: DISTRICT_COORDINATES_MAP[cleanDistrict].lng,
        zoom: 13,
        label: `${districtName}, ${stateName || countryName}`,
        isEstimated: false,
      };
    }

    // Try stripping parentheses (e.g. "Noida (GB Nagar)" -> "noida")
    const simplified = cleanDistrict.replace(/\s*\([^)]*\)/g, "").trim();
    if (simplified && DISTRICT_COORDINATES_MAP[simplified]) {
      return {
        lat: DISTRICT_COORDINATES_MAP[simplified].lat,
        lng: DISTRICT_COORDINATES_MAP[simplified].lng,
        zoom: 13,
        label: `${districtName}, ${stateName || countryName}`,
        isEstimated: false,
      };
    }
  }

  // 2. State match
  if (cleanState && DISTRICT_COORDINATES_MAP[cleanState]) {
    return {
      lat: DISTRICT_COORDINATES_MAP[cleanState].lat,
      lng: DISTRICT_COORDINATES_MAP[cleanState].lng,
      zoom: 9,
      label: `${stateName}, ${countryName}`,
      isEstimated: true,
    };
  }

  // 3. Country match
  const c = COUNTRIES_DATA.find(
    (item) => item.name.toLowerCase() === cleanCountry || item.id.toLowerCase() === cleanCountry
  );
  if (c) {
    return {
      lat: c.lat,
      lng: c.lng,
      zoom: 5,
      label: `${c.name}`,
      isEstimated: true,
    };
  }

  // Default fallback (India Center)
  return {
    lat: 20.5937,
    lng: 78.9629,
    zoom: 5,
    label: "India",
    isEstimated: true,
  };
}

/**
 * Calculates Haversine distance in kilometers between two geo coordinates.
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DetectedLocationResult {
  country: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  formattedAddress?: string;
  source: "geocoding_api" | "local_nearest_match";
}

/**
 * Given GPS coordinates (lat, lng), finds the closest known BRICS country, state, and district.
 */
export function findClosestLocation(userLat: number, userLng: number): { country: string; state: string; district: string } {
  let closestDist = Infinity;
  let bestCountry = "India";
  let bestState = "Maharashtra";
  let bestDistrict = "Mumbai Suburban";

  // First determine closest country
  let minCountryDist = Infinity;
  for (const c of COUNTRIES_DATA) {
    const dist = getDistanceKm(userLat, userLng, c.lat, c.lng);
    if (dist < minCountryDist) {
      minCountryDist = dist;
      bestCountry = c.name;
    }
  }

  // Find country object
  const targetCountry = COUNTRIES_DATA.find((c) => c.name === bestCountry) || COUNTRIES_DATA[0];

  // Search districts within that country
  for (const st of targetCountry.states) {
    for (const dist of st.districts) {
      const clean = dist.toLowerCase();
      const coords = DISTRICT_COORDINATES_MAP[clean] || DISTRICT_COORDINATES_MAP[clean.replace(/\s*\([^)]*\)/g, "").trim()];
      if (coords) {
        const d = getDistanceKm(userLat, userLng, coords.lat, coords.lng);
        if (d < closestDist) {
          closestDist = d;
          bestCountry = targetCountry.name;
          bestState = st.name;
          bestDistrict = dist;
        }
      }
    }
  }

  return {
    country: bestCountry,
    state: bestState,
    district: bestDistrict,
  };
}

/**
 * Detects user location via browser GPS coordinates, optionally calling Google Geocoding API if key is present.
 */
export async function detectLocationFromGPS(lat: number, lng: number): Promise<DetectedLocationResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results && data.results.length > 0) {
          const first = data.results[0];
          let foundCountry = "";
          let foundState = "";
          let foundDistrict = "";

          for (const comp of first.address_components) {
            if (comp.types.includes("country")) {
              foundCountry = comp.long_name;
            }
            if (comp.types.includes("administrative_area_level_1")) {
              foundState = comp.long_name;
            }
            if (
              comp.types.includes("administrative_area_level_2") ||
              comp.types.includes("administrative_area_level_3") ||
              comp.types.includes("locality")
            ) {
              if (!foundDistrict) foundDistrict = comp.long_name;
            }
          }

          // Match found country to our BRICS countries if possible
          const matchedCountry = COUNTRIES_DATA.find(
            (c) => c.name.toLowerCase() === foundCountry.toLowerCase()
          );

          if (matchedCountry) {
            // Find closest state in country
            const matchedState = matchedCountry.states.find(
              (s) => s.name.toLowerCase().includes(foundState.toLowerCase()) || foundState.toLowerCase().includes(s.name.toLowerCase())
            );

            return {
              country: matchedCountry.name,
              state: matchedState ? matchedState.name : (matchedCountry.states[0]?.name || ""),
              district: foundDistrict || (matchedState?.districts[0] || ""),
              lat,
              lng,
              formattedAddress: first.formatted_address,
              source: "geocoding_api",
            };
          }
        }
      }
    } catch {
      // Fallback gracefully to spatial nearest match
    }
  }

  // Spatial nearest match fallback
  const localMatch = findClosestLocation(lat, lng);
  return {
    country: localMatch.country,
    state: localMatch.state,
    district: localMatch.district,
    lat,
    lng,
    source: "local_nearest_match",
  };
}

