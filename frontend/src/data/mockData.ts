/**
 * mockData.ts
 * Structured mock data for new CivicLens features:
 * - Glossary terms
 * - Cross-region / department comparisons
 * - RTI Assistant templates
 * - Alert preferences & sample alerts
 * - Admin dashboard metrics & AI Agent activity logs
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  termHi: string;
  simpleMeaning: string;
  simpleMeaningHi: string;
  example: string;
  exampleHi: string;
  category: string;
  officialDocRef: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "fiscal-deficit",
    term: "Fiscal Deficit",
    termHi: "राजकोषीय घाटा",
    simpleMeaning: "The amount by which government spending is greater than government income in a year.",
    simpleMeaningHi: "एक वर्ष में सरकार का खर्च उसकी कुल कमाई से जितना अधिक होता है, उसे राजकोषीय घाटा कहते हैं।",
    example: "If the government earns ₹100 and spends ₹110, the fiscal deficit is ₹10.",
    exampleHi: "यदि सरकार ₹100 कमाती है और ₹110 खर्च करती है, तो राजकोषीय घाटा ₹10 है।",
    category: "Macroeconomic Indicator",
    officialDocRef: "Union Budget Statement — Fiscal Policy Strategy",
  },
  {
    id: "capital-expenditure",
    term: "Capital Expenditure (Capex)",
    termHi: "पूंजीगत व्यय (कैपेक्स)",
    simpleMeaning: "Money spent on building long-term assets like highways, railways, bridges, schools, and hospitals.",
    simpleMeaningHi: "राजमार्ग, रेलवे, पुल, स्कूल और अस्पताल जैसी दीर्घकालिक संपत्तियों के निर्माण पर खर्च किया गया धन।",
    example: "Building a new AIIMS hospital or dedicated freight corridor.",
    exampleHi: "नया एम्स अस्पताल या समर्पित मालगाड़ी कॉरिडोर बनाना।",
    category: "Budget Allocation Type",
    officialDocRef: "Budget at a Glance — Expenditure Summary",
  },
  {
    id: "revenue-expenditure",
    term: "Revenue Expenditure",
    termHi: "राजस्व व्यय",
    simpleMeaning: "Routine day-to-day operational expenses of government departments, including salaries, pensions, and subsidies.",
    simpleMeaningHi: "सरकारी विभागों के नियमित दैनिक परिचालन खर्च, जिनमें वेतन, पेंशन और सब्सिडी शामिल हैं।",
    example: "Paying salaries to government teachers and healthcare staff.",
    exampleHi: "सरकारी शिक्षकों और स्वास्थ्य कर्मचारियों को वेतन देना।",
    category: "Budget Allocation Type",
    officialDocRef: "Demand for Grants — Revenue Account",
  },
  {
    id: "allocation",
    term: "Budget Allocation",
    termHi: "बजट आवंटन",
    simpleMeaning: "The specific amount of money reserved by parliament for a ministry, department, or public scheme.",
    simpleMeaningHi: "संसद द्वारा किसी मंत्रालय, विभाग या सार्वजनिक योजना के लिए निर्धारित विशिष्ट धनराशि।",
    example: "₹1.48 Lakh Crore allocated for Education in FY 2026–27.",
    exampleHi: "वित्त वर्ष 2026–27 में शिक्षा के लिए ₹1.48 लाख करोड़ आवंटित किए गए।",
    category: "Budget Process",
    officialDocRef: "Annual Financial Statement — Demand Summary",
  },
  {
    id: "subsidy",
    term: "Subsidy",
    termHi: "सब्सिडी / छूट",
    simpleMeaning: "Financial support given by the government to make essential goods like food, fertilizer, and fuel affordable for citizens.",
    simpleMeaningHi: "भोजन, उर्वरक और ईंधन जैसी आवश्यक वस्तुओं को नागरिकों के लिए किफायती बनाने के लिए सरकार द्वारा दी जाने वाली वित्तीय सहायता।",
    example: "PM Garib Kalyan Anna Yojana free ration subsidy.",
    exampleHi: "पीएम गरीब कल्याण अन्न योजना मुफ्त राशन सब्सिडी।",
    category: "Welfare Spending",
    officialDocRef: "Expenditure Profile — Statement 11",
  },
  {
    id: "revised-estimate",
    term: "Revised Estimate (RE)",
    termHi: "संशोधित अनुमान (आरई)",
    simpleMeaning: "The updated budget figure midway through the financial year based on actual spending performance.",
    simpleMeaningHi: "वास्तविक खर्च के प्रदर्शन के आधार पर वित्तीय वर्ष के मध्य में अद्यतन बजट आंकड़ा।",
    example: "Adjusting midday meal budget mid-year due to inflation.",
    exampleHi: "मुद्रास्फीति के कारण मध्य वर्ष में दोपहर के भोजन के बजट को समायोजित करना।",
    category: "Budget Process",
    officialDocRef: "Budget Highlights — Revised Estimates",
  },
];

export interface RegionComparison {
  id: string;
  category: string;
  categoryHi: string;
  data: {
    region: string;
    amountCr: number;
    pctShare: number;
  }[];
  explanation: string;
  explanationHi: string;
  officialSource: string;
}

export const COMPARISON_DATA: RegionComparison[] = [
  {
    id: "edu-spending",
    category: "Education Allocation Across Key States",
    categoryHi: "प्रमुख राज्यों में शिक्षा आवंटन",
    data: [
      { region: "Delhi", amountCr: 16396, pctShare: 21.4 },
      { region: "Maharashtra", amountCr: 64800, pctShare: 16.2 },
      { region: "Uttar Pradesh", amountCr: 75165, pctShare: 14.8 },
      { region: "Bihar", amountCr: 40450, pctShare: 18.5 },
      { region: "Tamil Nadu", amountCr: 43790, pctShare: 15.1 },
    ],
    explanation: "Delhi allocates the highest percentage share of its overall state budget to public education, followed by Bihar and Maharashtra.",
    explanationHi: "दिल्ली अपने समग्र राज्य बजट का उच्चतम प्रतिशत हिस्सा सार्वजनिक शिक्षा के लिए आवंटित करती है, इसके बाद बिहार और महाराष्ट्र का स्थान है।",
    officialSource: "State Budget Statements FY 2025–26 & RBI State Finances Report",
  },
  {
    id: "health-spending",
    category: "Healthcare Budget Comparison",
    categoryHi: "स्वास्थ्य सेवा बजट तुलना",
    data: [
      { region: "Delhi", amountCr: 9741, pctShare: 12.7 },
      { region: "Kerala", amountCr: 11420, pctShare: 8.9 },
      { region: "Rajasthan", amountCr: 27600, pctShare: 7.8 },
      { region: "Gujarat", amountCr: 21200, pctShare: 6.4 },
      { region: "Madhya Pradesh", amountCr: 19800, pctShare: 6.1 },
    ],
    explanation: "Healthcare allocations reflect state-level priorities in medical infrastructure, free diagnostic schemes, and primary healthcare centers.",
    explanationHi: "स्वास्थ्य सेवा आवंटन चिकित्सा अवसंरचना, मुफ्त नैदानिक योजनाओं और प्राथमिक स्वास्थ्य केंद्रों में राज्य स्तरीय प्राथमिकताओं को दर्शाते हैं।",
    officialSource: "National Health Accounts & State Financial Estimates",
  },
];

export interface RTITemplate {
  id: string;
  title: string;
  department: string;
  suggestedQuestions: string[];
}

export const RTI_TEMPLATES: RTITemplate[] = [
  {
    id: "scheme-expenditure",
    title: "Request Scheme-Wise Actual Expenditure & Beneficiary Count",
    department: "Ministry of Education",
    suggestedQuestions: [
      "Please provide the total sanctioned vs. actual spent amount for PM POSHAN in FY 2025-26.",
      "Please provide state-wise breakdown of funds released vs. unspent balance lying with states.",
      "Provide copies of audit reports or evaluation studies conducted for this scheme in the last 2 years.",
    ],
  },
  {
    id: "infrastructure-tender",
    title: "Request Highway & Railway Construction Project Spending Status",
    department: "Ministry of Road Transport and Highways",
    suggestedQuestions: [
      "What was the original estimated cost vs final sanctioned cost for Project Highway NH-44 expansion?",
      "Provide the contractor payment records and completion timeline approvals.",
      "List of penalty clauses invoked due to project delays in the financial year.",
    ],
  },
];

export interface AdminMetric {
  title: string;
  count: number | string;
  change: string;
  positive: boolean;
}

export const ADMIN_METRICS: AdminMetric[] = [
  { title: "Documents Uploaded", count: 24, change: "+3 this week", positive: true },
  { title: "Budget Records Tracked", count: "8,420", change: "100% verified", positive: true },
  { title: "AI Investigations Run", count: 137, change: "Automated RAG", positive: true },
  { title: "Anomalies Detected", count: 18, change: "Action required", positive: false },
];

export interface AgentActivityLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning";
  category: "Data Processing" | "Anomaly Detection" | "RAG" | "AI Explanation";
  message: string;
  details: string;
}

export const AGENT_ACTIVITY_LOGS: AgentActivityLog[] = [
  {
    id: "log-1",
    timestamp: "10:48 AM",
    level: "success",
    category: "AI Explanation",
    message: "Sources verified & explanation published",
    details: "Cross-checked Union Budget Statement Page 142 against Demand No. 27.",
  },
  {
    id: "log-2",
    timestamp: "10:47 AM",
    level: "info",
    category: "AI Explanation",
    message: "AI explanation generated",
    details: "Synthesized 16.8% healthcare allocation increase for citizen summary.",
  },
  {
    id: "log-3",
    timestamp: "10:46 AM",
    level: "info",
    category: "RAG",
    message: "Relevant government documents retrieved",
    details: "Retrieved 4 pages from National Health Mission Guidelines & Budget Speech.",
  },
  {
    id: "log-4",
    timestamp: "10:45 AM",
    level: "warning",
    category: "Anomaly Detection",
    message: "Significant spending change detected",
    details: "Spike detected in Capital Outlay on Telecom Infrastructure (+28.4%).",
  },
  {
    id: "log-5",
    timestamp: "10:44 AM",
    level: "info",
    category: "Data Processing",
    message: "Historical comparison completed",
    details: "Compared FY 2026-27 allocations with FY 2021-22 baseline dataset.",
  },
  {
    id: "log-6",
    timestamp: "10:43 AM",
    level: "info",
    category: "Data Processing",
    message: "Budget data extracted from PDF",
    details: "Parsed 142 table rows from Demand for Grants 2026-27.",
  },
];
