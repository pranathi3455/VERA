/**
 * Isolated Mock Data for VERA Phase 2 UI Prototyping
 * This mock store will be replaced by API calls to the Express/Supabase backend in later phases.
 */

export const mockDashboardMetrics = {
  totalDecisions: 14,
  activeResearch: 3,
  averageConfidence: 87, // %
  highRiskDecisions: 2
};

export const mockDecisions = [
  {
    id: "dec-supplier-selection",
    title: "Primary Semiconductor Supplier Selection",
    question: "Which component supplier provides resilient delivery timelines with minimal defect rate and acceptable unit cost?",
    status: "Completed",
    recommendation: "Apex Micro Tech",
    confidence: 89,
    risk: "Low",
    riskScore: 24,
    date: "2026-10-04",
    alternativesCount: 3,
    evidenceCount: 7,
    criteriaCount: 4
  },
  {
    id: "dec-cloud-provider",
    title: "Enterprise Cloud Infrastructure Provider",
    question: "Which cloud provider best balances data sovereignty, managed Kubernetes ergonomics, and long-term TCO?",
    status: "Completed",
    recommendation: "Google Cloud Platform",
    confidence: 91,
    risk: "Low",
    riskScore: 18,
    date: "2026-09-28",
    alternativesCount: 3,
    evidenceCount: 9,
    criteriaCount: 5
  },
  {
    id: "dec-marketing-platform",
    title: "B2B Marketing Automation Platform",
    question: "Which platform satisfies enterprise compliance standards and native CRM bidirectional synchronization?",
    status: "Completed",
    recommendation: "HubStream Suite",
    confidence: 84,
    risk: "Medium",
    riskScore: 48,
    date: "2026-09-19",
    alternativesCount: 4,
    evidenceCount: 6,
    criteriaCount: 4
  },
  {
    id: "dec-university-tool",
    title: "University Research Collaboration Tool",
    question: "Which collaboration stack ensures student privacy, data ownership, and zero recurring licensing costs?",
    status: "In Review",
    recommendation: "OpenCollab Academic",
    confidence: 76,
    risk: "High",
    riskScore: 72,
    date: "2026-09-12",
    alternativesCount: 3,
    evidenceCount: 5,
    criteriaCount: 3
  }
];

export const mockDetailedDecision = {
  id: "dec-supplier-selection",
  title: "Primary Semiconductor Supplier Selection",
  question: "Which component supplier provides resilient delivery timelines with minimal defect rate and acceptable unit cost?",
  description: "Comprehensive evaluation of Tier-1 manufacturing suppliers for Q4 hardware production ramp-up. Evidence gathered from audit reports, historical QA logs, and vendor RFPs.",
  createdAt: "October 4, 2026",
  status: "Completed",
  author: "Operations Research Team",

  // Deterministic Engine Calculations
  engineCalculations: {
    recommendedAlternative: "Apex Micro Tech",
    overallScore: 84.6,
    confidenceScore: 89,
    riskLevel: "Low",
    riskScore: 24,
    rankings: [
      {
        rank: 1,
        alternative: "Apex Micro Tech",
        score: 84.6,
        rawCost: "$42.50",
        rawDefect: "0.04%",
        rawLeadTime: "12 days",
        rawReliability: "99.2%",
        isWinner: true
      },
      {
        rank: 2,
        alternative: "SilicoGlobal Corp",
        score: 76.2,
        rawCost: "$38.00",
        rawDefect: "0.12%",
        rawLeadTime: "18 days",
        rawReliability: "96.5%",
        isWinner: false
      },
      {
        rank: 3,
        alternative: "Vanguard Foundry",
        score: 68.9,
        rawCost: "$46.00",
        rawDefect: "0.08%",
        rawLeadTime: "24 days",
        rawReliability: "98.1%",
        isWinner: false
      }
    ],
    criteriaBreakdown: [
      {
        name: "Defect Rate",
        weight: 35,
        direction: "LOWER_IS_BETTER",
        apexScore: 35.0,
        silicoScore: 18.2,
        vanguardScore: 26.5
      },
      {
        name: "Delivery Lead Time",
        weight: 25,
        direction: "LOWER_IS_BETTER",
        apexScore: 25.0,
        silicoScore: 16.7,
        vanguardScore: 8.3
      },
      {
        name: "Unit Cost",
        weight: 25,
        direction: "LOWER_IS_BETTER",
        apexScore: 14.5,
        silicoScore: 25.0,
        vanguardScore: 6.8
      },
      {
        name: "Vendor Reliability Rating",
        weight: 15,
        direction: "HIGHER_IS_BETTER",
        apexScore: 15.0,
        silicoScore: 8.2,
        vanguardScore: 12.1
      }
    ],
    risks: [
      {
        title: "Single-source foundry exposure",
        severity: "Low",
        description: "Apex maintains dual fabrication facilities in Taiwan and Germany, mitigating catastrophic regional disruption.",
        mitigation: "Establish standby secondary tooling agreement."
      },
      {
        title: "Slight unit price premium ($4.50 higher than SilicoGlobal)",
        severity: "Low",
        description: "The 0.08% lower defect rate saves an estimated $18,000 per 10k units in RMA processing costs.",
        mitigation: "Volume rebate threshold triggers at 25,000 units."
      }
    ]
  },

  // Structured Evidence Attached
  evidence: [
    {
      id: "ev-1",
      title: "ISO 9001:2015 Audit Report 2026",
      source: "TUV Rheinland Certification Database",
      sourceType: "Official Audit Report",
      direction: "SUPPORTING",
      supportingAlternative: "Apex Micro Tech",
      reliability: "High (Verified Third-Party)",
      excerpt: "Zero major non-conformances identified in fab line cleanliness and lot traceability audits conducted in August 2026."
    },
    {
      id: "ev-2",
      title: "Historical Q1-Q3 Delivery Logs",
      source: "Internal Enterprise ERP Records",
      sourceType: "Internal Dataset",
      direction: "SUPPORTING",
      supportingAlternative: "Apex Micro Tech",
      reliability: "High (Direct Telemetry)",
      excerpt: "Mean on-time in-full delivery rate measured at 99.2% over 48 shipping intervals."
    },
    {
      id: "ev-3",
      title: "Bulk Pricing RFP Response 2026",
      source: "Vendor Commercial Proposal",
      sourceType: "User Provided",
      direction: "CONFLICTING",
      supportingAlternative: "Apex Micro Tech",
      reliability: "Medium (Commercial Quote)",
      excerpt: "Apex unit pricing is 11.8% higher than lowest market bidder SilicoGlobal for batches under 10,000 units."
    },
    {
      id: "ev-4",
      title: "SilicoGlobal Yield Anomaly Disclosure",
      source: "Industry QA Bulletin #441",
      sourceType: "Industry Report",
      direction: "SUPPORTING",
      supportingAlternative: "Apex Micro Tech",
      reliability: "High (Public Disclosure)",
      excerpt: "SilicoGlobal reported transient wafer packaging delamination issues impacting 2.1% of lot 4B shipments."
    }
  ],

  // AI Interpretation (Clearly demarcated from deterministic engine)
  aiInterpretation: {
    status: "Generated via Gemini 1.5 Flash (Synthesized Interpretation)",
    recommendationSummary: "Apex Micro Tech clearly emerges as the dominant choice. Although SilicoGlobal offers an initial unit price discount of ~11%, Apex's superior quality control and 12-day lead time eliminate downstream assembly halts and RMA liabilities.",
    reasoning: "The deterministic ranking assigns Apex 84.6 points versus 76.2 for SilicoGlobal. The primary sensitivity factor is defect rate (35% criterion weight), where Apex achieves a 0.04% defect profile against Silico's 0.12%. For hardware manufacturing, downtime costs vastly outweigh the $4.50 component delta.",
    tradeoffs: [
      "Cost vs. Reliability: Selecting Apex trades an initial $4.50/unit price delta for a 66% reduction in manufacturing defect risk.",
      "Lead Time vs. Supplier Diversity: Apex delivers in 12 days versus 18-24 days for rivals, reducing working capital tied in buffer inventory."
    ],
    whatCouldChangeDecision: [
      "If SilicoGlobal provides insured defect reimbursement guarantees with audited 0.05% tolerances.",
      "If production volume exceeds 100,000 units where the cumulative unit cost saving eclipses $450,000."
    ]
  }
};
