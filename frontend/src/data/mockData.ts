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
  category: string;
  term: string;
  termHi?: string;
  shortCardDesc: string;
  whatItMeans: string;
  whyItMatters: string;
  simpleExample: string;
  howItRelates: string;
  howCivicLensHelps: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "fiscal-deficit",
    category: "MACROECONOMIC INDICATOR",
    term: "Fiscal Deficit",
    termHi: "राजकोषीय घाटा",
    shortCardDesc: "When the government's total spending is greater than the money it earns, the difference is called the fiscal deficit.",
    whatItMeans: "Fiscal deficit is the gap between the government's total expenditure and its total receipts, excluding certain borrowings.",
    whyItMatters: "It helps indicate how much the government may need to borrow to meet its spending requirements.",
    simpleExample: "If the government spends ₹120 but receives ₹100, there is a gap of ₹20 that needs to be financed.",
    howItRelates: "The Union Budget includes estimates of government receipts, expenditure, and fiscal deficit.",
    howCivicLensHelps: "CivicLens helps users explore recorded budget allocations and understand how government spending is distributed across departments and categories."
  },
  {
    id: "capital-expenditure",
    category: "BUDGET ALLOCATION TYPE",
    term: "Capital Expenditure (Capex)",
    termHi: "पूंजीगत व्यय (कैपेक्स)",
    shortCardDesc: "Money used to create or improve long-term public assets such as roads, railways, schools, hospitals, and infrastructure.",
    whatItMeans: "Capital expenditure is spending used to create, acquire, or improve long-term public assets.",
    whyItMatters: "It can support long-term development by funding infrastructure and other durable assets.",
    simpleExample: "Money spent to build a new railway line or highway is generally an example of capital expenditure.",
    howItRelates: "Budget records can distinguish between revenue and capital components where such data is available.",
    howCivicLensHelps: "Users can view available capital expenditure figures and compare recorded allocations across financial years."
  },
  {
    id: "revenue-expenditure",
    category: "BUDGET ALLOCATION TYPE",
    term: "Revenue Expenditure",
    termHi: "राजस्व व्यय",
    shortCardDesc: "Money spent on the government's regular day-to-day needs, such as salaries, pensions, subsidies, and running public services.",
    whatItMeans: "Revenue expenditure covers regular government spending needed to run public services and meet ongoing obligations.",
    whyItMatters: "It supports the day-to-day functioning of government and delivery of public services.",
    simpleExample: "Government spending on salaries, pensions, routine administration, and some subsidies can fall under revenue expenditure.",
    howItRelates: "Revenue expenditure forms a major part of government spending and may be recorded separately in budget data.",
    howCivicLensHelps: "CivicLens allows users to explore available revenue expenditure data and compare it with other recorded budget figures."
  },
  {
    id: "budget-allocation",
    category: "BUDGET PROCESS",
    term: "Budget Allocation",
    termHi: "बजट आवंटन",
    shortCardDesc: "The amount of money assigned in the budget for a particular ministry, department, programme, scheme, or purpose.",
    whatItMeans: "A budget allocation is an amount assigned for a specific government purpose.",
    whyItMatters: "It shows where public money is planned to be spent.",
    simpleExample: "A ministry may receive a specific allocation for education, healthcare, infrastructure, or another public purpose.",
    howItRelates: "Allocations can be organised by ministries, departments, schemes, expenditure categories, and budget heads.",
    howCivicLensHelps: "CivicLens lets users explore available budget allocations by financial year, department, category, and budget item."
  },
  {
    id: "subsidy",
    category: "WELFARE SPENDING",
    term: "Subsidy",
    termHi: "सब्सिडी / छूट",
    shortCardDesc: "Financial support provided to reduce the cost of important goods or services and make them more affordable for people.",
    whatItMeans: "A subsidy is financial support provided by the government to reduce costs or support a particular activity or group.",
    whyItMatters: "Subsidies can help make important goods and services more affordable or support specific policy objectives.",
    simpleExample: "Government support that helps reduce the effective cost of an essential product can be considered a subsidy.",
    howItRelates: "Budget documents may contain allocations related to different subsidy programmes.",
    howCivicLensHelps: "Users can search and explore relevant recorded budget items and allocations available in the CivicLens dataset."
  },
  {
    id: "revised-estimate",
    category: "BUDGET PROCESS",
    term: "Revised Estimate (RE)",
    termHi: "संशोधित अनुमान (आरई)",
    shortCardDesc: "An updated estimate of government spending or receipts during the financial year, based on the latest available information.",
    whatItMeans: "A Revised Estimate is an updated estimate prepared during or after reviewing the financial year's budget performance.",
    whyItMatters: "Actual government spending may differ from the original budget estimate because of changing requirements and circumstances.",
    simpleExample: "If ₹1,000 was originally planned but updated information suggests actual spending may be ₹1,100, the revised estimate may reflect that change.",
    howItRelates: "Budget documents may use Budget Estimates and Revised Estimates to present planned and updated figures.",
    howCivicLensHelps: "Only display Revised Estimate data where it actually exists in the available CivicLens dataset. Do not invent or estimate RE values."
  }
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
