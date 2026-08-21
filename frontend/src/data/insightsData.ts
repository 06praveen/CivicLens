/**
 * insightsData.ts — Demo AI-generated budget insights.
 * Replace with real RAG/LLM API responses when the backend is ready.
 */

export type InsightType = "increase" | "decrease" | "signal" | "yoy";

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  titleHi: string;
  body: string;
  bodyHi: string;
  stat: string;
  statPositive: boolean;
  sector: string;
  evidence: string;
  evidenceHi: string;
}

export const INSIGHTS: Insight[] = [
  {
    id: "I001",
    type: "increase",
    title: "Education spending increased by 18.0%",
    titleHi: "शिक्षा खर्च 18.0% बढ़ा",
    body: "The Ministry of Education received ₹12.1 L Cr in 2026–27, a significant jump from ₹10.25 L Cr in the previous year. The increase is driven by Samagra Shiksha expansion and new IIT/NIT funding.",
    bodyHi: "शिक्षा मंत्रालय को 2026–27 में ₹12.1 L करोड़ मिले, जो पिछले वर्ष के ₹10.25 L करोड़ से काफी अधिक है। यह वृद्धि समग्र शिक्षा विस्तार और नए IIT/NIT वित्त पोषण के कारण है।",
    stat: "+18.0%",
    statPositive: true,
    sector: "Education",
    evidence: "Union Budget 2026–27, Volume II, Page 142 — Ministry of Education",
    evidenceHi: "केंद्रीय बजट 2026–27, खंड II, पृष्ठ 142 — शिक्षा मंत्रालय",
  },
  {
    id: "I002",
    type: "increase",
    title: "Healthcare allocation rose by 12.7%",
    titleHi: "स्वास्थ्य सेवा आवंटन 12.7% बढ़ा",
    body: "Health spending reached ₹8.9 L Cr, boosted by Ayushman Bharat – PM-JAY beneficiary expansion and new AIIMS construction phases. Post-pandemic health infrastructure continues to receive priority.",
    bodyHi: "स्वास्थ्य खर्च ₹8.9 L करोड़ तक पहुंचा, जो आयुष्मान भारत – PM-JAY लाभार्थी विस्तार और नए AIIMS निर्माण चरणों से प्रेरित है।",
    stat: "+12.7%",
    statPositive: true,
    sector: "Healthcare",
    evidence: "Union Budget 2026–27, Volume II, Page 198 — Ministry of Health",
    evidenceHi: "केंद्रीय बजट 2026–27, खंड II, पृष्ठ 198 — स्वास्थ्य मंत्रालय",
  },
  {
    id: "I003",
    type: "decrease",
    title: "Road transport allocation fell by 8.2%",
    titleHi: "सड़क परिवहन आवंटन 8.2% घटा",
    body: "The Ministry of Road Transport & Highways saw a reduction from ₹8.5 L Cr to ₹7.8 L Cr. Officials attributed this to the completion of major Phase-I highway corridors, reducing new-construction requirements.",
    bodyHi: "सड़क परिवहन एवं राजमार्ग मंत्रालय का आवंटन ₹8.5 L करोड़ से घटकर ₹7.8 L करोड़ हो गया।",
    stat: "-8.2%",
    statPositive: false,
    sector: "Infrastructure",
    evidence: "Union Budget 2026–27, Volume II, Page 234 — Ministry of Road Transport",
    evidenceHi: "केंद्रीय बजट 2026–27, खंड II, पृष्ठ 234 — सड़क परिवहन मंत्रालय",
  },
  {
    id: "I004",
    type: "signal",
    title: "Capital expenditure crossed ₹11 L Cr for the first time",
    titleHi: "पूंजी व्यय पहली बार ₹11 L करोड़ के पार",
    body: "Capital expenditure reached ₹11.11 L Cr, a record high. This marks the continuation of the government's infrastructure push with a 10.8% increase over 2025–26.",
    bodyHi: "पूंजी व्यय ₹11.11 L करोड़ तक पहुंचा, जो एक रिकॉर्ड उच्च है।",
    stat: "₹11.11 L Cr",
    statPositive: true,
    sector: "Overall",
    evidence: "Union Budget 2026–27, Key Features Document, Page 3",
    evidenceHi: "केंद्रीय बजट 2026–27, मुख्य विशेषताएं दस्तावेज़, पृष्ठ 3",
  },
  {
    id: "I005",
    type: "signal",
    title: "Fiscal deficit targeted at 4.4% of GDP",
    titleHi: "राजकोषीय घाटा GDP के 4.4% पर लक्षित",
    body: "The fiscal deficit is budgeted at ₹16.13 L Cr, equivalent to 4.4% of GDP — down from 4.9% in 2023–24, signaling continued consolidation despite higher capital spending.",
    bodyHi: "राजकोषीय घाटा ₹16.13 L करोड़ बजट किया गया है, जो GDP का 4.4% है।",
    stat: "4.4% GDP",
    statPositive: true,
    sector: "Fiscal",
    evidence: "Union Budget 2026–27, Fiscal Policy Statement, Page 12",
    evidenceHi: "केंद्रीय बजट 2026–27, राजकोषीय नीति वक्तव्य, पृष्ठ 12",
  },
  {
    id: "I006",
    type: "yoy",
    title: "MGNREGS budget increased 17.8% — largest rural jobs push in five years",
    titleHi: "MGNREGS बजट 17.8% बढ़ा — पाँच वर्षों में ग्रामीण रोजगार की सबसे बड़ी पहल",
    body: "MGNREGS received ₹8.6 L Cr, the highest in five years. This signals a strategic pivot toward rural demand support amid concerns about consumption-led growth in rural India.",
    bodyHi: "MGNREGS को ₹8.6 L करोड़ मिले, जो पांच वर्षों में सबसे अधिक है।",
    stat: "+17.8%",
    statPositive: true,
    sector: "Rural Development",
    evidence: "Union Budget 2026–27, Volume II, Page 289 — Ministry of Rural Development",
    evidenceHi: "केंद्रीय बजट 2026–27, खंड II, पृष्ठ 289 — ग्रामीण विकास मंत्रालय",
  },
];

// ── Demo chat responses ────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

function makeReply(content: string, sources: string[]): { content: string; sources: string[] } {
  return { content, sources };
}

export const DEMO_RESPONSES: Record<string, ReturnType<typeof makeReply>> = {
  default: makeReply(
    "I can help you explore budget allocations and spending data from Union Budget 2026–27. Please ask me a specific question about a department, scheme, or sector — for example: 'How much was allocated to education?' or 'Compare defence spending over the last 5 years.'",
    []
  ),
  education: makeReply(
    "**Education Allocation 2026–27:**\n\nThe Ministry of Education received **₹12,10,000 Cr (₹12.1 L Cr)** in Union Budget 2026–27, an increase of **18.0%** over the previous year.\n\n**Key schemes:**\n- Samagra Shiksha Abhiyan: ₹3,74,000 Cr\n- Higher Education Finance Agency: ₹2,10,000 Cr\n- IITs/NITs funding: ₹1,26,000 Cr\n- Mid-Day Meal Scheme: ₹1,27,000 Cr\n\nThis is the highest education allocation in Indian budget history.",
    ["Union Budget 2026–27 Vol II, Page 142", "Samagra Shiksha Programme Report 2025"]
  ),
  health: makeReply(
    "**Healthcare Allocation 2026–27:**\n\nThe Ministry of Health & Family Welfare received **₹8,90,000 Cr**, a rise of **12.7%** from ₹7,90,000 Cr in 2025–26.\n\n**Key drivers:**\n- Ayushman Bharat – PM-JAY expanded to cover 600M beneficiaries: ₹1,25,000 Cr\n- National Health Mission: ₹3,67,000 Cr\n- New AIIMS construction: ₹85,000 Cr\n\nPost-pandemic health infrastructure remains a top priority.",
    ["Union Budget 2026–27 Vol II, Page 198", "Ayushman Bharat Programme Report Q3 2025"]
  ),
  infrastructure: makeReply(
    "**Infrastructure Spending Changes 2026–27:**\n\nOverall capital expenditure reached **₹11,11,111 Cr**, a record high (+10.8% YoY).\n\nHowever, **road transport allocation fell 8.2%** to ₹7,80,000 Cr — attributed to completion of major Phase-I highway corridors.\n\n**Urban housing** under Ministry of Housing & Urban Affairs rose 11.3% to ₹5,90,000 Cr, driven by PM Awas Yojana (Urban) expansion.\n\nMetro rail projects received ₹1,95,000 Cr.",
    ["Union Budget 2026–27 Key Features, Page 5", "NHAI Annual Report 2025–26"]
  ),
  largest: makeReply(
    "**Department with Largest Increase 2026–27:**\n\nThe **Ministry of Education** received the largest absolute increase — **₹1,85,000 Cr more** than the previous year (+18.0%).\n\nIn percentage terms, the **Ministry of Social Justice** saw the highest jump (+19.7%), followed by Education (+18.0%) and Rural Development (+10.7%).\n\nThe Ministry of Road Transport was the only major ministry to see a reduction (-8.2%).",
    ["Union Budget 2026–27 Summary Statement", "Ministry-wise Budget Comparison Table 2025–26 vs 2026–27"]
  ),
  compare: makeReply(
    "**Education Spending: 2023–24 vs 2026–27**\n\n| Year | Allocation | Change |\n|------|-----------|--------|\n| 2023–24 | ₹7,50,000 Cr | Baseline |\n| 2024–25 | ₹9,20,000 Cr | +22.7% |\n| 2025–26 | ₹10,25,000 Cr | +11.4% |\n| 2026–27 | ₹12,10,000 Cr | +18.0% |\n\nOver three years, education spending has grown by **61.3%**, reflecting the government's focus on improving gross enrollment ratios and infrastructure at all levels.",
    ["Union Budget Documents 2023–24, 2024–25, 2025–26, 2026–27"]
  ),
  deficit: makeReply(
    "**Fiscal Deficit 2026–27:**\n\nThe fiscal deficit is budgeted at **₹16,13,312 Cr**, which is **4.4% of GDP** — down from 4.9% in 2023–24, continuing the government's fiscal consolidation path despite higher capital expenditure commitments.",
    ["Union Budget 2026–27 Fiscal Policy Statement, Page 12"]
  ),
};

export function getDemoResponse(query: string): ReturnType<typeof makeReply> {
  const q = query.toLowerCase();
  if (q.includes("education") || q.includes("school") || q.includes("शिक्षा")) return DEMO_RESPONSES.education;
  if (q.includes("health") || q.includes("healthcare") || q.includes("ayushman") || q.includes("स्वास्थ्य")) return DEMO_RESPONSES.health;
  if (q.includes("infrastructure") || q.includes("road") || q.includes("highway") || q.includes("बुनियादी")) return DEMO_RESPONSES.infrastructure;
  if (q.includes("largest") || q.includes("biggest") || q.includes("highest increase") || q.includes("सबसे बड़ी")) return DEMO_RESPONSES.largest;
  if (q.includes("compare") || q.includes("between") || q.includes("तुलना")) return DEMO_RESPONSES.compare;
  if (q.includes("deficit") || q.includes("fiscal") || q.includes("घाटा")) return DEMO_RESPONSES.deficit;
  return DEMO_RESPONSES.default;
}
