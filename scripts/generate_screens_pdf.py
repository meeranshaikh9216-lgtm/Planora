import os
import html
import subprocess
import shutil

BASE_DIR = r"C:\Users\waris\Desktop\Planora"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
OUTPUT_HTML = os.path.join(BASE_DIR, "temp_screens_only.html")
OUTPUT_PDF = os.path.join(BASE_DIR, "Planora_Frontend_Screens_Only.pdf")

# ONLY FRONTEND UI SCREENS & LAYOUTS - NO NETWORK, NO BACKEND, NO CONNECTION CODE
SCREENS = [
    ("Login Page", "src/pages/Login.jsx", "Student & Administrator authentication entry screen with role selector"),
    ("Signup Page", "src/pages/Signup.jsx", "Student self-registration and account creation interface"),
    ("Onboarding Page", "src/pages/Onboarding.jsx", "Student academic onboarding wizard (class, stream, board, study targets)"),
    ("Dashboard Page", "src/pages/Dashboard.jsx", "Main student dashboard overview with daily sessions, XP, streak, and quick links"),
    ("Planner Page", "src/pages/Planner.jsx", "AI study schedule planner, calendar timeline, and subject breakdown"),
    ("3D Knowledge Universe Page", "src/pages/KnowledgeUniverse.jsx", "Interactive 3D topic connectivity graph and concept universe"),
    ("Universal Practical Lab Page", "src/pages/UniversalPracticalLab.jsx", "Virtual lab experiments, simulation procedures, and AI viva voce"),
    ("Assignments Page", "src/pages/Assignments.jsx", "Academic assignments tracker with deadlines and urgency status"),
    ("Study Hub Page", "src/pages/StudyHub.jsx", "Subject notes, core concepts, formula cards, and AI summaries"),
    ("AI Tutor Page", "src/pages/AITutor.jsx", "Socratic conversational AI tutor for interactive topic explanations"),
    ("AI Doubt Solver Page", "src/pages/AIDoubtSolver.jsx", "Academic problem solver with step-by-step mathematical reasoning"),
    ("Adaptive Quiz Page", "src/pages/Quiz.jsx", "Dynamic test screen with countdown timers and answer selection"),
    ("Quiz Results Page", "src/pages/QuizResult.jsx", "Score summary, accuracy charts, and detailed question-by-question review"),
    ("Smart Revision Page", "src/pages/SmartRevision.jsx", "Spaced repetition revision tracker based on Ebbinghaus memory curve"),
    ("Mistake Bank Page", "src/pages/MistakeBank.jsx", "Repository of incorrect quiz answers with AI diagnostic explanations"),
    ("Flashcards Page", "src/pages/Flashcards.jsx", "Interactive 3D flip card study decks with Leitner box repetition"),
    ("Progress Analytics Page", "src/pages/ProgressAnalytics.jsx", "Visual charts of student study velocity and subject mastery"),
    ("Focus Mode Page", "src/pages/FocusMode.jsx", "Full-screen Pomodoro focus room with ambient audio and pause monitors"),
    ("PDF Teacher Page", "src/pages/PDFTeacher.jsx", "Document-grounded AI learning assistant for uploaded PDF textbooks"),
    ("Profile Page", "src/pages/Profile.jsx", "Student academic profile, stream configuration, and target goals"),
    ("Settings Page", "src/pages/Settings.jsx", "Theme preferences, alarm volume, and account security controls"),
    ("Smart Alarms Page", "src/pages/AlarmDashboard.jsx", "Session reminder alarms list, chime selector, and test triggers"),
    ("Database Explorer Page", "src/pages/DatabaseExplorer.jsx", "In-app relational database browser for live schema and records"),
    ("Admin Overview Page", "src/pages/admin/AdminOverview.jsx", "Executive admin dashboard with aggregate telemetry, cohorts, and CSV export"),
    ("Admin Student Records Page", "src/pages/admin/StudentRecords.jsx", "Searchable and filterable directory of all registered students"),
    ("Admin Student Detail Modal", "src/pages/admin/StudentDetail.jsx", "Granular student record inspector with session, quiz, and mistake logs"),
    ("Admin AI Study Plans Page", "src/pages/admin/AdminPlans.jsx", "Central portfolio of all AI study plans with completion progress bars"),
    ("Admin Study Sessions Ledger", "src/pages/admin/AdminSessions.jsx", "Complete institutional ledger of all scheduled, completed, and missed sessions"),
    ("Admin System Health Page", "src/pages/admin/AdminSystem.jsx", "Background alarm queue monitor, test alarm trigger, and database health"),
    ("Student Main Layout Shell", "src/layouts/MainLayout.jsx", "Main student application layout shell integrating Sidebar and Navbar"),
    ("Admin Console Layout Shell", "src/layouts/AdminLayout.jsx", "Institutional Admin Console shell with sidebar navigation"),
    ("Top Navigation Bar", "src/components/Navbar.jsx", "Header navigation bar with notifications and profile dropdown"),
    ("Sidebar Navigation Bar", "src/components/Sidebar.jsx", "Left sidebar navigation menu with links to all student modules")
]

def build_pdf():
    toc_html = []
    files_html = []
    total_lines = 0

    for idx, (title, rel_path, desc) in enumerate(SCREENS, 1):
        full_path = os.path.join(FRONTEND_DIR, rel_path.replace("/", os.sep))
        if not os.path.exists(full_path):
            print("MISSING:", full_path)
            continue
        
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        lines = content.split("\n")
        line_count = len(lines)
        total_lines += line_count
        
        anchor = f"screen-{idx}"
        toc_html.append(f"""
        <tr>
            <td style="padding: 8px 12px; font-weight: 700; color: #ef4444; width: 40px;">#{idx}</td>
            <td style="padding: 8px 12px; font-weight: 700;"><a href="#{anchor}" style="color: #0284c7; text-decoration: none;">{title}</a></td>
            <td style="padding: 8px 12px; font-family: monospace; font-size: 8.5pt; color: #475569;">{rel_path}</td>
            <td style="padding: 8px 12px; text-align: right; color: #64748b; font-size: 8.5pt;">{line_count:,} lines</td>
        </tr>
        """)
        
        code_block = html.escape(content)
        
        files_html.append(f"""
        <div id="{anchor}" style="page-break-before: always; margin-bottom: 30px;">
            <div style="background: #0f172a; color: #ffffff; padding: 14px 18px; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span style="background: #ef4444; color: #ffffff; font-size: 7.5pt; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">SCREEN #{idx}</span>
                    <h2 style="margin: 4px 0 2px; font-size: 13pt; font-weight: 800;">{title}</h2>
                    <div style="font-family: monospace; font-size: 8.5pt; color: #94a3b8;">{rel_path} &bull; {desc}</div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.1); padding: 4px 10px; border-radius: 6px; font-size: 8pt; font-weight: 700;">
                    {line_count:,} Lines
                </div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-top: none; border-radius: 0 0 8px 8px; padding: 12px;">
                <pre style="margin: 0; font-family: Consolas, 'Courier New', monospace; font-size: 7.8pt; line-height: 1.45; color: #0f172a; white-space: pre-wrap; word-break: break-all;">{code_block}</pre>
            </div>
        </div>
        """)

    doc = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Planora — Frontend Screens & Layout Code</title>
<style>
@page {{ size: A4; margin: 12mm 10mm; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 16px; color: #0f172a; }}
</style>
</head>
<body>

<div style="min-height: 85vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; padding: 40px 20px;">
    <div style="background: #fee2e2; color: #dc2626; font-size: 9pt; font-weight: 800; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">
        UI Screens & Layouts Only &bull; Zero Backend/Network Code
    </div>
    <h1 style="font-size: 32pt; font-weight: 900; margin: 0 0 10px; color: #0f172a;">PLANORA</h1>
    <p style="font-size: 14pt; color: #475569; max-width: 600px; margin: 0 0 32px;">
        Complete Frontend UI Pages &amp; Layout Code Ledger
    </p>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 620px; width: 100%; margin-bottom: 36px;">
        <div style="background: #f1f5f9; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 22pt; font-weight: 800; color: #ef4444;">{len(SCREENS)}</div>
            <div style="font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Frontend Screens</div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 22pt; font-weight: 800; color: #0284c7;">{total_lines:,}</div>
            <div style="font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Code Lines</div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0;">
            <div style="font-size: 22pt; font-weight: 800; color: #10b981;">100%</div>
            <div style="font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Layout &amp; Pages Only</div>
        </div>
    </div>
    <div style="color: #94a3b8; font-size: 9pt;">Exclusively covers UI screens: Login, Dashboard, Planner, Practicals, Quizzes, Focus, Admin, and Layouts.</div>
</div>

<div style="page-break-after: always; padding: 20px 0;">
    <h2 style="font-size: 18pt; font-weight: 800; margin: 0 0 6px; color: #0f172a;">Index of Frontend Screens</h2>
    <p style="color: #64748b; font-size: 9.5pt; margin: 0 0 16px;">Click any screen title to jump directly to its complete source code.</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #e2e8f0;">
        <thead>
            <tr style="background: #f1f5f9; text-align: left; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 8px 12px;">#</th>
                <th style="padding: 8px 12px;">Screen Name</th>
                <th style="padding: 8px 12px;">Component File</th>
                <th style="padding: 8px 12px; text-align: right;">Lines</th>
            </tr>
        </thead>
        <tbody>
            {''.join(toc_html)}
        </tbody>
    </table>
</div>

{''.join(files_html)}

</body>
</html>
"""

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(doc)

    print("HTML built:", OUTPUT_HTML)

    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    subprocess.run([
        chrome,
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={OUTPUT_PDF}",
        "--no-pdf-header-footer",
        OUTPUT_HTML
    ], check=True)

    print("Screens PDF Generated:", OUTPUT_PDF, os.path.getsize(OUTPUT_PDF))

    # Overwrite public and desktop files so there is strictly ONE updated PDF
    public_dest = r"C:\Users\waris\Desktop\Planora\frontend\public\Planora_Frontend_Code.pdf"
    desktop_dest = r"C:\Users\waris\Desktop\Planora_Frontend_Code.pdf"
    desktop_screens_dest = r"C:\Users\waris\Desktop\Planora_Frontend_Screens_Only.pdf"
    artifact_dest = r"C:\Users\waris\.gemini\antigravity\brain\defc03ff-524b-45d8-8b4a-6e9e9c3b99e0\Planora_Frontend_Code.pdf"

    for d in [public_dest, desktop_dest, desktop_screens_dest, artifact_dest]:
        shutil.copyfile(OUTPUT_PDF, d)
        print("Copied to:", d)

    if os.path.exists(OUTPUT_HTML):
        os.remove(OUTPUT_HTML)

    # Launch directly in Chrome browser tab
    subprocess.Popen([chrome, "http://localhost:3000/Planora_Frontend_Code.pdf"])
    print("Launched in Chrome tab: http://localhost:3000/Planora_Frontend_Code.pdf")

if __name__ == "__main__":
    build_pdf()
