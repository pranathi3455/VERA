# VERA — Decision Intelligence

> **Verified Evidence and Research Assistant**  
> *"From scattered information to evidence-backed decisions."*

VERA is a general-purpose, AI-powered **Decision Intelligence** platform designed for high-stakes, multi-criteria decision analysis. It transforms fragmented data, conflicting evidence, and subjective uncertainty into clear, structured, and auditable outcomes.

> **Important Principle:** VERA does not replace human decision-makers. Rather, VERA augments human judgment through deterministic mathematical modeling, rigorous sensitivity testing, counter-factual challenge (Devil's Advocate), and explainable AI synthesis.

---

## Overview

Modern organizations face complex decisions where alternatives carry conflicting trade-offs, incomplete evidence, and uncertain outcomes. VERA provides a structured analytical pipeline that enables decision-makers to:

- **Structure Complex Decisions**: Define multi-criteria problems with custom weights, directions (higher vs. lower is better), and rigorous constraints.
- **Compare Alternatives Deterministically**: Evaluate competing options using normalized linear weighting algorithms that guarantee mathematical reproducibility without black-box hallucination.
- **Assess Risk & Uncertainty**: Compute variance and risk scores based on evidence confidence, credibility, and volatility.
- **Analyze Trade-offs & Sensitivity**: Identify tipping points where minimal criteria adjustments overturn the winning decision.
- **Simulate Scenarios**: Model best-case, worst-case, and stressed market conditions in real time.
- **Challenge Assumptions (Devil's Advocate)**: Automatically stress-test decisions with synthesized counter-arguments and adversarial critiques.
- **AI-Assisted Explainability**: Translate mathematical decision rankings into clear, executive-ready narratives powered by Google Gemini.

---

## Core Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js (ES Modules), Express.js
- **Database**: Supabase PostgreSQL (`@supabase/supabase-js`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`)
- **Authentication**: JWT with bcrypt hashing, Supabase Auth integration, and 2-Step Verification (2SV)
- **Email Delivery**: Nodemailer (Gmail SMTP) for 2SV security verification

---

## Architecture

VERA employs a clean client-server architecture with a clear separation of concerns:

```
┌────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                      │
│   (Vite SPA, Cinematic Intro, Dashboard, Workspaces)   │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON (JWT Authenticated)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   EXPRESS BACKEND                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │     Deterministic Decision Engine (Core Math)    │  │
│  │   • Normalization  • Scoring  • Sensitivity      │  │
│  │   • Trade-offs     • Scenarios • Audit Logs      │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             │                          │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Gemini AI Interpretation Service         │  │
│  │   • Explains deterministic math (never ranks)    │  │
│  │   • Strict structured JSON schema validation     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│    SUPABASE POSTGRESQL    │ │    GOOGLE GEMINI API     │
│   (Persistent Storage)    │ │   (Qualitative Synthesis)│
└───────────────────────────┘ └──────────────────────────┘
```

1. **Client-Side Presentation**: React frontend communicates exclusively through REST endpoints (`/api/*`). No database keys or AI credentials touch the client.
2. **Deterministic Processing**: The backend decision engine calculates rankings, weights, and sensitivity scores entirely with deterministic mathematics. Gemini AI **never** computes rankings.
3. **AI Interpretation**: Once mathematics are finalized, Gemini analyzes the verified outcome to produce human-readable narratives, key factors, and counter-perspectives.
4. **Data Persistence**: All decisions, criteria, alternatives, and audit logs persist in Supabase PostgreSQL tables defined in `database/schema.sql`.

---

## Project Structure

```
VERA/
├── .env.example              # Template environment variables (root)
├── .gitignore                # Production Git ignore rules
├── README.md                 # System documentation & setup guide
├── database/
│   └── schema.sql            # Supabase PostgreSQL relational schema
├── backend/
│   ├── .env.example          # Backend environment template
│   ├── package.json          # Backend dependencies & scripts
│   ├── src/
│   │   ├── server.js         # Express app entry point
│   │   ├── controllers/      # Request handlers (auth, decision, evidence)
│   │   ├── middleware/       # JWT auth, error handling, validation
│   │   ├── routes/           # REST API route definitions
│   │   ├── services/
│   │   │   ├── authService.js         # User registration, login, 2SV
│   │   │   ├── decisionEngine.js      # Deterministic decision math
│   │   │   ├── geminiService.js       # AI explainability & synthesis
│   │   │   ├── mailer.js              # 2SV email dispatch
│   │   │   └── supabaseClient.js      # Supabase connection & health check
│   │   ├── utils/            # App errors, JWT tokens, response helpers
│   │   └── validators/       # Zod schemas for request validation
│   └── test-*.js             # Automated test suites for decision engine & AI
└── frontend/
    ├── .env.example          # Frontend environment template
    ├── package.json          # Frontend dependencies & build configuration
    ├── vite.config.js        # Vite build configuration
    ├── tailwind.config.js    # Tailwind styling tokens & theme
    └── src/
        ├── App.jsx           # App routing & providers
        ├── components/       # UI components (intro, decision, charts)
        ├── context/          # AuthContext & DecisionContext
        ├── pages/            # View pages (Login, Dashboard, CreateDecision, etc.)
        ├── services/         # API client & endpoint bindings
        └── utils/            # Error handling & mathematical helpers
```

---

## Setup & Installation

### 1. Clone Repository
```bash
git clone https://github.com/pranathi3455/VERA.git
cd VERA
```

### 2. Configure Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your real service credentials:
- `JWT_SECRET`: A secure random 64-character hex string.
- `SUPABASE_URL`: Your Supabase project URL (`https://xyz.supabase.co`).
- `SUPABASE_SECRET_KEY`: Your Supabase Service Role Key or Secret Key.
- `GEMINI_API_KEY`: Your Google AI Studio Gemini API key.
- `SMTP_USER` & `SMTP_PASS` *(optional)*: For real 2-Step Verification email delivery.

### 3. Initialize Supabase Database
In your Supabase project dashboard, open the **SQL Editor**, paste the contents of `database/schema.sql`, and run the script. This creates:
- `users`
- `decisions`
- `criteria`
- `alternatives`
- `evidence`
- `decision_results`
- `audit_logs`

### 4. Configure Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` in `frontend/.env` points to your backend (`http://localhost:5000` by default).

### 5. Start Application
In terminal 1 (Backend):
```bash
cd backend
npm run dev
```
*Backend runs at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` / `production` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing session tokens | `<64-char hex string>` |
| `SUPABASE_URL` | Supabase project endpoint | `https://xxxx.supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabase Service Role / Secret Key | `sb_secret_...` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIza...` |
| `SMTP_USER` *(optional)* | Gmail address for sending 2SV OTP | `you@gmail.com` |
| `SMTP_PASS` *(optional)* | 16-character Google App Password | `xxxx xxxx xxxx xxxx` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the VERA Express backend | `http://localhost:5000` |

---

## Security Best Practices

- **Zero Client-Side Secrets**: All API keys, database credentials, and SMTP passwords remain strictly in the backend environment.
- **Deterministic Immutability**: All multi-criteria math is computed server-side in memory; AI cannot manipulate calculations or rankings.
- **Safe Fallback**: If the Gemini API is unreachable, VERA automatically falls back to an offline heuristic narrative generator without throwing user-facing exceptions.
- **Session Protection**: Passwords are salted and hashed with `bcryptjs` (cost factor 12); API routes are guarded with signed JSON Web Tokens.

---

## Deployment Architecture

- **Frontend**: Deployed on **Vercel** or **Netlify** (Vite SPA production build via `npm run build`).
- **Backend**: Deployed on **Render** or **Railway** (Node.js LTS Web Service with environment secrets configured).
- **Database**: Managed **Supabase PostgreSQL** cloud instance with automated backups and Row Level Security.
- **AI Engine**: **Google Gemini REST API** (`gemini-2.5-flash`).

---

## License

This project is licensed under the MIT License — see the repository for details.
