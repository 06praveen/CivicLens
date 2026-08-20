/**
 * budgetData.ts  — Centralized demo budget data.
 * Replace values with real API/database responses when available.
 */

export const CURRENT_YEAR = "2026-27";

export const FINANCIAL_YEARS = [
  "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26", "2026-27",
];

// ── Summary KPIs ─────────────────────────────────────────────────────────────
export interface BudgetKPI {
  key: string;
  labelKey: string;
  value: string;
  raw: number;       // in crore INR
  prevRaw: number;
  unit: string;
  gdpPct?: string;
}

export const BUDGET_KPIS: BudgetKPI[] = [
  { key: "total_budget",    labelKey: "bag_total_budget",   value: "₹50,65,345 Cr", raw: 5065345, prevRaw: 4791455, unit: "Cr" },
  { key: "total_exp",       labelKey: "bag_total_exp",      value: "₹47,16,812 Cr", raw: 4716812, prevRaw: 4478208, unit: "Cr" },
  { key: "revenue",         labelKey: "bag_revenue",        value: "₹33,44,302 Cr", raw: 3344302, prevRaw: 3098423, unit: "Cr" },
  { key: "capital_exp",     labelKey: "bag_capital_exp",    value: "₹11,11,111 Cr", raw: 1111111, prevRaw: 1002500, unit: "Cr" },
  { key: "revenue_exp",     labelKey: "bag_revenue_exp",    value: "₹36,05,701 Cr", raw: 3605701, prevRaw: 3475708, unit: "Cr" },
  { key: "fiscal_deficit",  labelKey: "bag_fiscal_deficit", value: "₹16,13,312 Cr", raw: 1613312, prevRaw: 1597194, unit: "Cr", gdpPct: "4.4%" },
];

// ── Sector-wise Allocation ────────────────────────────────────────────────────
export interface SectorAllocation {
  sector: string;
  amount: number;   // Cr
  pct: number;
  color: string;
}

export const SECTOR_ALLOCATIONS: SectorAllocation[] = [
  { sector: "Education",          amount: 1210000, pct: 23.9, color: "#1e3a8a" },
  { sector: "Healthcare",         amount:  890000, pct: 17.6, color: "#FF9933" },
  { sector: "Infrastructure",     amount:  780000, pct: 15.4, color: "#138808" },
  { sector: "Rural Development",  amount:  620000, pct: 12.2, color: "#7c3aed" },
  { sector: "Defence",            amount:  560000, pct: 11.1, color: "#be123c" },
  { sector: "Agriculture",        amount:  480000, pct: 9.5,  color: "#b45309" },
  { sector: "Social Welfare",     amount:  320000, pct: 6.3,  color: "#0891b2" },
  { sector: "Others",             amount:  200000, pct: 4.0,  color: "#6b7280" },
];

// ── YoY comparison ────────────────────────────────────────────────────────────
export interface YoYRecord {
  year: string;
  budget: number;
  expenditure: number;
  capitalExp: number;
}

export const YOY_DATA: YoYRecord[] = [
  { year: "2020-21", budget: 3042230, expenditure: 3538503, capitalExp: 447100 },
  { year: "2021-22", budget: 3478449, expenditure: 3791709, capitalExp: 554236 },
  { year: "2022-23", budget: 3945338, expenditure: 4142174, capitalExp: 735948 },
  { year: "2023-24", budget: 4447832, expenditure: 4447103, capitalExp: 926518 },
  { year: "2024-25", budget: 4791455, expenditure: 4478208, capitalExp: 1002500 },
  { year: "2025-26", budget: 4791455, expenditure: 4578208, capitalExp: 1050000 },
  { year: "2026-27", budget: 5065345, expenditure: 4716812, capitalExp: 1111111 },
];

// ── Year-wise Budget Presentation Data ───────────────────────────────────────
export interface BudgetYearItem {
  year: string;
  videoId: string;
  title: string;
  summary: string[];
}

export const BUDGET_YEARS_DATA: BudgetYearItem[] = [
  {
    year: "2026–27",
    videoId: "REPLACE_WITH_REAL_VIDEO_ID",
    title: "Union Budget 2026–27",
    summary: [
      "Total budget outlay tracked at ₹50.65 Lakh Crore, representing a 5.7% YoY growth.",
      "Capital expenditure allocation increased to ₹11.11 Lakh Crore for infrastructure creation.",
      "Priority allocations towards Infrastructure, Education, and Healthcare sectors."
    ]
  },
  {
    year: "2025–26",
    videoId: "REPLACE_WITH_REAL_VIDEO_ID",
    title: "Union Budget 2025–26",
    summary: [
      "Total budget outlay tracked at ₹47.91 Lakh Crore.",
      "Capital expenditure target set at ₹10.50 Lakh Crore.",
      "Strategic allocations towards rural development, agriculture, and digital public infrastructure."
    ]
  },
  {
    year: "2024–25",
    videoId: "REPLACE_WITH_REAL_VIDEO_ID",
    title: "Union Budget 2024–25",
    summary: [
      "Total budget outlay tracked at ₹47.91 Lakh Crore.",
      "Capital expenditure outlay at ₹10.02 Lakh Crore.",
      "Focus on employment generation, skilling initiatives, and MSME sector support."
    ]
  },
  {
    year: "2023–24",
    videoId: "REPLACE_WITH_REAL_VIDEO_ID",
    title: "Union Budget 2023–24",
    summary: [
      "Total budget outlay tracked at ₹44.48 Lakh Crore.",
      "Capital expenditure allocation stood at ₹9.27 Lakh Crore.",
      "Prioritizing inclusive development, green growth, and youth empowerment."
    ]
  },
  {
    year: "2022–23",
    videoId: "REPLACE_WITH_REAL_VIDEO_ID",
    title: "Union Budget 2022–23",
    summary: [
      "Total budget outlay tracked at ₹39.45 Lakh Crore.",
      "Capital expenditure provision of ₹7.36 Lakh Crore.",
      "Focus on PM GatiShakti multi-modal connectivity and post-pandemic health infrastructure."
    ]
  }
];


// ── Explore Budget records ────────────────────────────────────────────────────
export interface BudgetRecord {
  id: string;
  department: string;
  sector: string;
  scheme: string;
  allocated: number;   // Cr
  prevYear: number;
  changePct: number;
}

export const BUDGET_RECORDS: BudgetRecord[] = [
  { id: "B001", department: "Ministry of Education",               sector: "Education",         scheme: "Samagra Shiksha Abhiyan",        allocated: 374000, prevYear: 320000, changePct: 16.9 },
  { id: "B002", department: "Ministry of Education",               sector: "Education",         scheme: "Higher Education Finance Agency", allocated: 210000, prevYear: 175000, changePct: 20.0 },
  { id: "B003", department: "Ministry of Health",                  sector: "Healthcare",        scheme: "Ayushman Bharat – PM-JAY",        allocated: 125000, prevYear: 108000, changePct: 15.7 },
  { id: "B004", department: "Ministry of Health",                  sector: "Healthcare",        scheme: "National Health Mission",         allocated: 367000, prevYear: 351000, changePct:  4.6 },
  { id: "B005", department: "Ministry of Road Transport",          sector: "Infrastructure",    scheme: "National Highways Authority",     allocated: 195000, prevYear: 230000, changePct:-15.2 },
  { id: "B006", department: "Ministry of Road Transport",          sector: "Infrastructure",    scheme: "PMGSY – Rural Roads",             allocated:  82000, prevYear:  74000, changePct: 10.8 },
  { id: "B007", department: "Ministry of Rural Development",       sector: "Rural Development", scheme: "MGNREGS",                        allocated: 860000, prevYear: 730000, changePct: 17.8 },
  { id: "B008", department: "Ministry of Rural Development",       sector: "Rural Development", scheme: "PM Awas Yojana (Rural)",          allocated: 540000, prevYear: 480000, changePct: 12.5 },
  { id: "B009", department: "Ministry of Agriculture",             sector: "Agriculture",       scheme: "PM-KISAN",                       allocated: 600000, prevYear: 600000, changePct:  0.0 },
  { id: "B010", department: "Ministry of Agriculture",             sector: "Agriculture",       scheme: "Pradhan Mantri Fasal Bima Yojana",allocated: 156000, prevYear: 133000, changePct: 17.3 },
  { id: "B011", department: "Ministry of Finance",                 sector: "Others",            scheme: "Interest Payments",              allocated:1195000, prevYear:1083000, changePct: 10.3 },
  { id: "B012", department: "Ministry of Social Justice",          sector: "Social Welfare",    scheme: "Post-Matric Scholarships",        allocated:  73000, prevYear:  61000, changePct: 19.7 },
  { id: "B013", department: "Ministry of Housing & Urban Affairs", sector: "Infrastructure",    scheme: "Smart Cities Mission",            allocated:  80000, prevYear:  80000, changePct:  0.0 },
  { id: "B014", department: "Ministry of Housing & Urban Affairs", sector: "Infrastructure",    scheme: "PM Awas Yojana (Urban)",         allocated: 254000, prevYear: 210000, changePct: 21.0 },
  { id: "B015", department: "Ministry of Defence",                 sector: "Defence",           scheme: "Capital Acquisitions",            allocated: 175000, prevYear: 152000, changePct: 15.1 },
];

// ── Departments ───────────────────────────────────────────────────────────────
export interface Department {
  id: string;
  name: string;
  nameHi: string;
  shortDesc: string;
  shortDescHi: string;
  allocation: number;
  prevAllocation: number;
  icon: string;   // emoji / unicode
  color: string;
  schemes: { name: string; amount: number }[];
  spendingCats: { cat: string; pct: number }[];
}

export const DEPARTMENTS: Department[] = [
  {
    id: "edu",
    name: "Ministry of Education",
    nameHi: "शिक्षा मंत्रालय",
    shortDesc: "Primary, secondary and higher education funding.",
    shortDescHi: "प्राथमिक, माध्यमिक और उच्च शिक्षा वित्त पोषण।",
    allocation: 1210000,
    prevAllocation: 1025000,
    icon: "🎓",
    color: "#1e3a8a",
    schemes: [
      { name: "Samagra Shiksha", amount: 374000 },
      { name: "Higher Education Finance", amount: 210000 },
      { name: "IITs/NITs", amount: 126000 },
      { name: "Mid-Day Meal Scheme", amount: 127000 },
    ],
    spendingCats: [
      { cat: "Schools", pct: 45 },
      { cat: "Higher Education", pct: 30 },
      { cat: "Technical Education", pct: 15 },
      { cat: "Administration", pct: 10 },
    ],
  },
  {
    id: "health",
    name: "Ministry of Health & Family Welfare",
    nameHi: "स्वास्थ्य एवं परिवार कल्याण मंत्रालय",
    shortDesc: "Healthcare infrastructure, insurance and public health missions.",
    shortDescHi: "स्वास्थ्य सेवा, बीमा और सार्वजनिक स्वास्थ्य मिशन।",
    allocation: 890000,
    prevAllocation: 790000,
    icon: "🏥",
    color: "#138808",
    schemes: [
      { name: "Ayushman Bharat", amount: 125000 },
      { name: "National Health Mission", amount: 367000 },
      { name: "AIIMS Expansion", amount:  85000 },
      { name: "Medical Devices Infra", amount:  55000 },
    ],
    spendingCats: [
      { cat: "Insurance Schemes", pct: 40 },
      { cat: "Primary Health", pct: 30 },
      { cat: "Hospitals & AIIMS", pct: 20 },
      { cat: "Administration", pct: 10 },
    ],
  },
  {
    id: "road",
    name: "Ministry of Road Transport & Highways",
    nameHi: "सड़क परिवहन एवं राजमार्ग मंत्रालय",
    shortDesc: "National highways, rural roads and urban transport.",
    shortDescHi: "राष्ट्रीय राजमार्ग, ग्रामीण सड़कें और शहरी परिवहन।",
    allocation: 780000,
    prevAllocation: 850000,
    icon: "🛣️",
    color: "#b45309",
    schemes: [
      { name: "NHAI Capital Works", amount: 195000 },
      { name: "PMGSY", amount:  82000 },
      { name: "Setu Bharatam", amount:  60000 },
      { name: "State Road Projects", amount:  95000 },
    ],
    spendingCats: [
      { cat: "National Highways", pct: 50 },
      { cat: "Rural Roads", pct: 25 },
      { cat: "Bridges & Flyovers", pct: 15 },
      { cat: "Administration", pct: 10 },
    ],
  },
  {
    id: "rural",
    name: "Ministry of Rural Development",
    nameHi: "ग्रामीण विकास मंत्रालय",
    shortDesc: "Rural employment, housing and infrastructure development.",
    shortDescHi: "ग्रामीण रोजगार, आवास और बुनियादी ढांचे का विकास।",
    allocation: 620000,
    prevAllocation: 560000,
    icon: "🌾",
    color: "#7c3aed",
    schemes: [
      { name: "MGNREGS", amount: 860000 },
      { name: "PM Awas (Rural)", amount: 540000 },
      { name: "PMGSY", amount:  82000 },
      { name: "PMGDISHA", amount:  18000 },
    ],
    spendingCats: [
      { cat: "Employment Guarantee", pct: 55 },
      { cat: "Rural Housing", pct: 30 },
      { cat: "Digital Connectivity", pct: 10 },
      { cat: "Administration", pct: 5 },
    ],
  },
  {
    id: "agri",
    name: "Ministry of Agriculture & Farmers' Welfare",
    nameHi: "कृषि एवं किसान कल्याण मंत्रालय",
    shortDesc: "Farmer income support, crop insurance and agri-infrastructure.",
    shortDescHi: "किसान आय समर्थन, फसल बीमा और कृषि-बुनियादी ढांचा।",
    allocation: 480000,
    prevAllocation: 450000,
    icon: "🌱",
    color: "#16a34a",
    schemes: [
      { name: "PM-KISAN", amount: 600000 },
      { name: "Fasal Bima Yojana", amount: 156000 },
      { name: "KCC (Kisan Credit Card)", amount:  48000 },
      { name: "Agriculture Infrastructure Fund", amount:  36000 },
    ],
    spendingCats: [
      { cat: "Income Support", pct: 45 },
      { cat: "Crop Insurance", pct: 30 },
      { cat: "Credit & Infrastructure", pct: 15 },
      { cat: "Administration", pct: 10 },
    ],
  },
  {
    id: "finance",
    name: "Ministry of Finance",
    nameHi: "वित्त मंत्रालय",
    shortDesc: "Fiscal management, tax administration and debt servicing.",
    shortDescHi: "राजकोषीय प्रबंधन, कर प्रशासन और ऋण सेवा।",
    allocation: 1950000,
    prevAllocation: 1830000,
    icon: "🏦",
    color: "#0891b2",
    schemes: [
      { name: "Interest Payments", amount: 1195000 },
      { name: "Tax Revenue Transfers", amount:  450000 },
      { name: "Subsidies", amount:  250000 },
      { name: "Other Transfers", amount:   55000 },
    ],
    spendingCats: [
      { cat: "Debt Servicing", pct: 61 },
      { cat: "State Transfers", pct: 23 },
      { cat: "Subsidies", pct: 13 },
      { cat: "Administration", pct: 3 },
    ],
  },
  {
    id: "housing",
    name: "Ministry of Housing & Urban Affairs",
    nameHi: "आवास एवं शहरी मामले मंत्रालय",
    shortDesc: "Urban housing, smart cities and metro rail projects.",
    shortDescHi: "शहरी आवास, स्मार्ट सिटी और मेट्रो रेल परियोजनाएं।",
    allocation: 590000,
    prevAllocation: 530000,
    icon: "🏙️",
    color: "#be123c",
    schemes: [
      { name: "PM Awas (Urban)", amount: 254000 },
      { name: "Smart Cities Mission", amount:  80000 },
      { name: "Metro Rail", amount: 195000 },
      { name: "AMRUT", amount:   61000 },
    ],
    spendingCats: [
      { cat: "Affordable Housing", pct: 43 },
      { cat: "Metro & Transport", pct: 33 },
      { cat: "Urban Amenities", pct: 17 },
      { cat: "Administration", pct: 7 },
    ],
  },
];

// ── Helper ────────────────────────────────────────────────────────────────────
export function formatCr(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L Cr`;
  return `₹${amount.toLocaleString("en-IN")} Cr`;
}

export function pctChange(curr: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((curr - prev) / prev) * 10) / 10;
}
