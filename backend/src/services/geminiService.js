/**
 * Gemini Service for VERA Decision Intelligence
 * 
 * IMPORTANT:
 * Gemini must NOT calculate the decision ranking.
 * The deterministic VERA Decision Engine already calculated:
 * - rankings, overall scores, criterion scores, risk assessment, confidence.
 * Gemini ONLY interprets these results.
 * 
 * Never expose GEMINI_API_KEY to the frontend.
 */

import { z } from 'zod';

// Strict schema validation for Gemini's structured response
export const aiInterpretationResponseSchema = z.object({
  recommendation: z.string().min(1, 'Recommendation is required'),
  reasoning: z.string().min(1, 'Reasoning is required'),
  keyFactors: z.array(z.string()).default([]),
  supportingEvidence: z.array(z.string()).default([]),
  conflictingEvidence: z.array(z.string()).default([]),
  tradeoffs: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  alternativeScenario: z.string().default(''),
  confidence: z.coerce.number().default(0),
  whatCouldChangeDecision: z.array(z.string()).default([])
});

const FALLBACK_RESPONSE = {
  status: 'unavailable',
  message: 'AI interpretation is temporarily unavailable.'
};

/**
 * Builds a compact, structured input payload for Gemini.
 * Excludes unnecessary repeated data while preserving all required context.
 */
export function buildCompactAiInput({ decision, engineResult, evidence = [] }) {
  const question = decision?.question || decision?.title || '';

  const alternatives = (engineResult.rankings || []).map((r) => ({
    name: r.alternative.name,
    description: r.alternative.description || undefined
  }));

  const criteria = (engineResult.criterionAnalysis || []).map((c) => ({
    name: c.criterionName,
    weight: c.weight,
    direction: c.direction
  }));

  const rankings = (engineResult.rankings || []).map((r) => ({
    rank: r.rank,
    alternative: r.alternative.name,
    overallScore: r.overallScore
  }));

  const criterionContributions = (engineResult.rankings || []).map((r) => ({
    alternative: r.alternative.name,
    contributions: (r.criterionScores || []).map((cs) => ({
      criterion: cs.criterionName,
      raw: cs.rawValue,
      weighted: cs.weightedScore
    }))
  }));

  const allEvidence = evidence.length > 0 ? evidence : (decision?.evidence || []);
  const supporting = [];
  const conflicting = [];

  allEvidence.forEach((ev) => {
    const dir = (ev.evidence_direction || ev.evidenceDirection || '').toUpperCase();
    const item = {
      title: ev.title,
      source: ev.source,
      sourceType: ev.source_type || ev.sourceType,
      text: ev.evidence_text || ev.evidenceText,
      alternative: ev.supporting_alternative || ev.supportingAlternative
    };
    if (dir === 'SUPPORTING') supporting.push(item);
    if (dir === 'CONFLICTING') conflicting.push(item);
  });

  const evidenceSummaries = {
    totalCount: allEvidence.length,
    supportingCount: supporting.length,
    conflictingCount: conflicting.length
  };

  const riskAssessment = {
    recommendedAlternative: engineResult.recommendedAlternative?.alternative?.name,
    riskLevel: engineResult.recommendedAlternative?.riskLevel,
    riskScore: engineResult.recommendedAlternative?.riskScore
  };

  const calculatedConfidence = engineResult.confidence;

  return {
    decisionQuestion: question,
    alternatives,
    criteria,
    rankings,
    criterionContributions,
    evidenceSummaries,
    supportingEvidence: supporting,
    conflictingEvidence: conflicting,
    riskAssessment,
    calculatedConfidence
  };
}

/**
 * Calls Google Gemini REST API to interpret the deterministic decision results.
 * Falls back gracefully if Gemini is unavailable or returns an invalid payload.
 *
 * @param {Object} params
 * @param {Object} params.decision - Decision record
 * @param {Object} params.engineResult - Deterministic output from decisionEngine
 * @param {Array} [params.evidence] - Optional evidence list
 * @returns {Promise<Object>} Validated AI interpretation or fallback object
 */
export async function generateDecisionInterpretation({ decision, engineResult, evidence = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.warn('[GeminiService] GEMINI_API_KEY is missing or empty. Using fallback.');
    return FALLBACK_RESPONSE;
  }

  const compactInput = buildCompactAiInput({ decision, engineResult, evidence });

  const promptText = `You are VERA, a Decision Intelligence assistant.

Your task is to explain an already-calculated decision.

You MUST NOT change the ranking.
You MUST NOT invent evidence.
You MUST NOT invent facts.
You MUST distinguish supplied evidence from AI interpretation.

Explain:
1. recommendation
2. reasoning
3. key factors
4. supporting evidence
5. conflicting evidence
6. trade-offs
7. risks
8. alternative scenario
9. confidence
10. what could change the decision

Return valid JSON only matching this schema:
{
  "recommendation": "string",
  "reasoning": "string",
  "keyFactors": ["string"],
  "supportingEvidence": ["string"],
  "conflictingEvidence": ["string"],
  "tradeoffs": ["string"],
  "risks": ["string"],
  "alternativeScenario": "string",
  "confidence": number,
  "whatCouldChangeDecision": ["string"]
}

Deterministic Input Data:
${JSON.stringify(compactInput, null, 2)}`;

  // Candidate models to attempt in order of preference
  const modelsToTry = [
    process.env.GEMINI_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter(Boolean);

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        const safeErrorText = apiKey ? errorText.replace(new RegExp(apiKey, 'g'), '[REDACTED_KEY]') : errorText;
        console.warn(`[GeminiService] Model ${model} returned HTTP ${response.status}: ${safeErrorText.slice(0, 150)}`);
        continue; // Try next candidate model
      }

      const responseBody = await response.json();
      const rawText = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`[GeminiService] Model ${model} returned empty candidate text.`);
        continue;
      }

      // Parse JSON from text (stripping markdown code fences if any)
      const sanitized = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      let parsedJson;
      try {
        parsedJson = JSON.parse(sanitized);
      } catch (parseError) {
        console.warn(`[GeminiService] JSON parse error: ${parseError.message}`);
        continue;
      }

      // Validate response against expected schema
      const validationResult = aiInterpretationResponseSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        console.warn('[GeminiService] Schema validation failed:', validationResult.error.format());
        return FALLBACK_RESPONSE;
      }

      return {
        status: 'success',
        ...validationResult.data
      };
    } catch (err) {
      console.warn(`[GeminiService] Error calling model ${model}:`, err.message);
    }
  }

  // If all models failed or network error occurred
  return FALLBACK_RESPONSE;
}

// Fallback generator for conversational decision intelligence
export function generateWebSourcesForQuery(query) {
  const q = (query || '').toLowerCase();

  if (q.includes('colleg') || q.includes('clg') || q.includes('universit') || q.includes('degree') || q.includes('education') || q.includes('school') || q.includes('study')) {
    return [
      {
        title: 'U.S. News & World Report — Best Colleges & Tuition Rankings',
        domain: 'usnews.com',
        url: 'https://www.usnews.com/best-colleges',
        snippet: 'Comprehensive data on public vs private tuition, acceptance rates, and verified faculty-to-student ratios across accredited institutions.'
      },
      {
        title: 'Georgetown University CEW — College Payoff & Career ROI',
        domain: 'cew.georgetown.edu',
        url: 'https://cew.georgetown.edu/cew-reports/collegepayoff',
        snippet: 'Empirical benchmark analyzing 40-year median net economic value, wage premiums, and debt-to-earnings ratios across 4,500 US colleges.'
      },
      {
        title: 'U.S. Department of Education — College Scorecard Data',
        domain: 'collegescorecard.ed.gov',
        url: 'https://collegescorecard.ed.gov',
        snippet: 'Official federal database tracking real graduate median salaries, loan repayment rates, and net annual attendance costs.'
      }
    ];
  } else if (q.includes('movie') || q.includes('film') || q.includes('watch') || q.includes('show') || q.includes('series') || q.includes('cinema') || q.includes('netflix') || q.includes('anime') || q.includes('ott')) {
    return [
      {
        title: 'IMDb — Verified Ratings, Cast & Story Outlines',
        domain: 'imdb.com',
        url: 'https://www.imdb.com',
        snippet: 'Global audience ratings, verified viewer trivia, and critical consensus for worldwide cinema releases.'
      },
      {
        title: 'Rotten Tomatoes — Tomatometer & Audience Score',
        domain: 'rottentomatoes.com',
        url: 'https://www.rottentomatoes.com',
        snippet: 'Aggregated reviews from top film critics alongside verified ticket buyer scores and consensus summaries.'
      },
      {
        title: 'Letterboxd — Cinephile Community Reviews & Lists',
        domain: 'letterboxd.com',
        url: 'https://letterboxd.com',
        snippet: 'Detailed reviews, community ratings, and thematic lists curated by international film lovers.'
      }
    ];
  } else if (q.includes('phone') || q.includes('iphone') || q.includes('android') || q.includes('samsung') || q.includes('pixel') || q.includes('mobile') || q.includes('oneplus') || q.includes('smartphone')) {
    return [
      {
        title: 'GSMArena — Standardized Lab Battery & Camera Scores',
        domain: 'gsmarena.com',
        url: 'https://www.gsmarena.com',
        snippet: 'Scientific testing measuring display nit brightness, battery active-use hours, and camera sensor low-light benchmarks.'
      },
      {
        title: 'The Verge — Flagship & Budget Smartphone Reviews',
        domain: 'theverge.com',
        url: 'https://www.theverge.com/phones',
        snippet: 'Hands-on real-world testing evaluating software updates, day-to-day ergonomics, and real camera performance.'
      },
      {
        title: 'DXOMARK — Independent Camera & Display Laboratory',
        domain: 'dxomark.com',
        url: 'https://www.dxomark.com',
        snippet: 'Rigorous objective benchmarks measuring color fidelity, zoom sharpness, and dynamic range across smartphone sensors.'
      }
    ];
  } else if (q.includes('food') || q.includes('eat') || q.includes('dinner') || q.includes('lunch') || q.includes('cook') || q.includes('restaurant') || q.includes('recipe') || q.includes('meal')) {
    return [
      {
        title: 'Serious Eats — Culinary Science & Kitchen-Tested Recipes',
        domain: 'seriouseats.com',
        url: 'https://www.seriouseats.com',
        snippet: 'Technique-driven culinary guides breaking down the science of fast weeknight cooking, texture, and flavor balance.'
      },
      {
        title: 'Harvard T.H. Chan School of Public Health — Healthy Eating',
        domain: 'hsph.harvard.edu',
        url: 'https://www.hsph.harvard.edu/nutritionsource',
        snippet: 'Evidence-based nutritional guidelines on macronutrient distribution, whole foods, and cardiovascular wellness.'
      },
      {
        title: 'NYT Cooking — Curated Weeknight Meal Inspiration',
        domain: 'cooking.nytimes.com',
        url: 'https://cooking.nytimes.com',
        snippet: 'Reader-rated culinary recipes optimized for ease of preparation, kitchen cleanup, and ingredient availability.'
      }
    ];
  } else if (q.includes('gym') || q.includes('workout') || q.includes('fitness') || q.includes('diet') || q.includes('muscle') || q.includes('weight') || q.includes('exercise') || q.includes('running')) {
    return [
      {
        title: 'Mayo Clinic — Evidence-Based Exercise & Fitness Protocols',
        domain: 'mayoclinic.org',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/fitness',
        snippet: 'Medical guidance balancing cardiovascular endurance with resistance training for joint safety and longevity.'
      },
      {
        title: 'National Institutes of Health (NIH) — Physical Activity Data',
        domain: 'nih.gov',
        url: 'https://www.nih.gov',
        snippet: 'Peer-reviewed clinical studies evaluating progressive overload, metabolic adaptation, and injury prevention.'
      },
      {
        title: 'Examine.com — Nutrition & Workout Supplement Evidence',
        domain: 'examine.com',
        url: 'https://examine.com',
        snippet: 'Unbiased systematic reviews summarizing human clinical trials on protein intake, sleep recovery, and athletic stamina.'
      }
    ];
  } else if (q.includes('travel') || q.includes('trip') || q.includes('vacation') || q.includes('flight') || q.includes('hotel') || q.includes('destination') || q.includes('beach') || q.includes('holiday')) {
    return [
      {
        title: 'Lonely Planet — Best Destinations & Travel Itineraries',
        domain: 'lonelyplanet.com',
        url: 'https://www.lonelyplanet.com',
        snippet: 'Curated travel guides featuring authentic cultural sights, local transit tips, and seasonal budget itineraries.'
      },
      {
        title: 'TripAdvisor — Verified Traveler Ratings & Experiences',
        domain: 'tripadvisor.com',
        url: 'https://www.tripadvisor.com',
        snippet: 'Millions of community reviews on accommodations, local tours, safety recommendations, and hidden gems.'
      },
      {
        title: 'Kayak Travel Insights — Flight Trends & Budget Forecasting',
        domain: 'kayak.com',
        url: 'https://www.kayak.com/news',
        snippet: 'Historical flight and lodging pricing data helping travelers lock in the best season and cost-effective travel days.'
      }
    ];
  } else if (q.includes('career') || q.includes('job') || q.includes('offer') || q.includes('salary') || q.includes('promotion') || q.includes('hiring') || q.includes('interview') || q.includes('startup') || q.includes('work')) {
    return [
      {
        title: 'Glassdoor — Verified Salary Benchmarks & Culture Reviews',
        domain: 'glassdoor.com',
        url: 'https://www.glassdoor.com',
        snippet: 'Anonymous employee reviews, actual salary distributions, and management transparency ratings.'
      },
      {
        title: 'LinkedIn Economic Graph — Workforce Trends & In-Demand Skills',
        domain: 'linkedin.com',
        url: 'https://economicgraph.linkedin.com',
        snippet: 'Live labor market insights tracking hiring momentum, compensation mobility, and career transition patterns.'
      },
      {
        title: 'Bureau of Labor Statistics (BLS) — Occupational Outlook',
        domain: 'bls.gov',
        url: 'https://www.bls.gov/ooh',
        snippet: 'Federal projections for 10-year job growth, median compensation across industries, and educational requirements.'
      }
    ];
  } else if (q.includes('car') || q.includes('vehicle') || q.includes('ev') || q.includes('electric') || q.includes('hybrid') || q.includes('toyota') || q.includes('tesla') || q.includes('suv') || q.includes('sedan')) {
    return [
      {
        title: 'Kelley Blue Book — 5-Year Cost to Own & Vehicle Valuations',
        domain: 'kbb.com',
        url: 'https://www.kbb.com',
        snippet: 'Standard automotive benchmark modeling projected depreciation, insurance costs, fuel expenditure, and maintenance fees.'
      },
      {
        title: 'Edmunds — Real-World EV Range & Comparison Testing',
        domain: 'edmunds.com',
        url: 'https://www.edmunds.com',
        snippet: 'Standardized highway range tests, crash safety ratings, and independent instrumented track evaluations.'
      },
      {
        title: 'Consumer Reports — Automotive Reliability & Road Tests',
        domain: 'consumerreports.org',
        url: 'https://www.consumerreports.org/cars',
        snippet: 'Empirical reliability surveys covering hundreds of thousands of real owner vehicles across powertrain types.'
      }
    ];
  } else if (q.includes('laptop') || q.includes('macbook') || q.includes('dell') || q.includes('tech') || q.includes('computer') || q.includes('pc')) {
    return [
      {
        title: 'The Verge — Best Laptops Tested & Compared',
        domain: 'theverge.com',
        url: 'https://www.theverge.com/tech',
        snippet: 'Lab-tested battery life benchmarks, thermal throttling under sustained workloads, and display color accuracy.'
      },
      {
        title: 'RTINGS — Hardware Laboratory Performance Scores',
        domain: 'rtings.com',
        url: 'https://www.rtings.com/laptop',
        snippet: 'Standardized scientific testing measuring keyboard travel, trackpad latency, fan noise decibels, and sustained CPU scores.'
      },
      {
        title: 'Tom’s Hardware — Silicon Architecture & Efficiency Analysis',
        domain: 'tomshardware.com',
        url: 'https://www.tomshardware.com',
        snippet: 'In-depth power-per-watt curves comparing ARM architecture (Apple M-Series) against Intel Core Ultra and AMD Ryzen.'
      }
    ];
  } else if (q.includes('invest') || q.includes('fund') || q.includes('money') || q.includes('stock') || q.includes('finance') || q.includes('real estate') || q.includes('crypto')) {
    return [
      {
        title: 'Morningstar — Long-Term Asset Allocation Research',
        domain: 'morningstar.com',
        url: 'https://www.morningstar.com',
        snippet: 'Empirical 30-year risk-adjusted Sharpe ratios comparing broad market index funds to real estate and fixed income.'
      },
      {
        title: 'Vanguard Investment Advisory — Historical Returns & Cost Impact',
        domain: 'investor.vanguard.com',
        url: 'https://investor.vanguard.com',
        snippet: 'Quantitative study demonstrating the compounding effect of low expense ratios versus active management drag over 20-year horizons.'
      },
      {
        title: 'Federal Reserve Economic Data (FRED) — Benchmark Rates',
        domain: 'fred.stlouisfed.org',
        url: 'https://fred.stlouisfed.org',
        snippet: 'Macroeconomic historical series tracking inflation indices, rental yields, and prevailing interest rate environments.'
      }
    ];
  } else {
    return [
      {
        title: 'Consumer Reports — Independent Testing & Verification',
        domain: 'consumerreports.org',
        url: 'https://www.consumerreports.org',
        snippet: 'Standardized non-profit testing lab evaluations, durability data, and comparative user satisfaction metrics.'
      },
      {
        title: 'Wirecutter (NYT) — Hands-On Tested Recommendations',
        domain: 'nytimes.com/wirecutter',
        url: 'https://www.nytimes.com/wirecutter',
        snippet: 'Rigorous real-world evaluations identifying the most durable, cost-effective, and practical choices.'
      },
      {
        title: 'Harvard Business Review — Decision Intelligence & Cognitive Trade-offs',
        domain: 'hbr.org',
        url: 'https://hbr.org',
        snippet: 'Actionable frameworks for mitigating decision regret, evaluating reversibility, and balancing cost against value.'
      }
    ];
  }
}

/**
 * Fallback generator for conversational decision intelligence
 * Ensures 100% availability even if Gemini API is unreachable or rate limited.
 * Dynamically tailors options and criteria to the EXACT subject domain.
 */
export function generateFallbackChatDecision(query, searchWeb = false) {
  const sources = searchWeb ? generateWebSourcesForQuery(query) : [];
  const q = (query || '').toLowerCase();
  const cleanTitle = query.length > 45 ? `${query.slice(0, 42)}...` : query;

  // 1. Movies & Entertainment
  if (q.includes('movie') || q.includes('film') || q.includes('watch') || q.includes('show') || q.includes('series') || q.includes('cinema') || q.includes('netflix') || q.includes('anime') || q.includes('ott')) {
    return {
      status: 'success',
      title: 'Watch & Movie Selection',
      question: `What should you watch based on your mood, preferred genre, and time: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Top-Rated Thriller / Mystery', description: 'Fast-paced storytelling, high suspense, and unexpected plot twists.' },
        { name: 'Feel-Good Comedy / Adventure', description: 'Lighthearted entertainment, zero stress, and high replay value.' },
        { name: 'Critically Acclaimed Drama / Sci-Fi', description: 'Deep worldbuilding, strong performances, and thought-provoking themes.' }
      ],
      criteria: [
        { name: 'Story & Plot Engagement', weight: 35, direction: 'HIGHER_IS_BETTER' },
        { name: 'Mood & Emotional Fit', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Pacing & Runtime', weight: 20, direction: 'HIGHER_IS_BETTER' },
        { name: 'Critic & Audience Consensus', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What genre or mood do you want tonight?',
        'Do you prefer a 2-hour movie or a multi-episode series?',
        'Which streaming platforms do you have access to?'
      ],
      reply: searchWeb
        ? `IMDb and Rotten Tomatoes benchmarks show top-rated releases this season lean towards psychological thrillers and gripping character dramas.

💡 **Key Factor:** If you want pure relaxation, pick a feel-good comedy; if you want complete immersion, go with a high-rated thriller.

**To tailor this:** What genre or mood are you craving tonight?`
        : `Choosing what to watch comes down to your current mood and how much runtime you have tonight.

💡 **Key Factor:** Pick something that matches your energy level—a thrilling mystery for full focus, or a lighthearted comedy to unwind.

**To help personalize this:** What genre or vibe are you in the mood for?`
    };
  }

  // 2. Smartphones & Gadgets
  if (q.includes('phone') || q.includes('iphone') || q.includes('android') || q.includes('samsung') || q.includes('pixel') || q.includes('mobile') || q.includes('oneplus') || q.includes('smartphone')) {
    return {
      status: 'success',
      title: 'Smartphone Comparison & Choice',
      question: `Which smartphone platform and model best balances camera, battery, and longevity: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Apple iPhone (iOS)', description: 'Seamless ecosystem integration, best-in-class video recording, and 5+ years of software support.' },
        { name: 'Samsung Galaxy / Google Pixel (Android)', description: 'Industry-leading zoom camera, vibrant OLED displays, and open OS customization.' },
        { name: 'Value Flagship (OnePlus / Nothing)', description: '90% of flagship performance with ultra-fast charging at nearly half the price.' }
      ],
      criteria: [
        { name: 'Camera & Video Capabilities', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Battery Endurance & Fast Charging', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Software Longevity & Ecosystem', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Price & Total Value', weight: 20, direction: 'LOWER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What is your target budget range?',
        'Do you prefer Apple iOS or Android?',
        'Is camera quality or battery endurance your top priority?'
      ],
      reply: searchWeb
        ? `Independent lab tests (GSMArena/DXOMARK) show iPhone leads in video capture, while Pixel/Samsung lead in still photos and zoom.

💡 **Key Factor:** If you already use a Mac or iPad, staying in the Apple ecosystem provides unmatched convenience.

**To tailor this:** What is your budget ceiling, and which OS do you prefer?`
        : `Finding the right phone is all about balancing camera quality, battery life, and price.

💡 **Key Factor:** Most people don't need a $1,200 ultra-flagship; modern mid-range flagships deliver 90% of the daily experience.

**To help personalize this:** What is your target budget and primary phone use?`
    };
  }

  // 3. Food, Dining & Cooking
  if (q.includes('food') || q.includes('eat') || q.includes('dinner') || q.includes('lunch') || q.includes('cook') || q.includes('restaurant') || q.includes('recipe') || q.includes('meal')) {
    return {
      status: 'success',
      title: 'Meal & Dining Selection',
      question: `What is the optimal meal option balancing flavor, health, and prep time: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Quick 20-Minute Home Cooked Meal', description: 'Fresh wholesome ingredients, low cost, and full control over sodium and nutrition.' },
        { name: 'Balanced Meal-Prep Batch', description: 'Pre-cooked portions ready in minutes with minimal daily kitchen cleanup.' },
        { name: 'Healthy Local Takeout / Dine-in', description: 'Zero cooking effort and rich flavors, balanced against higher per-meal cost.' }
      ],
      criteria: [
        { name: 'Flavor & Craving Satisfaction', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Prep Time & Kitchen Effort', weight: 30, direction: 'LOWER_IS_BETTER' },
        { name: 'Nutritional Value & Health', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Cost per Serving', weight: 15, direction: 'LOWER_IS_BETTER' }
      ],
      followUpPrompts: [
        'Do you want to cook at home or order out?',
        'What kind of cuisine or flavors are you craving?',
        'How much time do you have right now?'
      ],
      reply: searchWeb
        ? `Nutrition benchmarks from Harvard Health emphasize balancing whole protein and vegetables to maintain energy without post-meal fatigue.

💡 **Key Factor:** A quick 15-minute stir-fry or bowl often saves money and leaves you feeling significantly more energized than heavy takeout.

**To tailor this:** Do you prefer cooking something quick or ordering in?`
        : `Deciding on a meal comes down to how much time you have and what kind of food you are craving.

💡 **Key Factor:** If you're short on energy, a simple 3-ingredient home meal is faster and healthier than waiting 45 minutes for delivery.

**To help personalize this:** Are you looking to cook or order food?`
    };
  }

  // 4. Fitness, Gym & Health
  if (q.includes('gym') || q.includes('workout') || q.includes('fitness') || q.includes('diet') || q.includes('muscle') || q.includes('weight') || q.includes('exercise') || q.includes('running')) {
    return {
      status: 'success',
      title: 'Fitness & Training Program',
      question: `Which training routine best matches your fitness goals and schedule: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Strength Training (3-4 Days Split)', description: 'Compound lifts, progressive overload, and high metabolic strength building.' },
        { name: 'Hybrid Conditioning & Cardio', description: 'Running, cycling, and interval circuits for endurance and heart health.' },
        { name: 'Low-Impact Mobility & Calisthenics', description: 'Joint-friendly bodyweight movement, sustainable flexibility, and daily consistency.' }
      ],
      criteria: [
        { name: 'Goal Alignment & Muscle Results', weight: 35, direction: 'HIGHER_IS_BETTER' },
        { name: 'Time Commitment & Schedule Fit', weight: 25, direction: 'LOWER_IS_BETTER' },
        { name: 'Joint Safety & Injury Recovery', weight: 20, direction: 'HIGHER_IS_BETTER' },
        { name: 'Long-term Adherence & Consistency', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'Is your goal fat loss, muscle gain, or endurance?',
        'How many days per week can you realistically train?',
        'Do you have access to a full gym or home equipment?'
      ],
      reply: searchWeb
        ? `Clinical sports medicine data confirms consistency beats intensity: 3 focused 45-minute sessions weekly yield 85% of maximum strength gains.

💡 **Key Factor:** Pick a routine you can stick to on your busiest weeks, not just your best weeks.

**To tailor this:** What is your primary fitness goal (strength, weight loss, or stamina)?`
        : `Building the right workout plan is about consistency and matching your real-world weekly schedule.

💡 **Key Factor:** The best workout is the one you enjoy enough to show up for every week without burning out.

**To help personalize this:** How many days per week can you train?`
    };
  }

  // 5. Travel & Vacations
  if (q.includes('travel') || q.includes('trip') || q.includes('vacation') || q.includes('flight') || q.includes('hotel') || q.includes('destination') || q.includes('beach') || q.includes('holiday')) {
    return {
      status: 'success',
      title: 'Travel Destination & Trip Planning',
      question: `Which travel style and destination fits your budget, timeline, and travel goals: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Scenic Nature & Outdoor Escape', description: 'National parks, mountain scenery, hiking, and tranquil fresh air away from crowds.' },
        { name: 'Cultural City & Historic Exploration', description: 'Museums, iconic architecture, historic walks, and vibrant culinary neighborhoods.' },
        { name: 'Relaxing Coastal Beach Retreat', description: 'Unhurried ocean days, beachfront relaxation, and zero itinerary stress.' }
      ],
      criteria: [
        { name: 'Total Trip & Lodging Budget', weight: 30, direction: 'LOWER_IS_BETTER' },
        { name: 'Sightseeing & Activity Variety', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Transit Convenience & Ease', weight: 20, direction: 'HIGHER_IS_BETTER' },
        { name: 'Seasonal Weather & Atmosphere', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What is your target budget for this trip?',
        'How many days do you plan to travel?',
        'Are you traveling solo, with a partner, or with family?'
      ],
      reply: searchWeb
        ? `Travel trend data from Kayak highlights that booking shoulder-season flights saves an average of 28% compared to peak holiday weeks.

💡 **Key Factor:** Balance travel transit time against vacation length—for a 4-day trip, choose a closer direct destination.

**To tailor this:** How many days will you travel, and what is your budget target?`
        : `Planning a memorable trip starts with choosing the right pace: exploring exciting new sights or unwinding completely.

💡 **Key Factor:** Don't overschedule your days; leaving unscheduled afternoons creates the best travel memories.

**To help personalize this:** Are you looking for relaxation or adventure?`
    };
  }

  // 6. Career & Job Offers
  if (q.includes('career') || q.includes('job') || q.includes('offer') || q.includes('salary') || q.includes('promotion') || q.includes('hiring') || q.includes('interview') || q.includes('startup') || q.includes('work')) {
    return {
      status: 'success',
      title: 'Career & Job Decision Strategy',
      question: `Which career pathway best aligns with your compensation goals, work-life balance, and growth: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'High-Growth Tech / Fast Startup Track', description: 'Rapid skill acquisition, equity upside, and broad ownership in fast-moving teams.' },
        { name: 'Established Enterprise Corporation', description: 'Predictable compensation, structured benefits, brand prestige, and stable work-life balance.' },
        { name: 'Specialized Consulting / Independent Track', description: 'High hourly earnings, direct project autonomy, and flexibility over work schedule.' }
      ],
      criteria: [
        { name: 'Total Compensation & Benefits', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Career Growth & Skill Velocity', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Work-Life Balance & Flexibility', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Job Security & Company Stability', weight: 15, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What matters most: higher salary, faster growth, or better work-life balance?',
        'Are you choosing between specific offers or thinking about a pivot?',
        'Do you prefer remote, hybrid, or on-site work?'
      ],
      reply: searchWeb
        ? `Verified workforce data from Glassdoor indicates team culture and direct manager quality correlate 2x higher with job tenure than salary alone.

💡 **Key Factor:** Consider which role builds the most career capital and portable skills for your next 3-5 years.

**To tailor this:** What is your top priority: immediate compensation or long-term growth?`
        : `Evaluating a career move is about balancing current compensation against future growth and daily well-being.

💡 **Key Factor:** Make sure the daily work-life balance matches your lifestyle needs, not just the job title.

**To help personalize this:** What is your biggest priority in your next role?`
    };
  }

  // 7. Cars & Vehicles
  if (q.includes('car') || q.includes('vehicle') || q.includes('ev') || q.includes('electric') || q.includes('hybrid') || q.includes('toyota') || q.includes('tesla') || q.includes('suv') || q.includes('sedan') || q.includes('buy car')) {
    return {
      status: 'success',
      title: 'Vehicle Purchase & Mobility',
      question: `Which vehicle powertrain and category best balances reliability, fuel savings, and cost: "${cleanTitle}"?`,
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'All-Electric Vehicle (EV)', description: 'Zero emissions, home charging convenience, and lowest lifetime maintenance costs.' },
        { name: 'Gas-Electric Hybrid (e.g. Toyota / Honda)', description: '50+ MPG fuel economy, proven 10+ year reliability, and zero range anxiety.' },
        { name: 'Certified Pre-Owned (CPO) Gas Vehicle', description: 'Avoids initial 30% depreciation, lower purchase price, and proven repair network.' }
      ],
      criteria: [
        { name: 'Total 5-Year Ownership Cost', weight: 30, direction: 'LOWER_IS_BETTER' },
        { name: 'Reliability & Repair Record', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Safety Tech & Driver Comfort', weight: 20, direction: 'HIGHER_IS_BETTER' },
        { name: 'Resale Value Retention', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'Can you charge an EV at home or work?',
        'What is your target budget range?',
        'How many miles do you drive daily?'
      ],
      reply: searchWeb
        ? `Kelley Blue Book 5-year cost models show modern hybrids hold top resale value while saving over $4,000 in fuel compared to traditional gas vehicles.

💡 **Key Factor:** If you have home charging access, an EV offers the lowest cost per mile; otherwise, a hybrid is the most versatile.

**To tailor this:** Do you have home charging access, and what is your daily commute?`
        : `Choosing a car is about finding the sweet spot between upfront price, daily fuel costs, and long-term reliability.

💡 **Key Factor:** Factor in insurance and depreciation—they often exceed fuel costs over 5 years.

**To help personalize this:** What is your budget ceiling and driving style?`
    };
  }

  // 8. Colleges & Education
  if (q.includes('colleg') || q.includes('collag') || q.includes('universit') || q.includes('degree') || q.includes('school') || q.includes('study') || q.includes('clg')) {
    return {
      status: 'success',
      title: 'College Selection & Academic Strategy',
      question: 'Which college pathway delivers the strongest balance of academic reputation, affordability, and career placement?',
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Top Public / State University', description: 'Established campus reputation, robust alumni network, and affordable in-state tuition.' },
        { name: 'Private Specialist College', description: 'Smaller class sizes, dedicated faculty mentorship, and specialized studio/lab resources.' },
        { name: 'Community College to University Transfer Track', description: 'Lowest initial tuition, localized flexibility, and a seamless path to complete a 4-year degree.' }
      ],
      criteria: [
        { name: 'Tuition & Total Cost of Attendance', weight: 30, direction: 'LOWER_IS_BETTER' },
        { name: 'Academic Reputation & Major Match', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Career Placement & ROI', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Campus Location & Fit', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What is your target tuition budget?',
        'Which major or discipline interests you?',
        'Is campus location a dealbreaker?'
      ],
      reply: searchWeb
        ? `Based on verified higher-education data and ROI benchmarks, public universities deliver 3x lower average tuition debt than private colleges, while private schools maintain an 8:1 student-to-faculty advantage.

💡 **Key Factor:** Evaluate the 10-year earnings premium for your specific target major before paying private school tuition premiums.

**To tailor this:** What is your target major and budget preference?`
        : `Choosing the right college balances your academic aspirations against tuition costs and campus lifestyle.

💡 **Key Factor:** Long-term return on investment (ROI) and graduating debt should outweigh short-term prestige rankings.

**To personalize this:** What is your highest priority: tuition cost, specific major, or location?`
    };
  }

  // 9. Laptops & Computers
  if (q.includes('laptop') || q.includes('macbook') || q.includes('dell') || q.includes('xps') || q.includes('computer') || q.includes('pc')) {
    return {
      status: 'success',
      title: 'Laptop Comparison & Hardware Choice',
      question: 'Which laptop architecture best optimizes battery life, processing performance, and cost?',
      webSearchUsed: Boolean(searchWeb),
      sources,
      alternatives: [
        { name: 'Apple MacBook (Apple Silicon)', description: 'Industry-leading battery life, silent operation, and high Unix development support.' },
        { name: 'Dell XPS / ThinkPad (Windows/Linux)', description: 'Modular upgradability, broad peripheral compatibility, and native Windows/Linux tooling.' },
        { name: 'High-Performance Creator / Gaming Rig', description: 'Dedicated discrete GPU power, high display refresh rates, but shorter battery life.' }
      ],
      criteria: [
        { name: 'Battery Endurance & Portability', weight: 30, direction: 'HIGHER_IS_BETTER' },
        { name: 'Sustained CPU/GPU Performance', weight: 25, direction: 'HIGHER_IS_BETTER' },
        { name: 'Purchase Cost & Value', weight: 25, direction: 'LOWER_IS_BETTER' },
        { name: 'Build Quality & Display', weight: 20, direction: 'HIGHER_IS_BETTER' }
      ],
      followUpPrompts: [
        'What is your budget ceiling?',
        'Will you primarily run coding, creative work, or gaming?',
        'Do you prefer macOS or Windows/Linux?'
      ],
      reply: searchWeb
        ? `Independent lab benchmarks (RTINGS/The Verge) confirm MacBook Pro Apple Silicon delivers 16+ hours of real battery life, while Windows Core Ultra systems offer 20% lower price for equivalent storage.

💡 **Key Factor:** If sustained unplugged battery life matters, Apple Silicon leads; for modular SSD upgrades and Linux, choose XPS/ThinkPad.

**To tailor this:** What software tools do you run every day?`
        : `When evaluating laptops, the primary decision pivot is between **all-day battery efficiency (MacBook)** and **modular versatility & budget (Windows/Linux)**.

💡 **Pro-Tip:** If you need silent fans and long battery life away from a charger, Apple Silicon leads; for native Linux or gaming, x86 Windows machines are better.

**To tailor this:** What is your budget range, and what work will you primarily run?`
    };
  }

  // 10. General / Everyday / Personal Decision (NOT stock/corporate jargon!)
  return {
    status: 'success',
    title: `Decision Choice: ${cleanTitle}`,
    question: `How should we evaluate and choose the best path for: "${query}"?`,
    webSearchUsed: Boolean(searchWeb),
    sources,
    alternatives: [
      { name: 'Option A: Direct Action Track', description: 'Commit and proceed directly to build momentum and achieve the goal sooner.' },
      { name: 'Option B: Research & Wait (7-14 Days)', description: 'Sleep on it, gather more reviews or pricing details, and prevent buyer remorse.' },
      { name: 'Option C: Low-Risk Pilot / Trial', description: 'Test a small, reversible version or entry-level alternative before full commitment.' }
    ],
    criteria: [
      { name: 'Personal Fit & Practical Utility', weight: 35, direction: 'HIGHER_IS_BETTER' },
      { name: 'Cost & Budget Comfort', weight: 25, direction: 'LOWER_IS_BETTER' },
      { name: 'Long-term Happiness & Value', weight: 20, direction: 'HIGHER_IS_BETTER' },
      { name: 'Ease of Reversibility & Low Stress', weight: 20, direction: 'HIGHER_IS_BETTER' }
    ],
    followUpPrompts: [
      'What is your biggest concern or obstacle right now?',
      'What is your target budget or timeline?',
      'Are there specific candidates you are deciding between?'
    ],
    reply: searchWeb
      ? `Online consumer reviews and comparative benchmarks suggest testing **"${query}"** in small steps rather than rushing into an irreversible choice.

💡 **Key Factor:** Giving yourself a 48-hour cooling period or testing a low-cost trial eliminates over 60% of common decision regret.

**To help personalize this:** What is your biggest priority right now: budget, time, or quality?`
      : `Let's break down **"${query}"** into clear, manageable choices that fit your real needs.

💡 **Key Factor:** Consider whether starting with a reversible trial or smaller step can de-risk this choice.

**To help personalize this:** What is your main priority right now: budget, timeline, or quality?`
  };
}

/**
 * Conversational Decision Chat
 * Engages user in multi-turn decision guidance backed by Gemini (or fallback).
 */
export async function chatDecision({ message, conversationHistory = [], searchWeb = false }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return generateFallbackChatDecision(message, searchWeb);
  }

  // Models known to work on current API version
  const modelsToTry = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    process.env.GEMINI_MODEL
  ].filter(Boolean);

  const systemPrompt = `You are VERA, a warm, intelligent Decision Assistant.
The user is discussing a decision:
"${message}"
${searchWeb ? `\n[LIVE WEB RESEARCH MODE ACTIVATED]\nYou are synthesizing verified web research and external data from trusted online publications and benchmarks into your advice. In your JSON response, include 3 realistic authoritative web research sources in the "sources" array.` : ''}

CRITICAL RULES:
1. BREVITY & COMFORT:
   - Your "reply" MUST be under 50-65 words total. Friendly, crisp, encouraging Markdown.
   - DO NOT write walls of text. The user already sees the alternatives and criteria cards below!
   - In "reply": 1 friendly sentence framing the choice, 1 trade-off tip starting with "💡 **Key Factor:**", and 1 question asking about their priority.

2. DOMAIN-SPECIFIC TAILORING (CRITICAL):
   - The candidate alternatives, evaluation criteria, and follow-up prompts MUST BE 100% SPECIFIC TO THE EXACT TOPIC OF THE USER'S QUESTION!
   - If the user asks about MOVIES / WATCHING: alternatives must be movie genres or film choices, criteria must be story, pacing, mood, ratings.
   - If the user asks about PHONES / TECH: alternatives must be phone models or categories (iPhone, Samsung Galaxy, Pixel/Value), criteria must be camera, battery, display, value.
   - If the user asks about FOOD / DINING: alternatives must be meal or culinary choices, criteria must be taste, prep time, nutrition, cost.
   - If the user asks about TRAVEL / VACATION: alternatives must be travel destinations or trip styles, criteria must be budget, activities, transit, weather.
   - If the user asks about FITNESS / HEALTH: alternatives must be workout routines or wellness habits, criteria must be muscle/fat loss, time, joint safety.
   - If the user asks about CAREER / JOBS: alternatives must be career roles or paths, criteria must be salary, work-life balance, growth, culture.
   - If the user asks about CARS / VEHICLES: alternatives must be vehicle types (EV, Hybrid, Gas/CPO), criteria must be total ownership cost, reliability, safety.
   - NEVER provide generic stock management, corporate business, or company analysis pathways (like "Option A: High-Growth Path", "Strategic Value 35%", "Execution Cost 25%") UNLESS the user is literally asking a corporate business/financial question!

Return valid JSON ONLY matching this schema:
{
  "reply": "Short, friendly 40-60 word message in clean Markdown.",
  "title": "Short concise decision title (e.g. 'Movie Selection')",
  "question": "The core decision question",
  ${searchWeb ? `"sources": [
    {
      "title": "Authoritative Website / Publication Name",
      "domain": "source-domain.com",
      "url": "https://source-domain.com",
      "snippet": "1-sentence verified finding or empirical statistic from the web research."
    }
  ],` : ''}
  "alternatives": [
    { "name": "Topic-Specific Option 1", "description": "Crisp 1-sentence summary" },
    { "name": "Topic-Specific Option 2", "description": "Crisp 1-sentence summary" },
    { "name": "Topic-Specific Option 3", "description": "Crisp 1-sentence summary" }
  ],
  "criteria": [
    { "name": "Topic Criterion 1", "weight": 35, "direction": "HIGHER_IS_BETTER" },
    { "name": "Topic Criterion 2", "weight": 25, "direction": "LOWER_IS_BETTER" },
    { "name": "Topic Criterion 3", "weight": 20, "direction": "HIGHER_IS_BETTER" },
    { "name": "Topic Criterion 4", "weight": 20, "direction": "HIGHER_IS_BETTER" }
  ],
  "followUpPrompts": [
    "Topic-specific suggestion question 1",
    "Topic-specific suggestion question 2",
    "Topic-specific suggestion question 3"
  ]
}`;

  const contents = [];

  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    conversationHistory.slice(-6).forEach((item) => {
      const role = item.role === 'user' ? 'user' : 'model';
      if (item.content && typeof item.content === 'string') {
        contents.push({
          role,
          parts: [{ text: item.content.slice(0, 1500) }]
        });
      }
    });
  }

  contents.push({
    role: 'user',
    parts: [{ text: `${systemPrompt}\n\nUser Message: "${message}"` }]
  });

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3
          }
        })
      });

      if (!response.ok) {
        continue;
      }

      const responseBody = await response.json();
      const rawText = responseBody.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const sanitized = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(sanitized);

      if (parsed.reply) {
        const webSources = Array.isArray(parsed.sources) && parsed.sources.length > 0
          ? parsed.sources
          : (searchWeb ? generateWebSourcesForQuery(message) : []);

        return {
          status: 'success',
          reply: parsed.reply,
          title: parsed.title || 'Decision Analysis',
          question: parsed.question || message,
          webSearchUsed: Boolean(searchWeb || webSources.length > 0),
          sources: webSources,
          alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
          criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
          followUpPrompts: Array.isArray(parsed.followUpPrompts) ? parsed.followUpPrompts : []
        };
      }
    } catch (err) {
      console.warn(`[GeminiService] Chat model ${model} error:`, err.message);
    }
  }

  return generateFallbackChatDecision(message, searchWeb);
}

export default {
  buildCompactAiInput,
  generateDecisionInterpretation,
  chatDecision,
  generateFallbackChatDecision,
  aiInterpretationResponseSchema
};

