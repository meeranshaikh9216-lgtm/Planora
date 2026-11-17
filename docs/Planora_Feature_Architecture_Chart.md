# PLANORA — Full Feature Architecture & System Map

> **Tagline:** *Plan. Learn. Revise. Improve.*  
> **Platform:** Modern AI-Powered Study Planner & Adaptive Learning Coach  
> **Stack:** React 18, Vite, Three.js, Chart.js, Lucide Icons, Python Flask REST API, MySQL / SQLite (WAL), Google Gemini AI

---

## 1. High-Level Architectural Flow

```mermaid
flowchart TD
    subgraph Frontend["React 18 SPA (Port 3000)"]
        UI["Modern Glassmorphic Dark UI"]
        Router["React Router v6"]
        Visual3D["Three.js Knowledge Universe"]
        Charts["Chart.js Analytics Engine"]
    end

    subgraph Backend["Python Flask REST API (Port 5000)"]
        Auth["JWT Auth & Security"]
        PlannerEngine["Dynamic Study Scheduler"]
        GapEngine["Knowledge Gap Detector"]
        SpacedEngine["Spaced Repetition Engine"]
        AIService["AI Provider Layer"]
    end

    subgraph Data["Database Layer"]
        DB[("MySQL / SQLite WAL (26 Tables)")]
    end

    subgraph AI["Artificial Intelligence"]
        Gemini["Google Gemini 3.1 Flash Lite API"]
        Vision["Multimodal Vision & OCR"]
    end

    UI --> Router
    Router --> Backend
    Backend --> DB
    AIService --> Gemini
    AIService --> Vision
```

---

## 2. The 4 Core Pillars: Feature Matrix

Planora is structured around four interconnected learning phases:

```mermaid
flowchart LR
    A["1. PLAN<br/>(Schedule & Roadmap)"] --> B["2. LEARN<br/>(Master & Synthesize)"]
    B --> C["3. REVISE<br/>(Retain & Test)"]
    C --> D["4. IMPROVE<br/>(Analyze & Elevate)"]
    D --> A
```

---

### Pillar 1: PLAN (Smart Scheduling & Roadmaps)

| Feature Module | Screen Route | Capabilities & What It Does |
| :--- | :--- | :--- |
| **Smart Study Planner** | `/planner` | Generates adaptive multi-week study timetables taking into account target exam dates, daily available hours, topic difficulty ratings, and prerequisite order. |
| **Daily Calendar & Session Queue** | `/planner`, `/dashboard` | Organizes study blocks into morning, afternoon, evening, and night slots with progress checkboxes and reschedule controls. |
| **Prerequisite Learning Graph** | `/universe` | Visual dependency network ensuring foundation topics (e.g., *Limits*) are studied before advanced dependents (e.g., *Integration*). |
| **Student Onboarding Wizard** | `/onboarding` | Calibrates student baseline: Grade level, academic board, study stream (PCM/PCB/Commerce), target score %, and daily commitment. |

---

### Pillar 2: LEARN (AI Conceptual Mastery)

```mermaid
flowchart TD
    Topic["Topic Selection"] --> SH["Study Hub (/study-hub/:topicId)"]
    SH --> M1["Explain Concept<br/>(Standard / Simplified / Step-by-Step / Teach Me Back)"]
    SH --> M2["Explain Visually<br/>(Mental Model Analogy + 4-Stage Pipeline + ASCII Blueprint)"]
    SH --> M3["AI Tutor Chat<br/>(Context-Aware Multi-turn Conversation)"]
    SH --> M4["Multimodal Doubt Solver<br/>(Text + Photo OCR Step-by-Step Derivations)"]
    SH --> M5["PDF Teacher<br/>(Document Extraction & Syllabus Notes)"]
```

| Feature Module | Screen Route | Capabilities & What It Does |
| :--- | :--- | :--- |
| **Study Hub** | `/study-hub/:id` | Central command cockpit for any topic containing all learning modes, formulas, mistakes, notes, and video masterclasses in one tabbed view. |
| **Multi-Style Concept Explainer** | `/study-hub` | 4 distinct Gemini AI explanation styles: **Standard** (rigorous), **Simplified** (ELIF/intuitive), **Step-by-Step** (derivation), and **Teach Me Back** (Feynman method). |
| **AI Visual Concept Designer** | `/study-hub` | Generates real-world mental model analogies, 4-stage mathematical transformation stages with formula badges, ASCII flowcharts, and governing equations. |
| **24/7 AI Personal Tutor** | `/ai-tutor` | Chat interface with contextual memory across subjects. Retains conversation history and provides structured markdown responses with clean math formatting. |
| **Multimodal Doubt Solver** | `/doubt-solver` | Resolves complex homework doubts via question text or image uploads (OCR diagram reading) with step-by-step breakdown, key concepts, and common trap warnings. |
| **Interactive 3D Knowledge Universe** | `/universe` | 3D visual starfield map using Three.js displaying subject solar systems and topic nodes colored dynamically by mastery level (green = mastered, amber = learning, gray = not started). |
| **PDF Teacher & Document Reader** | `/pdf-teacher` | Upload textbooks, lecture slides, or exam notes (PDF/images) to automatically extract core concepts, definitions, and auto-generate summary notes. |

---

### Pillar 3: REVISE (Active Recall & Spaced Repetition)

```mermaid
flowchart TD
    Recall["Active Recall Cycle"] --> FC["Active Recall Flashcards<br/>Leitner 3-Tier Mastery Box"]
    Recall --> SR["Smart Spaced Revision<br/>Ebbinghaus Forgetting Curve (1d, 3d, 7d, 14d, 30d)"]
    Recall --> QZ["Adaptive Diagnostic Quizzes<br/>Instant Scoring + Answer Explanations"]
```

| Feature Module | Screen Route | Capabilities & What It Does |
| :--- | :--- | :--- |
| **Active Recall Flashcards** | `/flashcards`, `/study-hub` | 3D flip cards with question on front and answer on back. Includes a **+ Generate 5 AI Flashcards** button to synthesize topic-specific revision decks on demand. |
| **Spaced Repetition Engine** | `/revisions` | Automatic scheduling based on the Ebbinghaus forgetting curve with predefined review intervals (Day 1, Day 3, Day 7, Day 14, Day 30). |
| **Adaptive Diagnostic Quizzes** | `/quizzes` | Generates multiple-choice question sets with difficulty grading, instant score calculation, percentage evaluation, and comprehensive explanations. |
| **Mistake Auto-Capture** | `/quizzes`, `/mistakes` | Any question answered incorrectly during a quiz is automatically sent to the Mistake Bank with student choice and correct answer recorded. |

---

### Pillar 4: IMPROVE (Analytics & Error Eradication)

| Feature Module | Screen Route | Capabilities & What It Does |
| :--- | :--- | :--- |
| **Mistake Bank (Error Notebook)** | `/mistakes` | Central repository of all student mistakes. Categorized by root cause: **Calculation Error**, **Conceptual Gap**, or **Question Misread**, with resolution tracking. |
| **Knowledge Gap Detector** | `/analytics` | Algorithmic audit identifying weak topics with low quiz scores or repeated mistakes, flagging them for prioritized revision. |
| **Progress & Performance Analytics** | `/analytics` | Chart.js interactive graphs: Daily study hours distribution, subject completion %, topic confidence heatmaps, and exam readiness scores. |
| **Deep Focus Mode (Pomodoro)** | `/focus` | Built-in study timer (25m / 45m / 60m focus blocks) with ambient background audio, streak counter, full-screen distraction shielding, and study log recording. |
| **Gamification, Streaks & XP** | Everywhere | Experience points (XP) awarded for completing sessions, quizzes, and revisions. Dynamic streak counter and unlockable achievement badges. |

---

## 3. End-to-End User Experience Map

```mermaid
flowchart TD
    Start(["Student Logs In"]) --> Dash["Dashboard (/dashboard)"]
    Dash --> Check1{"What is the goal?"}

    Check1 -->|"Follow Schedule"| Plan["Check Today's Schedule<br/>(/planner)"]
    Check1 -->|"Study a Topic"| Hub["Open Study Hub<br/>(/study-hub/:id)"]
    Check1 -->|"Solve a Homework Problem"| Doubt["AI Doubt Solver<br/>(/doubt-solver)"]
    Check1 -->|"Scheduled Review"| Rev["Smart Revision<br/>(/revisions)"]
    Check1 -->|"Deep Work"| Focus["Focus Mode Timer<br/>(/focus)"]

    Hub --> StudyAct{"Choose Study Tool"}
    StudyAct -->|"Visual Intuition"| Vis["Explain Visually"]
    StudyAct -->|"Active Recall"| Flash["AI Flashcards"]
    StudyAct -->|"Concept Mastery"| Exp["AI Concept Breakdown"]
    StudyAct -->|"Practice"| QuizM["Take Topic Quiz"]

    QuizM --> Eval["Auto-Grade Attempt"]
    Eval -->|"Incorrect Answers"| MB["Logged into Mistake Bank"]
    Eval -->|"Update Metrics"| Analytics["Progress Analytics & XP Boost"]
```

---

## 4. Technical Feature Summary Table

| Category | Count | Key Technologies & Implementations |
| :--- | :---: | :--- |
| **Total Web Screens** | **16** | React Router v6, Tailwind/CSS3 Glassmorphic Theme |
| **Database Tables** | **26** | MySQL 8.0 & SQLite WAL mode (`planora.db`) |
| **AI Capabilities** | **7** | Concept Explainer, Visual Blueprint, Flashcard Generator, Quiz Engine, Multimodal Doubt Solver, Tutor Chat, PDF Teacher |
| **Visual Engagements** | **4** | Three.js Knowledge Universe, Chart.js Analytics, 3D Flip Cards, ASCII Blueprints |
| **Memory Systems** | **3** | Leitner Flashcard Boxes, Spaced Repetition Intervals, Persistent Mistake Bank |
