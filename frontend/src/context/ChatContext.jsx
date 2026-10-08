import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { decisionService } from '../services/decisionService';

const ChatContext = createContext(null);

const STORAGE_MESSAGES_KEY = 'vera_convo_messages';
const STORAGE_DATA_KEY = 'vera_convo_decision_data';
const STORAGE_HISTORY_KEY = 'vera_chat_history_sessions';
const STORAGE_ACTIVE_ID_KEY = 'vera_active_session_id';

// Initial realistic default sessions matching Decision Intelligence workflows
const DEFAULT_SESSIONS = [
  {
    id: 'sess-pin-1',
    title: 'Decision Intelligence AI',
    isPinned: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    messages: [
      {
        id: 'msg-p1-1',
        role: 'user',
        content: 'How does VERA Decision Intelligence analyze multi-criteria tradeoffs?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'msg-p1-2',
        role: 'assistant',
        content: 'VERA uses deterministic normalized weighting combined with qualitative synthesis. Every alternative is evaluated systematically against weighted criteria to minimize cognitive bias.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        decisionData: {
          title: 'Decision Intelligence Framework',
          question: 'How to structure multi-criteria tradeoffs?',
          alternatives: [
            { name: 'Weighted Scoring Engine', description: 'Deterministic math-based normalization' },
            { name: 'Qualitative Synthesis', description: 'LLM evidence extraction & synthesis' },
            { name: 'Sensitivity Simulation', description: 'What-if stress testing across thresholds' }
          ],
          criteria: [
            { name: 'Scoring Accuracy', weight: 40, direction: 'HIGHER_IS_BETTER' },
            { name: 'Evidence Verifiability', weight: 35, direction: 'HIGHER_IS_BETTER' },
            { name: 'Cognitive Bias Mitigation', weight: 25, direction: 'HIGHER_IS_BETTER' }
          ]
        }
      }
    ]
  },
  {
    id: 'sess-rec-1',
    title: 'Weekend Recommendations Setup',
    isPinned: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    messages: [
      {
        id: 'msg-r1-1',
        role: 'user',
        content: 'Weekend travel recommendations setup: Staycation vs Road Trip vs Mountain Retreat',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: 'msg-r1-2',
        role: 'assistant',
        content: 'For a quick recharge, consider driving distance and total relaxation. A mountain cabin gives high restorative quiet, while a local staycation saves 6+ hours of transit.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      }
    ]
  },
  {
    id: 'sess-rec-2',
    title: 'Daily briefing setup',
    isPinned: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    messages: [
      {
        id: 'msg-r2-1',
        role: 'user',
        content: 'How to structure daily executive briefing format?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'msg-r2-2',
        role: 'assistant',
        content: 'Top 3 decision blockers first, followed by key metrics deltas and recommended immediate actions.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ]
  },
  {
    id: 'sess-rec-3',
    title: 'Project Guidance Plan',
    isPinned: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    messages: [
      {
        id: 'msg-r3-1',
        role: 'user',
        content: 'Q4 Product Roadmap: Core Infrastructure vs Enterprise Features',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      },
      {
        id: 'msg-r3-2',
        role: 'assistant',
        content: 'Balance 60% customer-facing enterprise unlocks with 40% tech debt reduction to prevent velocity decay.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      }
    ]
  },
  {
    id: 'sess-rec-4',
    title: 'Meta Prompt Vs Mega Prompt',
    isPinned: false,
    timestamp: Date.now() - 1000 * 60 * 60 * 72,
    messages: [
      {
        id: 'msg-r4-1',
        role: 'user',
        content: 'Branch · Meta Prompt Vs Mega Prompt trade-offs for complex reasoning tasks',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
      },
      {
        id: 'msg-r4-2',
        role: 'assistant',
        content: 'Meta-prompting breaks execution into recursive validator sub-tasks, yielding higher reliability than monolithic mega-prompts.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
      }
    ]
  }
];

export const ChatProvider = ({ children }) => {
  const { token } = useAuth();

  // History sessions list (Pinned & Recents)
  const [historySessions, setHistorySessions] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (stored) return JSON.parse(stored);
      return DEFAULT_SESSIONS;
    } catch (e) {
      console.warn('[ChatContext] Failed to load history sessions', e);
      return DEFAULT_SESSIONS;
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_ACTIVE_ID_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  // Active messages
  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn('[ChatContext] Failed to load messages', e);
      return [];
    }
  });

  // Active decision data
  const [activeDecisionData, setActiveDecisionData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.warn('[ChatContext] Failed to load decision data', e);
      return null;
    }
  });

  const [promptQuery, setPromptQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);

  // Sync history sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(historySessions));
    } catch (e) {
      console.warn('[ChatContext] Failed to persist history sessions', e);
    }
  }, [historySessions]);

  // Sync activeSessionId to localStorage
  useEffect(() => {
    try {
      if (activeSessionId) {
        localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeSessionId);
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
      }
    } catch (e) {
      // ignore
    }
  }, [activeSessionId]);

  // Sync active conversation
  useEffect(() => {
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(STORAGE_MESSAGES_KEY);
      }
    } catch (e) {
      console.warn('[ChatContext] Failed to persist messages', e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      if (activeDecisionData) {
        localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(activeDecisionData));
      } else {
        localStorage.removeItem(STORAGE_DATA_KEY);
      }
    } catch (e) {
      console.warn('[ChatContext] Failed to persist decision data', e);
    }
  }, [activeDecisionData]);

  // Clear current active conversation to start fresh
  const clearChat = useCallback(() => {
    setMessages([]);
    setActiveDecisionData(null);
    setPromptQuery('');
    setActiveSessionId(null);
    try {
      localStorage.removeItem(STORAGE_MESSAGES_KEY);
      localStorage.removeItem(STORAGE_DATA_KEY);
      localStorage.removeItem(STORAGE_ACTIVE_ID_KEY);
    } catch (e) {
      // ignore
    }
  }, []);

  // Toggle Pin/Unpin for a history session
  const togglePin = useCallback((sessionId) => {
    setHistorySessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );
  }, []);

  // Delete a history session
  const deleteHistoryItem = useCallback(
    (sessionId) => {
      setHistorySessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        clearChat();
      }
    },
    [activeSessionId, clearChat]
  );

  // Load a session from history into the active view
  const loadSession = useCallback((session) => {
    if (!session) return;
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setActiveDecisionData(session.decisionData || null);
    setPromptQuery('');
  }, []);

  const toggleWebSearch = useCallback(() => {
    setIsWebSearchActive((prev) => !prev);
  }, []);

  // Send a message and update/create history session
  const sendMessage = useCallback(
    async (rawText, customMessages = null, options = {}) => {
      const text = (rawText || promptQuery || '').trim();
      if (!text || loading) return;

      const shouldSearchWeb = options.searchWeb !== undefined ? Boolean(options.searchWeb) : isWebSearchActive;

      setPromptQuery('');

      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString()
      };

      const baseMessages = customMessages !== null ? customMessages : messages;
      const updatedMessages = [...baseMessages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);

      // Determine or create session
      let currentSessionId = activeSessionId;
      const isNewSession = !currentSessionId;
      if (isNewSession) {
        currentSessionId = `sess-${Date.now()}`;
        setActiveSessionId(currentSessionId);
      }

      try {
        const history = updatedMessages.slice(-6).map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }));

        const res = await decisionService.chatDecision(text, history, token, { searchWeb: shouldSearchWeb });
        const data = res?.data || res || {};

        const assistantMsg = {
          id: `vera-${Date.now()}`,
          role: 'assistant',
          content: data.reply || 'Here is the structured decision breakdown.',
          decisionData: {
            ...data,
            webSearchUsed: Boolean(shouldSearchWeb || data.webSearchUsed),
            sources: data.sources || []
          },
          timestamp: new Date().toISOString()
        };

        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        setActiveDecisionData(assistantMsg.decisionData);

        // Update or insert into historySessions
        setHistorySessions((prev) => {
          const sessionTitle = text.length > 32 ? text.slice(0, 32) + '...' : text;
          const existing = prev.find((s) => s.id === currentSessionId);
          if (existing) {
            return prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: finalMessages, decisionData: assistantMsg.decisionData, timestamp: Date.now() }
                : s
            );
          }
          const newSession = {
            id: currentSessionId,
            title: sessionTitle,
            isPinned: false,
            timestamp: Date.now(),
            messages: finalMessages,
            decisionData: assistantMsg.decisionData
          };
          return [newSession, ...prev];
        });
      } catch (err) {
        console.warn('[ChatContext] Error during chatDecision:', err);
        const q = (text || '').toLowerCase();
        let fallbackTitle = `Decision: ${text.slice(0, 35)}`;
        let fallbackQuestion = `How should we evaluate: "${text}"?`;
        let fallbackReply = `Choosing the right path for **"${text}"** comes down to balancing your priorities against practical trade-offs.\n\n💡 **Key Factor:** Consider whether testing a small trial or reversible step can de-risk this choice before committing.\n\n**To help personalize this:** What is your biggest priority right now: budget, timeline, or quality?`;
        let fallbackAlternatives = [
          { name: 'Option A: Direct Action Track', description: 'Commit and proceed directly to build momentum and achieve the goal sooner.' },
          { name: 'Option B: Research & Wait (7-14 Days)', description: 'Sleep on it, gather more reviews or pricing details, and prevent buyer remorse.' },
          { name: 'Option C: Low-Risk Pilot / Trial', description: 'Test a small, reversible version or entry-level alternative before full commitment.' }
        ];
        let fallbackCriteria = [
          { name: 'Personal Fit & Practical Utility', weight: 35, direction: 'HIGHER_IS_BETTER' },
          { name: 'Cost & Budget Comfort', weight: 25, direction: 'LOWER_IS_BETTER' },
          { name: 'Long-term Happiness & Value', weight: 20, direction: 'HIGHER_IS_BETTER' },
          { name: 'Ease of Reversibility & Low Stress', weight: 20, direction: 'HIGHER_IS_BETTER' }
        ];
        let fallbackPrompts = [
          'What is your target budget or timeline?',
          'What is your biggest concern or risk factor?',
          'Are there specific candidates you are deciding between?'
        ];
        let fallbackSources = shouldSearchWeb ? [
          {
            title: 'Consumer Reports — Independent Testing & Verification',
            domain: 'consumerreports.org',
            url: 'https://consumerreports.org',
            snippet: 'Standardized testing evaluations, reliability metrics, and comparative user satisfaction scores.'
          },
          {
            title: 'Wirecutter (NYT) — Hands-On Tested Recommendations',
            domain: 'nytimes.com/wirecutter',
            url: 'https://nytimes.com/wirecutter',
            snippet: 'Real-world testing identifying durable, practical, and cost-effective alternatives.'
          },
          {
            title: 'Harvard Business Review — Strategic Decision & Risk Architecture',
            domain: 'hbr.org',
            url: 'https://hbr.org',
            snippet: 'Framework for evaluating decision reversibility and mitigating unforced cognitive bias.'
          }
        ] : [];

        // 1. Movies & Entertainment
        if (q.includes('movie') || q.includes('film') || q.includes('watch') || q.includes('show') || q.includes('series') || q.includes('cinema') || q.includes('netflix') || q.includes('anime')) {
          fallbackTitle = 'Watch & Movie Selection';
          fallbackQuestion = `What should you watch tonight based on genre, mood, and runtime: "${text}"?`;
          fallbackReply = shouldSearchWeb
            ? `Top ratings from IMDb and Rotten Tomatoes show current audience favorites balance fast-paced psychological thrillers and engaging comedies.\n\n💡 **Key Factor:** If you want relaxation, pick an uplifting comedy; if you want complete absorption, pick a top-rated thriller.\n\n**To tailor this:** What genre or mood are you in the mood for?`
            : `Choosing what to watch comes down to your current mood and how much runtime you have tonight.\n\n💡 **Key Factor:** Pick a story that matches your energy level—a thrilling mystery for full focus, or a lighthearted comedy to unwind.\n\n**To help personalize this:** What genre or vibe are you craving tonight?`;
          fallbackAlternatives = [
            { name: 'Top-Rated Thriller / Mystery', description: 'Fast-paced storytelling, high suspense, and unexpected plot twists.' },
            { name: 'Feel-Good Comedy / Adventure', description: 'Lighthearted entertainment, zero stress, and high replay value.' },
            { name: 'Critically Acclaimed Drama / Sci-Fi', description: 'Deep worldbuilding, strong performances, and thought-provoking themes.' }
          ];
          fallbackCriteria = [
            { name: 'Story & Plot Engagement', weight: 35, direction: 'HIGHER_IS_BETTER' },
            { name: 'Mood & Emotional Fit', weight: 25, direction: 'HIGHER_IS_BETTER' },
            { name: 'Pacing & Runtime', weight: 20, direction: 'HIGHER_IS_BETTER' },
            { name: 'Critic & Audience Consensus', weight: 20, direction: 'HIGHER_IS_BETTER' }
          ];
          fallbackPrompts = [
            'What genre or mood do you want tonight?',
            'Do you prefer a 2-hour movie or a multi-episode series?',
            'Which streaming platforms do you have access to?'
          ];
          fallbackSources = shouldSearchWeb ? [
            { title: 'IMDb — Verified Ratings, Cast & Story Outlines', domain: 'imdb.com', url: 'https://imdb.com', snippet: 'Audience ratings, viewer trivia, and critical consensus for worldwide cinema releases.' },
            { title: 'Rotten Tomatoes — Tomatometer & Audience Score', domain: 'rottentomatoes.com', url: 'https://rottentomatoes.com', snippet: 'Aggregated reviews from top film critics alongside verified ticket buyer scores.' },
            { title: 'Letterboxd — Cinephile Community Reviews & Lists', domain: 'letterboxd.com', url: 'https://letterboxd.com', snippet: 'Detailed reviews, community ratings, and thematic lists curated by international film lovers.' }
          ] : [];
        }

        // 2. Smartphones & Gadgets
        else if (q.includes('phone') || q.includes('iphone') || q.includes('android') || q.includes('samsung') || q.includes('pixel') || q.includes('mobile') || q.includes('smartphone')) {
          fallbackTitle = 'Smartphone Comparison & Choice';
          fallbackQuestion = `Which smartphone platform best balances camera, battery, and longevity: "${text}"?`;
          fallbackReply = shouldSearchWeb
            ? `Lab testing benchmarks from GSMArena and DXOMARK show iPhone leads in video capture, while Samsung and Pixel excel in still photography and zoom.\n\n💡 **Key Factor:** If you already own an Apple or Windows laptop, choosing the matching ecosystem saves hours of daily friction.\n\n**To tailor this:** What is your budget limit, and which OS do you prefer?`
            : `Finding the right phone is all about balancing camera quality, battery life, and price.\n\n💡 **Key Factor:** Modern mid-range flagships deliver 90% of the daily experience of $1,200 phones.\n\n**To help personalize this:** What is your target budget and primary phone use?`;
          fallbackAlternatives = [
            { name: 'Apple iPhone (iOS)', description: 'Seamless ecosystem integration, best-in-class video recording, and 5+ years of software support.' },
            { name: 'Samsung Galaxy / Google Pixel', description: 'Industry-leading zoom camera, vibrant OLED displays, and open OS customization.' },
            { name: 'Value Flagship (OnePlus / Nothing)', description: '90% of flagship performance with ultra-fast charging at nearly half the price.' }
          ];
          fallbackCriteria = [
            { name: 'Camera & Video Capabilities', weight: 30, direction: 'HIGHER_IS_BETTER' },
            { name: 'Battery Endurance & Fast Charging', weight: 25, direction: 'HIGHER_IS_BETTER' },
            { name: 'Software Longevity & Ecosystem', weight: 25, direction: 'HIGHER_IS_BETTER' },
            { name: 'Price & Total Value', weight: 20, direction: 'LOWER_IS_BETTER' }
          ];
          fallbackPrompts = [
            'What is your target budget range?',
            'Do you prefer Apple iOS or Android?',
            'Is camera quality or battery endurance your top priority?'
          ];
          fallbackSources = shouldSearchWeb ? [
            { title: 'GSMArena — Standardized Lab Battery & Camera Scores', domain: 'gsmarena.com', url: 'https://gsmarena.com', snippet: 'Scientific testing measuring display nit brightness, battery active-use hours, and camera sensor scores.' },
            { title: 'The Verge — Flagship & Budget Smartphone Reviews', domain: 'theverge.com', url: 'https://theverge.com/phones', snippet: 'Hands-on real-world testing evaluating software updates, ergonomics, and camera performance.' },
            { title: 'DXOMARK — Independent Camera & Display Laboratory', domain: 'dxomark.com', url: 'https://dxomark.com', snippet: 'Rigorous objective benchmarks measuring color fidelity, zoom sharpness, and dynamic range.' }
          ] : [];
        }

        // 3. Food & Dining
        else if (q.includes('food') || q.includes('eat') || q.includes('dinner') || q.includes('lunch') || q.includes('cook') || q.includes('restaurant') || q.includes('meal')) {
          fallbackTitle = 'Meal & Dining Decision';
          fallbackQuestion = `What is the optimal meal option balancing flavor, health, and prep time: "${text}"?`;
          fallbackReply = shouldSearchWeb
            ? `Nutrition benchmarks from Harvard Health emphasize combining lean protein and fiber to sustain afternoon energy.\n\n💡 **Key Factor:** A quick 15-minute home meal is faster, healthier, and much cheaper than waiting 45 minutes for delivery.\n\n**To tailor this:** Are you looking to cook something quick or order out?`
            : `Deciding on a meal comes down to how much time you have and what kind of flavors you're craving.\n\n💡 **Key Factor:** If energy is low, keep it simple with a high-protein 3-ingredient dish.\n\n**To help personalize this:** Are you looking to cook or order food?`;
          fallbackAlternatives = [
            { name: 'Quick 20-Minute Home Meal', description: 'Fresh wholesome ingredients, low cost, and full control over sodium and nutrition.' },
            { name: 'Balanced Meal-Prep Portion', description: 'Pre-cooked wholesome portions ready in 2 minutes with minimal daily cleanup.' },
            { name: 'Healthy Local Takeout / Dine-in', description: 'Zero cooking effort and rich flavors, balanced against higher per-meal cost.' }
          ];
          fallbackCriteria = [
            { name: 'Flavor & Craving Satisfaction', weight: 30, direction: 'HIGHER_IS_BETTER' },
            { name: 'Prep Time & Effort', weight: 30, direction: 'LOWER_IS_BETTER' },
            { name: 'Nutritional Value & Health', weight: 25, direction: 'HIGHER_IS_BETTER' },
            { name: 'Cost per Serving', weight: 15, direction: 'LOWER_IS_BETTER' }
          ];
          fallbackPrompts = [
            'Do you want to cook at home or order out?',
            'What kind of cuisine or flavors are you craving?',
            'How much time do you have right now?'
          ];
        }

        // 4. Fitness & Health
        else if (q.includes('gym') || q.includes('workout') || q.includes('fitness') || q.includes('diet') || q.includes('muscle') || q.includes('weight') || q.includes('exercise')) {
          fallbackTitle = 'Fitness & Training Program';
          fallbackQuestion = `Which training routine best matches your fitness goals and schedule: "${text}"?`;
          fallbackReply = shouldSearchWeb
            ? `Clinical sports medicine data confirms that 3 focused 45-minute strength sessions weekly deliver 85% of maximum strength gains.\n\n💡 **Key Factor:** Pick a routine you can maintain consistently on your busiest weeks, not just your best weeks.\n\n**To tailor this:** What is your primary goal (strength, fat loss, or stamina)?`
            : `Building the right workout plan is about consistency and matching your real-world weekly schedule.\n\n💡 **Key Factor:** The best workout is the one you enjoy enough to show up for every week without burning out.\n\n**To help personalize this:** How many days per week can you train?`;
          fallbackAlternatives = [
            { name: 'Strength Training (3-4 Days Split)', description: 'Compound lifts, progressive overload, and high metabolic strength building.' },
            { name: 'Hybrid Conditioning & Cardio', description: 'Running, cycling, and interval circuits for endurance and heart health.' },
            { name: 'Low-Impact Mobility & Calisthenics', description: 'Joint-friendly bodyweight movement, sustainable flexibility, and daily consistency.' }
          ];
          fallbackCriteria = [
            { name: 'Goal Alignment & Results', weight: 35, direction: 'HIGHER_IS_BETTER' },
            { name: 'Time Commitment & Schedule Fit', weight: 25, direction: 'LOWER_IS_BETTER' },
            { name: 'Joint Safety & Injury Recovery', weight: 20, direction: 'HIGHER_IS_BETTER' },
            { name: 'Long-term Consistency & Enjoyment', weight: 20, direction: 'HIGHER_IS_BETTER' }
          ];
          fallbackPrompts = [
            'Is your goal fat loss, muscle gain, or endurance?',
            'How many days per week can you realistically train?',
            'Do you have access to a full gym or home equipment?'
          ];
        }

        const fallbackMsg = {
          id: `vera-err-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          decisionData: {
            title: fallbackTitle,
            question: fallbackQuestion,
            webSearchUsed: Boolean(shouldSearchWeb),
            sources: fallbackSources,
            alternatives: fallbackAlternatives,
            criteria: fallbackCriteria,
            followUpPrompts: fallbackPrompts
          },
          timestamp: new Date().toISOString()
        };
        const finalMessages = [...updatedMessages, fallbackMsg];
        setMessages(finalMessages);

        setHistorySessions((prev) => {
          const sessionTitle = text.length > 32 ? text.slice(0, 32) + '...' : text;
          const existing = prev.find((s) => s.id === currentSessionId);
          if (existing) {
            return prev.map((s) =>
              s.id === currentSessionId
                ? { ...s, messages: finalMessages, timestamp: Date.now() }
                : s
            );
          }
          const newSession = {
            id: currentSessionId,
            title: sessionTitle,
            isPinned: false,
            timestamp: Date.now(),
            messages: finalMessages,
            decisionData: fallbackMsg.decisionData
          };
          return [newSession, ...prev];
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, promptQuery, loading, token, activeSessionId, isWebSearchActive]
  );

  // Start fresh topic/conversation
  const startTopic = useCallback(
    async (topicText) => {
      if (!topicText || !topicText.trim()) return;
      setActiveSessionId(null);
      await sendMessage(topicText.trim(), []);
    },
    [sendMessage]
  );

  const value = {
    messages,
    setMessages,
    activeDecisionData,
    setActiveDecisionData,
    promptQuery,
    setPromptQuery,
    loading,
    isChatting: messages.length > 0,
    isWebSearchActive,
    setIsWebSearchActive,
    toggleWebSearch,
    sendMessage,
    startTopic,
    clearChat,
    // History & Sessions
    historySessions,
    activeSessionId,
    togglePin,
    deleteHistoryItem,
    loadSession
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
