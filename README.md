# PLANORA — Full-Stack AI Study Coach & Learning Assistant

> **Plan. Learn. Revise. Improve.**

Planora is a modern, full-stack, AI-powered study planner and learning assistant application. It answers five critical questions for every student:
1. **What should I study?** $\to$ AI Planner & Topological Prerequisites
2. **How should I study it?** $\to$ AI Study Hub, Visual Explanations, and Notes
3. **Did I understand it?** $\to$ AI Quizzes with Python scoring & Active Recall
4. **What do I need to improve?** $\to$ Empirical Knowledge Gap Detector & Mistake Bank
5. **When should I study it again?** $\to$ Automated Spaced Repetition (1d, 3d, 7d, 15d, 30d)

---

## 1. What Was Built

### Frontend (React 18 + Vite + Three.js)
* **Design System:** Deep navy glassmorphic theme with customizable Light Mode, responsive desktop sidebar, and mobile bottom bar navigation.
* **3D AI Core:** Interactive Three.js particle core with glowing orbital rings, floating sine-wave dynamics, and quick-action triggers.
* **Study Hub:** Central topic learning screen with tabs for Explanations (standard, simplified, step-by-step, teach-me-back), Notes, Visual Explanations, Flashcards, Mistakes, Videos, and Live Tutor.
* **AI Doubt Solver & Camera Teacher:** Problem solving from text questions or uploaded images/photos.
* **Active Recall Flashcards:** 3D card-flip animations with mastery tracking (`Known`, `Need Revision`, `Difficult`).
* **Progress Analytics:** Interactive Chart.js charts for weekly study hours and quiz accuracy, plus Exam Readiness score breakdown.
* **Focus Mode:** Distraction-free Pomodoro/deep-work study timer with session completion logging and XP rewards.
* **PDF Teacher:** Upload study PDFs, extract text, and auto-generate summaries, notes, or flashcards.
* **Gamification:** XP, study streaks, and unlockable achievement badges.

### Backend (Python Flask REST API + SQLAlchemy)
* **Authentication:** Secure bcrypt password hashing and JWT access tokens.
* **Deterministic Study Planner Engine:** Pure Python calendar and slot-allocation algorithms combined with topological sorting for prerequisite sequencing.
* **Dynamic Recovery:** Detects missed study sessions and offers automated rescheduling or study-now recovery.
* **Knowledge Gap Detector:** Mathematical risk scoring grounded strictly in quiz accuracy, mistake recurrence, and revision adherence.
* **Smart Spaced Repetition:** Automated Ebbinghaus forgetting curve intervals with adaptive remediation for low scores.
* **Mistake Bank:** Catalogs quiz errors with recurrence counts and supports **"Quiz from Mistakes"** generation.
* **AI Abstraction Layer:** Supports **Google Gemini API** (`gemini-2.5-flash`), **OpenAI API** (`gpt-4o-mini`), and an **Intelligent Offline Academic Fallback** so the app remains fully functional and testable without live API keys.

### Database (MySQL 8.0+)
* 26 normalized relational tables with foreign keys, indexes, timestamps, and cascade behaviors.
* Dedicated schema file (`database/schema.sql`) and sample seed file (`database/seed.sql`).
* Built-in support for SQLite local fallback for instant zero-config evaluation.

---

## 2. Directory Structure

```text
Planora/
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/      # Sidebar, Navbar, MobileNav, AICoreModal, Toast, Skeletons
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── layouts/         # MainLayout shell
│   │   ├── pages/           # Dashboard, Planner, StudyHub, AITutor, Quiz, Analytics, etc.
│   │   ├── routes/          # ProtectedRoute
│   │   ├── services/        # api.js REST client
│   │   ├── three/           # AICoreCanvas.jsx Three.js Core
│   │   ├── App.jsx          # React Router v6 setup
│   │   ├── index.css        # Design tokens & styles
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── ai/              # Gemini, OpenAI & Fallback AI providers
│   │   ├── auth/            # Bcrypt hashing & JWT verification
│   │   ├── models/          # SQLAlchemy relational models
│   │   ├── routes/          # Flask REST API Blueprints
│   │   ├── services/        # Planner, Gap Detector, Revision, Progress, Gamification
│   │   ├── utils/           # Response helpers & PDF extractor
│   │   ├── config.py        # Environment loader
│   │   ├── extensions.py    # db, migrate, cors
│   │   └── __init__.py      # App factory & error handlers
│   ├── tests/
│   │   └── test_api.py      # Automated Pytest suite
│   ├── run.py               # Backend entrypoint
│   ├── seed_data.py         # Seed demo student & syllabus data
│   ├── requirements.txt
│   └── .env.example
│
├── database/
│   ├── schema.sql           # MySQL DDL Schema
│   └── seed.sql             # SQL Seed script
│
├── .vscode/             # Pre-configured launch.json, tasks.json & settings.json
├── docs/
│   └── ARCHITECTURE.md
├── seed_database.bat    # Double-click to re-seed curriculum database
├── start_planora.bat    # Double-click to launch Backend + Frontend together
├── verify_stack.py      # E2E health & auth verification script
└── README.md
```

---

## 3. How to Open and Run in VS Code (Visual Studio Code)

The entire application code is packaged into **one clean folder** ready to open directly in VS Code:
* **Desktop Location:** `C:\Users\waris\Desktop\Planora`
* **Internal Workspace:** `C:\Users\waris\.gemini\antigravity\scratch\Planora`

### Step 1: Open Folder in VS Code
1. Open **Visual Studio Code**.
2. Click **File** $\to$ **Open Folder...** (or press `Ctrl + K`, `Ctrl + O`).
3. Select the **`Desktop\Planora`** folder and click **Select Folder**.

### Step 2: Run the App (Choose Any of These 3 Easy Ways)

#### 🚀 Method A: One-Click VS Code Build Task (Recommended)
1. Press `Ctrl + Shift + B` (or go to menu **Terminal** $\to$ **Run Build Task...**).
2. Select **`1. Start Full Application (Backend + Frontend)`**.
3. Both Flask (Port 5000) and Vite (Port 3000) will launch automatically!

#### 🚀 Method B: Double-Click Launcher
* In VS Code or Windows File Explorer, open `start_planora.bat`.
* It opens two terminal windows running the Flask API and the React frontend simultaneously.

#### 🚀 Method C: Manual Terminals in VS Code
Open two integrated terminals in VS Code (`Ctrl + \`` or **Terminal** $\to$ **New Terminal**):

* **Terminal 1 (Backend):**
  ```powershell
  cd backend
  python run.py
  ```
  *(Starts Flask server at `http://127.0.0.1:5000`)*

* **Terminal 2 (Frontend):**
  ```powershell
  cd frontend
  npm run dev
  ```
  *(Starts Vite server at `http://localhost:3000`)*

### Step 3: Open in Browser
* Navigate to **[http://localhost:3000](http://localhost:3000)**
* **Demo Student Email:** `demo@planora.ai`
* **Password:** `password123`

---

## 4. How to Install Prerequisites (If running on a brand-new computer)

### Prerequisites
* **Python 3.10+** (Already installed on your system)
* **Node.js 18+ & npm** (Installed at `C:\Users\waris\AppData\Local\Programs\nodejs` and configured in PATH)
* **Database:** SQLite (`backend/instance/planora.db`) is pre-seeded and active by default. MySQL 8.0+ is optionally supported.

---

## 4. How to Configure MySQL

1. Log into your MySQL server via command line or MySQL Workbench:
   ```bash
   mysql -u root -p
   ```
2. Execute the schema:
   ```sql
   SOURCE C:/Users/waris/.gemini/antigravity/scratch/Planora/database/schema.sql;
   ```
3. (Optional) Run the seed script:
   ```sql
   SOURCE C:/Users/waris/.gemini/antigravity/scratch/Planora/database/seed.sql;
   ```

---

## 5. How to Configure AI API & Environment

In `backend/`, copy `.env.example` to `.env`:

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:
```ini
FLASK_ENV=development
PORT=5000

# Database URL
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/planora
# If MySQL is not running, uncomment the SQLite line for instant zero-config testing:
# DATABASE_URL=sqlite:///planora.db

# JWT Secret
JWT_SECRET_KEY=planora_super_secret_jwt_key_2025

# AI Provider ('gemini' or 'openai')
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

> **Note:** If no API key is set, Planora automatically activates its **Academic Fallback Engine**, providing rich calculus, physics, and chemistry explanations, notes, quizzes, and doubt solutions so you can test all features right away.

---

## 6. How to Start the Backend

1. Navigate to the backend directory and set up a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Seed the database with demo user and syllabus data:
   ```bash
   python seed_data.py
   ```
4. Run the backend server:
   ```bash
   python run.py
   ```
   * The API server will start on: **`http://127.0.0.1:5000`**
   * Health Check: **`http://127.0.0.1:5000/api/health`**

---

## 7. How to Start the Frontend

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```text
   http://localhost:3000
   ```

---

## 8. Test Credentials & Demo Data

The seed script creates a test student account:

* **Email:** `demo@planora.ai`
* **Password:** `password123`
* *(A one-click "Fill Demo Student" button is also provided on the Login screen!)*

### Seeded Demonstration Features:
* **Academic Profile:** Grade 12 CBSE Science (PCM).
* **Subjects & Topics:** Mathematics (Calculus), Physics (Electromagnetism), Chemistry (Physical Chemistry) with topological prerequisites.
* **Knowledge Gap Telemetry:** `Integration` has an active high knowledge gap and entries in the **Mistake Bank**.
* **Scheduled Revisions:** Spaced revisions due today and tomorrow.
* **Planner Timetable:** Scheduled morning and evening study sessions.

---

## 9. Automated Testing

To run the backend test suite:
```bash
cd backend
pytest -v
```
Tests verify:
* User registration and JWT login
* Onboarding and automatic subject/topic seeding
* Deterministic planner schedule generation
* Study session completion and study log logging
* AI quiz generation and server-side Python scoring
* Knowledge gap calculation and progress analytics

---

## 10. Known Limitations
* **Camera Capture in Desktop Web:** Uses the standard HTML5 file upload/webcam capture dialog; mobile browsers natively trigger the system camera app.
* **YouTube Video Playback:** Uses curated search query links to official YouTube resources to respect copyright policies and avoid unauthorized video scraping.
* **Device-Level App Blocking:** Focus mode tracks focused time and alerts the student on window blur, but does not claim OS-level process blocking from a standard web browser sandbox.

---

## 11. Future Improvements
* Web Push notifications for scheduled study session alerts.
* Direct integration with YouTube Data API v3 for inline video player embedding.
* Mobile Native wrapper (React Native / Capacitor) for OS-level Do Not Disturb integration.
* Collaborative study rooms with peer active recall sessions.
