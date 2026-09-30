export type ClassificationSource = "gemini" | "rule-based";
export type ClassificationConfidence = "high" | "medium" | "low";

export type ClassificationResult = {
  category: "roads" | "water" | "electricity" | "sanitation" | "health" | "education" | "other";
  urgency: number;
  summary_english: string;
  language_detected: string;
  english_translation?: string;
  keywords: string[];
  classified_by: ClassificationSource;
  confidence: ClassificationConfidence;
};

export interface DetectedLanguage {
  code: "hi" | "bn" | "te" | "ta" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "en";
  name: string;
}

/**
 * Detect language from text using script range analysis and lexical markers
 * for Hindi vs Marathi (both use Devanagari).
 */
export function detectLanguageFromText(text: string): DetectedLanguage {
  const clean = (text || "").trim();
  if (!clean) return { code: "en", name: "English" };

  // Script count matches
  const counts = {
    bengali: (clean.match(/[\u0980-\u09FF]/g) || []).length,
    gurmukhi: (clean.match(/[\u0A00-\u0A7F]/g) || []).length,
    gujarati: (clean.match(/[\u0A80-\u0AFF]/g) || []).length,
    odia: (clean.match(/[\u0B00-\u0B7F]/g) || []).length,
    tamil: (clean.match(/[\u0B80-\u0BFF]/g) || []).length,
    telugu: (clean.match(/[\u0C00-\u0C7F]/g) || []).length,
    kannada: (clean.match(/[\u0C80-\u0CFF]/g) || []).length,
    malayalam: (clean.match(/[\u0D00-\u0D7F]/g) || []).length,
    devanagari: (clean.match(/[\u0900-\u097F]/g) || []).length,
  };

  if (counts.bengali >= 3) return { code: "bn", name: "Bengali" };
  if (counts.gurmukhi >= 3) return { code: "pa", name: "Punjabi" };
  if (counts.gujarati >= 3) return { code: "gu", name: "Gujarati" };
  if (counts.odia >= 3) return { code: "or", name: "Odia" };
  if (counts.tamil >= 3) return { code: "ta", name: "Tamil" };
  if (counts.telugu >= 3) return { code: "te", name: "Telugu" };
  if (counts.kannada >= 3) return { code: "kn", name: "Kannada" };
  if (counts.malayalam >= 3) return { code: "ml", name: "Malayalam" };

  if (counts.devanagari >= 3) {
    // Distinguish Marathi from Hindi using distinct Marathi grammatical markers and inflections
    const marathiMarkers = [
      "आहे", "नाही", "झाले", "झाला", "केले", "करावे", "करावा", "द्यावी", "पाहिजे", "होत", "होती",
      "च्या", "चे", "ची", "मध्ये", "तील", "वरून", "कडे", "पासून",
      "आमच्या", "माझ्या", "त्यांच्या", "आपल्या",
      "गावात", "गावातील", "शहरातील", "भागात", "रस्त्यावर", "रस्त्याची", "खड्ड्यां",
      "पाण्याचा", "गटाराचे", "शाळेची", "शाळेत", "दवाखान्यात", "लोकांना", "तातडीने"
    ];
    if (marathiMarkers.some((marker) => clean.includes(marker))) {
      return { code: "mr", name: "Marathi" };
    }
    return { code: "hi", name: "Hindi" };
  }

  return { code: "en", name: "English" };
}

export const CATEGORY_KEYWORDS: Record<ClassificationResult["category"], string[]> = {
  roads: [
    // English
    "road", "roads", "pothole", "potholes", "pavement", "bridge", "highway", "street", "crater", "asphalt", "traffic", "flyover", "culvert", "accident",
    // Hindi
    "सड़क", "सड़क", "सड़कें", "गड्ढा", "गड्ढे", "पुल", "मार्ग", "हाईवे", "रास्ता", "डामर", "दुर्घटना",
    // Bengali
    "রাস্তা", "সড়ক", "গর্ত", "সেতু", "ব্রিজ", "কালভার্ট", "মহাসড়ক", "পিচ", "দুর্ঘটনা",
    // Tamil
    "சாலை", "ரோடு", "பள்ளம்", "பாலம்", "நெடுஞ்சாலை", "தெரு", "விபத்து", "போக்குவரத்து",
    // Telugu
    "రోడ్డు", "గుంతలు", "వంతెన", "రహదారి", "వీధి", "ప్రమాదం", "ట్రాఫిక్", "తారు",
    // Marathi
    "रस्ता", "रस्ते", "खड्डे", "खड्डा", "पूल", "महामार्ग", "अपघात", "डांबर", "वाहतूक",
    // Gujarati
    "રસ્તો", "ખાડા", "પુલ", "હાઇવે", "શેરી", "અકસ્માત", "ટ્રાફિક",
    // Kannada
    "ರಸ್ತೆ", "ಗುಂಡಿ", "ಸೇತುವೆ", "ಹೆದ್ದಾರಿ", "ಬೀದಿ", "ಅಪಘಾತ",
    // Malayalam
    "റോഡ്", "കുഴി", "പാലം", "ഹൈവേ", "തെരുവ്", "അപകടം",
    // Punjabi
    "ਸੜਕ", "ਟੋਏ", "ਪੁਲ", "ਹਾਈਵੇ", "ਗਲੀ", "ਹਾਦਸਾ",
    // Odia
    "ରାସ୍ତା", "ଖାଲ", "ପୋଲ", "ରାଜପଥ", "ଦୁର୍ଘଟଣା", "ଗଳି",
  ],
  water: [
    // English
    "water", "pipeline", "leak", "leakage", "tap", "drinking", "contamination", "supply", "borewell", "handpump", "drain", "pressure", "scarcity",
    // Hindi
    "पानी", "जल", "नल", "पाइप", "रिसाव", "पेयजल", "बोरवेल", "हैंडपंप", "आपूर्ति", "दूषित", "खारा",
    // Bengali
    "জল", "পানি", "পাইপলাইন", "নলকূপ", "কল", "লিকেজ", "পানীয়", "সরবরাহ", "দূষণ",
    // Tamil
    "தண்ணீர்", "குடிநீர்", "குழாய்", "கசிவு", "கைக்குழாய்", "விநியோகம்", "மாசுபாடு",
    // Telugu
    "నీరు", "మంచి నీరు", "తాగునీరు", "పైప్", "పైప్‌లైన్", "లీకేజీ", "నల్లా", "చేతిపంపు", "సరఫరా",
    // Marathi
    "पाणी", "नळ", "पाईप", "पाईपलाईन", "गळती", "पिण्याचे", "दूषित", "पुरवठा", "हँडपंप", "बोअरवेल",
    // Gujarati
    "પાણી", "પીવાનું", "પાઈપ", "લીકેજ", "નળ", "બોરવેલ", "પુરવઠો", "દૂષિત",
    // Kannada
    "ನೀರು", "ಕುಡಿಯುವ", "ಕೊಳವೆ", "ಸೋರಿಕೆ", "ನಲ್ಲಿ", "ಬೋರ್‌ವೆಲ್", "ಪೂರೈಕೆ",
    // Malayalam
    "വെള്ളം", "കുടിവെള്ളം", "പൈപ്പ്", "ചോർച്ച", "ടാപ്പ്", "വിതരണം", "മലിനജലം",
    // Punjabi
    "ਪਾਣੀ", "ਪਾਈਪ", "ਲੀਕੇਜ", "ਨਲਕਾ", "ਸਪਲਾਈ", "ਗੰਦਾ",
    // Odia
    "ପାଣି", "ଜଳ", "ପାଇପ୍", "ଚୁଆଁ", "ନଳକୂପ", "ଯୋଗାଣ", "ଦୂଷିତ",
  ],
  electricity: [
    // English
    "electricity", "power", "blackout", "transformer", "voltage", "wiring", "wire", "outage", "sparking", "shock", "streetlight", "meter", "current",
    // Hindi
    "बिजली", "विद्युत", "करंट", "ट्रांसफॉर्मर", "तार", "वोल्टेज", "कटौती", "अंधेरा", "स्ट्रीट", "मीटर", "शॉर्ट",
    // Bengali
    "বিদ্যুৎ", "কারেন্ট", "ট্রান্সফরমার", "তার", "ভোল্টেজ", "লোডশেডিং", "অন্ধকার", "বাতি",
    // Tamil
    "மின்சாரம்", "மின்விளக்கு", "டிரான்ஸ்பார்மர்", "கம்பம்", "மின்தடை", "மின்சாரம்", "வயர்",
    // Telugu
    "విద్యుత్", "కరెంట్", "ట్రాన్స్‌ఫార్మర్", "తీగలు", "వోల్టేజ్", "కోత", "చీకటి", "స్ట్రీట్‌లైట్",
    // Marathi
    "वीज", "लाईट", "विद्युत", "ट्रान्सफॉर्मर", "तारा", "व्होल्टेज", "अंधार", "दिवाबत्ती", "शॉर्ट",
    // Gujarati
    "વીજળી", "પાવર", "ટ્રાન્સફોર્મર", "વાયરિંગ", "વોલ્ટેજ", "કાપ", "અંધારું", "સ્ટ્રીટલાઇટ",
    // Kannada
    "ವಿದ್ಯುತ್", "ಕರೆಂಟ್", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್", "ತಂತಿ", "ವೋಲ್ಟೇಜ್", "ಕತ್ತಲೆ", "ಬೀದಿದೀಪ",
    // Malayalam
    "വൈദ്യുതി", "കറന്റ്", "ട്രാൻസ്ഫോർമർ", "കമ്പി", "വോൾട്ടേജ്", "തടസ്സം", "സ്ട്രീറ്റ്",
    // Punjabi
    "ਬਿਜਲੀ", "ਟਰਾਂਸਫਾਰਮਰ", "ਤਾਰਾਂ", "ਵੋਲਟੇਜ", "ਕੱਟ", "ਹਨੇਰਾ", "ਸਟਰੀਟ",
    // Odia
    "ବିଜୁଳି", "ବିଦ୍ୟୁତ", "ଟ୍ରାନ୍ସଫର୍ମର", "ତାର", "ଭୋଲ୍ଟେଜ", "ଅନ୍ଧକାର", "ଆଲୋକ",
  ],
  sanitation: [
    // English
    "garbage", "waste", "trash", "sewage", "sewer", "drain", "drainage", "mosquito", "latrine", "toilet", "stagnant", "dump", "cleanliness", "swachh",
    // Hindi
    "कचरा", "नाला", "नाली", "सीवर", "गंदगी", "मच्छर", "शौचालय", "सफाई", "कचरे", "कूड़ेदान",
    // Bengali
    "আবর্জনা", "ময়লা", "নর্দমা", "ড্রেন", "পয়ঃনিষ্কাশন", "মশা", "টয়লেট", "শৌচাগার", "পরিষ্কার",
    // Tamil
    "குப்பை", "சாக்கடை", "கழிவுநீர்", "கொசு", "கழிப்பறை", "தூய்மை",
    // Telugu
    "చెత్త", "కాలువ", "మురుగు", "మురుగునీరు", "డ్రైనేజీ", "దోమలు", "మరుగుదొడ్డి", "పూడిక",
    // Marathi
    "कचरा", "गटार", "सांडपाणी", "घाण", "डास", "स्वच्छता", "शौचालय",
    // Gujarati
    "કચરો", "ગટર", "ગંદકી", "મચ્છર", "શૌચાલય", "ડ્રેનેજ", "સફાઈ",
    // Kannada
    "ಕಸ", "ಚರಂಡಿ", "ತ್ಯಾಜ್ಯ", "ಒಳಚರಂಡಿ", "ಸೊಳ್ಳೆ", "ಶೌಚಾಲಯ",
    // Malayalam
    "മാലിന്യം", "ഓട", "ഡ്രെയിനേജ്", "കൊതുക്", "ടോയ്‌ലറ്റ്", "ശുചിത്വം",
    // Punjabi
    "ਕੂੜਾ", "ਗੰਦਗੀ", "ਨਾਲੀ", "ਸੀਵਰੇਜ", "ਮੱਛਰ", "ਗਟਰ", "ਸਫ਼ਾਈ",
    // Odia
    "ଆବର୍ଜନା", "ଅଳିଆ", "ନାଳ", "ଡ୍ରେନ୍", "ମଇଳା", "ମଶା", "ପାଇଖାନା",
  ],
  health: [
    // English
    "health", "hospital", "clinic", "doctor", "ambulance", "medicine", "disease", "fever", "epidemic", "phc", "chc", "dispensary", "aspataal", "dawa",
    // Hindi
    "अस्पताल", "डॉक्टर", "दवा", "बीमारी", "एम्बुलेंस", "स्वास्थ्य", "इलाज", "बुखार",
    // Bengali
    "হাসপাতাল", "ডাক্তার", "ওষুধ", "রোগ", "অ্যাম্বুলেন্স", "স্বাস্থ্য", "চিকিৎসা",
    // Tamil
    "மருத்துவமனை", "டாக்டர்", "மருந்து", "நோய்", "ஆம்புலன்ஸ்", "சுகாதாரம்", "காய்ச்சல்",
    // Telugu
    "ఆసుపత్రి", "వైద్యుడు", "మందులు", "రోగి", "వ్యాధి", "అంబులెన్స్", "ఆరోగ్యం", "వైద్య", "జ్వరం",
    // Marathi
    "रुग्णालय", "दवाखाना", "डॉक्टर", "औषध", "औषधे", "आजार", "आरोग्य", "रुग्णवाहिका", "उपचार",
    // Gujarati
    "હોસ્પિટલ", "ડોક્ટર", "દવા", "બીમારી", "એમ્બ્યુલન્સ", "આરોગ્ય", "સારવાર",
    // Kannada
    "ಆಸ್ಪತ್ರೆ", "ವೈದ್ಯರು", "ಔಷಧಿ", "ರೋಗ", "ಆಂಬ್ಯುಲೆನ್ಸ್", "ಆರೋಗ್ಯ", "ಚಿಕಿತ್ಸೆ",
    // Malayalam
    "ആശുപത്രി", "ഡോക്ടർ", "മരുന്ന്", "രോഗം", "ആംബുലൻസ്", "ആരോഗ്യം", "ചികിത്സ",
    // Punjabi
    "ਹਸਪਤਾਲ", "ਡਾਕਟਰ", "ਦਵਾਈ", "ਬਿਮਾਰੀ", "ਐਂਬੂਲੈਂਸ", "ਸਿਹਤ", "ਇਲਾਜ",
    // Odia
    "ଡାକ୍ତରଖାନା", "ଡାକ୍ତର", "ଔଷଧ", "ରୋଗ", "ଆମ୍ବୁଲାନ୍ସ", "ସ୍ୱାସ୍ଥ୍ୟ", "ଚିକିତ୍ସା",
  ],
  education: [
    // English
    "school", "college", "teacher", "classroom", "student", "exam", "education", "books", "desk", "principal", "anganwadi", "shiksha", "vidyalaya",
    // Hindi
    "स्कूल", "विद्यालय", "शिक्षक", "छात्र", "शिक्षा", "अध्यापक", "कक्षा", "आंगनवाड़ी",
    // Bengali
    "স্কুল", "বিদ্যালয়", "শিক্ষক", "ছাত্র", "শিক্ষা", "শ্রেণিকক্ষ", "কলেজ",
    // Tamil
    "பள்ளி", "கல்லூரி", "ஆசிரியர்", "மாணவர்", "கல்வி", "வகுப்பறை",
    // Telugu
    "పాఠశాల", "పాఠశాలలో", "బడి", "కళాశాల", "ఉపాధ్యాయుడు", "విద్యార్థి", "విద్య", "తరగతి",
    // Marathi
    "शाळा", "शाळेची", "शाळेचे", "शाळेत", "विद्यार्थ्यांच्या", "महाविद्यालय", "शिक्षक", "विद्यार्थी", "शिक्षण", "वर्गखोली", "अंगणवाडी",
    // Gujarati
    "શાળા", "કોલેજ", "શિક્ષક", "વિદ્યાર્થી", "શિક્ષણ", "વર્ગખંડ", "આંગણવાડી",
    // Kannada
    "ಶಾಲೆ", "ಕಾಲೇಜು", "ಶಿಕ್ಷಕರು", "ವಿದ್ಯಾರ್ಥಿ", "ಶಿಕ್ಷಣ", "ತರಗತಿ",
    // Malayalam
    "സ്കൂൾ", "കോളേജ്", "അധ്യാപകൻ", "വിദ್ಯಾർത്ഥി", "വിദ್ಯಾഭ്യാസം", "ക്ലാസ്",
    // Punjabi
    "ਸਕੂਲ", "ਕਾਲਜ", "ਅਧਿਆਪਕ", "ਵਿਦਿਆਰਥੀ", "ਸਿੱਖਿਆ", "ਜਮਾਤ",
    // Odia
    "ବିଦ୍ୟାଳୟ", "ସ୍କୁଲ", "ଶିକ୍ଷକ", "ଛାତ୍ର", "ଶିକ୍ଷା", "ଶ୍ରେଣୀଗୃହ", "ପାଠପଢ଼ା",
  ],
  other: [],
};

export const CATEGORY_ORDER: ClassificationResult["category"][] = [
  "roads",
  "water",
  "electricity",
  "sanitation",
  "health",
  "education",
];

function tokensFor(text: string): Set<string> {
  return new Set((text.toLocaleLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || []));
}

export function ruleBasedClassify(text: string): ClassificationResult {
  const cleanText = String(text || "").trim();
  const lang = detectLanguageFromText(cleanText);
  const tokens = tokensFor(cleanText);

  const matches = CATEGORY_ORDER.map((category) => {
    const matched = CATEGORY_KEYWORDS[category].filter((keyword) => {
      const lower = keyword.toLocaleLowerCase();
      if (tokens.has(lower)) return true;
      // Substring check for non-Latin script words (agglutinative languages like Tamil/Telugu/Malayalam/Kannada)
      if (lower.length >= 3 && cleanText.toLocaleLowerCase().includes(lower)) return true;
      return false;
    });
    return {
      category,
      keywords: matched,
    };
  }).filter((entry) => entry.keywords.length > 0);

  if (matches.length === 0) {
    return {
      category: "other",
      urgency: 3,
      summary_english: cleanText ? cleanText.slice(0, 100) : "Complaint details were not provided.",
      language_detected: lang.name,
      english_translation: cleanText ? cleanText.slice(0, 140) : "No details provided",
      keywords: ["unclassified"],
      classified_by: "rule-based",
      confidence: "low",
    };
  }

  const winner = matches.sort((left, right) => right.keywords.length - left.keywords.length)[0];
  
  // Multilingual high-urgency regex
  const highUrgencyPattern = /emergency|danger|death|fatal|collapsed|fire|explosion|flood|poison|outbreak|urgent|hazard|electrocution|sparking|shock|आपात|खतरा|दुर्घटना|गंभीर|मृत्यु|বিপদ|জরুরি|விபத்து|அவசரம்|ప్రమాదం|అత్యవసరం|धोका|तातडीने|કટોકટી|જોખમ|ತುರ್ತು|ಅಪಾಯ|അടിയന്തിരം|അപകടം|ਖ਼ਤਰਾ|ਐਮਰਜੈਂਸੀ|ବିପଦ|ଜରୁରୀ/;
  const isHighUrgency = highUrgencyPattern.test(cleanText.toLocaleLowerCase());
  const urgency = isHighUrgency ? 5 : 3;

  return {
    category: winner.category,
    urgency,
    summary_english: cleanText.slice(0, 100) || "Complaint details were not provided.",
    language_detected: lang.name,
    english_translation: cleanText.slice(0, 140),
    keywords: winner.keywords.slice(0, 5),
    classified_by: "rule-based",
    confidence: winner.keywords.length > 1 ? "high" : "medium",
  };
}

export function labelClassification(
  result: Omit<ClassificationResult, "classified_by" | "confidence"> & Partial<Pick<ClassificationResult, "classified_by" | "confidence">>,
  source: ClassificationSource,
  confidence: ClassificationConfidence
): ClassificationResult {
  return { ...result, classified_by: source, confidence };
}

export function parseGeminiClassification(raw: string, fallbackText: string): ClassificationResult {
  const parsed = JSON.parse(raw.replace(/```json/g, "").replace(/```/g, "").trim());
  const validCategories = ["roads", "water", "electricity", "sanitation", "health", "education", "other"];
  const category = String(parsed.category || "").toLowerCase();
  const urgency = Number(parsed.urgency);
  const summary = String(parsed.summary_english || "").trim();
  const language = String(parsed.language_detected || "").trim();
  const english_translation = parsed.english_translation ? String(parsed.english_translation).trim() : summary;
  const keywords = Array.isArray(parsed.keywords) && parsed.keywords.every((keyword: unknown) => typeof keyword === "string")
    ? parsed.keywords.slice(0, 5)
    : [];
  const confidence = parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low"
    ? parsed.confidence
    : typeof parsed.confidence === "number" && parsed.confidence >= 0.8
      ? "high"
      : typeof parsed.confidence === "number" && parsed.confidence >= 0.5
        ? "medium"
        : "low";

  if (!validCategories.includes(category) || !Number.isInteger(urgency) || urgency < 1 || urgency > 5 || !summary || !language || keywords.length === 0) {
    throw new Error("Gemini classification did not match the expected schema.");
  }

  return {
    category: category as ClassificationResult["category"],
    urgency,
    summary_english: summary,
    language_detected: language,
    english_translation,
    keywords,
    classified_by: "gemini",
    confidence,
  };
}
