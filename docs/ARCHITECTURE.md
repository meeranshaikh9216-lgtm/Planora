# PLANORA — ARCHITECTURE & SYSTEM DESIGN

**Plan. Learn. Revise. Improve.**

## 1. High-Level Architecture Overview

Planora operates on a modular, decoupled tier system:

```text
┌────────────────────────────────────────────────────────┐
│               REACT 18 SINGLE PAGE APP                 │
│  React Router v6 • Three.js 3D Core • Chart.js         │
│  Context (Auth, Theme) • Responsive Layouts            │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / JWT)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 PYTHON FLASK BACKEND                   │
│  Flask Blueprints • PyJWT Auth • Bcrypt Password Hash  │
│  SQLAlchemy ORM • Flask-Migrate • Validation Engine    │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│      MYSQL DATABASE      │  │     AI SERVICE LAYER     │
│  26 Relational Tables    │  │  Unified Provider Model  │
│  Foreign Keys & Indexes  │  │  Google Gemini API       │
│  Telemetry Storage       │  │  OpenAI API              │
│                          │  │  Offline Fallback Engine │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 2. Core Intelligent Subsystems

### A. Deterministic Study Planner
* **Input Parameters:** Syllabus subjects, weekly hour availability, preferred study window (morning/afternoon/evening/night), exam date.
* **Deterministic Allocation:** Python algorithms divide hours into optimal 60-90 minute blocks without schedule collisions.
* **Prerequisite Sequencing:** Enforces topical topological ordering (e.g. Limits $\to$ Differentiation $\to$ Integration).
* **Dynamic Recovery:** Automatically scans for missed study sessions and offers immediate rescheduling or distributed recovery without destroying existing schedules.

### B. Empirical Knowledge Gap Detector
* **No Arbitrary AI Hallucination:** Calculates vulnerability scores (0 to 100) strictly from user telemetry:
  * Quiz score deficit (40% weight)
  * Mistake Bank recurrence (30% weight)
  * Self-reported confidence rating (15% weight)
  * Delinquent spaced revisions (15% weight)
* Classifies topics into **HIGH**, **MEDIUM**, and **LOW** risk buckets and directs the student to remedial revision.

### C. Automated Spaced Repetition (SRS)
* Integrates the Ebbinghaus forgetting curve intervals: **+1 day, +3 days, +7 days, +15 days, +30 days**.
* Automatically provisions revision tasks whenever a student completes a study session or quiz.
* Features adaptive remediation: if a student scores $<60\%$ on a revision, a 1-day refresher is automatically scheduled.

### D. Mistake Bank
* Captures incorrect quiz responses and doubt solver inquiries.
* Tracks recurrence counts and prevents silent repetition of algebraic and conceptual traps.
* Supports **"Quiz from Mistakes"** to automatically generate remedial quizzes targeting unresolved errors.

### E. 3D AI Core (Three.js)
* Custom WebGL particle and geometric core rendered directly inside the dashboard.
* Floating sine-wave motion with orbital rings and dynamic mouse-tracking tilt.
* Triggers modal actions: Explain Topic, Solve Doubt, Generate Notes, Generate Quiz, Plan My Day, Analyze Progress.

### F. Multimodal AI Doubt Solver & PDF Teacher
* Supports text queries as well as uploaded camera/textbook photos.
* PDF extraction via `pypdf` with safe token chunking.
* Generates step-by-step proofs, common pitfalls, and similar practice variants.
