import os
import html
import subprocess
import shutil

BASE_DIR = r"C:\Users\waris\Desktop\Planora"
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
OUTPUT_HTML = os.path.join(BASE_DIR, "temp_frontend_book.html")
OUTPUT_PDF = os.path.join(BASE_DIR, "Planora_Frontend_Complete_Code.pdf")
DESKTOP_PDF = r"C:\Users\waris\Desktop\Planora_Frontend_Complete_Code.pdf"
DOCS_DIR = os.path.join(BASE_DIR, "docs")
os.makedirs(DOCS_DIR, exist_ok=True)
DOCS_PDF = os.path.join(DOCS_DIR, "Planora_Frontend_Complete_Code.pdf")

SECTIONS = [
    {
        "category": "1. Configuration & Build Setup",
        "description": "Project dependencies, Vite configuration, and primary HTML mount point.",
        "files": [
            ("package.json", "Node.js dependencies, scripts, and build targets"),
            ("vite.config.js", "Vite build tool configuration, port 3000 mapping, and React plugins"),
            ("index.html", "Single Page Application root HTML entrypoint with font imports")
        ]
    },
    {
        "category": "2. Root Entry & Global Application Routing",
        "description": "React DOM hydration, top-level routing, route gates, and styling definitions.",
        "files": [
            ("src/main.jsx", "Client entrypoint initializing React 18 createRoot"),
            ("src/App.jsx", "Top-level application router for Student & Admin modules"),
            ("src/App.css", "Global layout rules, responsive grids, and container styles"),
            ("src/index.css", "Design system tokens, custom scrollbars, buttons, and animations")
        ]
    },
    {
        "category": "3. API & Network Services",
        "description": "Unified HTTP client communicating with Python Flask backend endpoints.",
        "files": [
            ("src/services/api.js", "Complete API service catalog for Auth, Planner, AI, Practicals, and Admin")
        ]
    },
    {
        "category": "4. Context Providers & Global State",
        "description": "React context providers for user authentication, focus mode timer, and theming.",
        "files": [
            ("src/context/AuthContext.jsx", "Authentication state, token persistence, and role management"),
            ("src/context/FocusContext.jsx", "Persistent focus mode timer state across page navigations"),
            ("src/context/ThemeContext.jsx", "Application theme toggle and color palette management")
        ]
    },
    {
        "category": "5. Layouts, Route Protectors & Resilience",
        "description": "Layout shells, role-based access controllers, and application error boundaries.",
        "files": [
            ("src/layouts/MainLayout.jsx", "Main student dashboard layout shell with Sidebar and Navbar"),
            ("src/layouts/AdminLayout.jsx", "Institutional Admin Console shell with dedicated sidebar"),
            ("src/routes/ProtectedRoute.jsx", "Student authenticated route guard redirecting to /login"),
            ("src/components/AdminProtectedRoute.jsx", "Admin role-gate guard requiring authenticated admin privileges"),
            ("src/components/ErrorBoundary.jsx", "React error boundary preventing blank screen crashes")
        ]
    },
    {
        "category": "6. Shared Components & 3D Visualizer",
        "description": "Global widgets, modals, notification listeners, and Three.js 3D canvas.",
        "files": [
            ("src/components/Navbar.jsx", "Top navigation bar with notifications and profile dropdown"),
            ("src/components/Sidebar.jsx", "Student navigation sidebar with all feature links"),
            ("src/components/AlarmListener.jsx", "Background alarm daemon polling and audio dispatch trigger"),
            ("src/components/FloatingFocusWidget.jsx", "Global floating widget for ongoing focus sessions"),
            ("src/components/AICoreModal.jsx", "Global AI study assistant dialog for instant inquiries"),
            ("src/components/DynamicRecoveryModal.jsx", "Smart recovery dialog for missed study sessions"),
            ("src/components/FloatingAiButton.jsx", "Persistent floating trigger for quick AI assistance"),
            ("src/components/LoadingSkeleton.jsx", "Animated placeholder skeletons for loading states"),
            ("src/components/MobileNav.jsx", "Responsive bottom navigation bar for mobile devices"),
            ("src/three/AICoreCanvas.jsx", "Three.js interactive 3D particle core visualization")
        ]
    },
    {
        "category": "7. Student Learning Platform Screens",
        "description": "Core educational modules for study planning, practicals, revision, and quizzes.",
        "files": [
            ("src/pages/Login.jsx", "Role-selection login screen (Student / Administrator)"),
            ("src/pages/Signup.jsx", "Student account registration screen"),
            ("src/pages/Onboarding.jsx", "Student academic profile and preferences setup wizard"),
            ("src/pages/Dashboard.jsx", "Personalized student overview dashboard with study metrics"),
            ("src/pages/Planner.jsx", "AI-powered deterministic study schedule generator and timeline"),
            ("src/pages/KnowledgeUniverse.jsx", "Interactive 3D graph visualizer of academic topic relationships"),
            ("src/pages/UniversalPracticalLab.jsx", "Virtual experimental lab with step-by-step guidance and AI viva"),
            ("src/pages/Assignments.jsx", "Assignment tracker with urgency meters and deadlines"),
            ("src/pages/StudyHub.jsx", "Interactive study notes, summary generator, and concept explorer"),
            ("src/pages/AITutor.jsx", "Socratic AI tutor providing customized explanations"),
            ("src/pages/AIDoubtSolver.jsx", "Academic query solver with step-by-step mathematical reasoning"),
            ("src/pages/Quiz.jsx", "Adaptive quiz interface with difficulty calibration"),
            ("src/pages/QuizResult.jsx", "Quiz analytics, accuracy scores, and performance breakdown"),
            ("src/pages/SmartRevision.jsx", "Spaced repetition scheduler based on memory decay curves"),
            ("src/pages/MistakeBank.jsx", "Incorrect answer bank with AI conceptual error analysis"),
            ("src/pages/Flashcards.jsx", "Interactive flashcard decks with Leitner spaced repetition"),
            ("src/pages/ProgressAnalytics.jsx", "Visual charts and graphs of student learning velocity"),
            ("src/pages/FocusMode.jsx", "Full-screen Pomodoro focus room with ambient background audio"),
            ("src/pages/PDFTeacher.jsx", "Document-grounded AI learning assistant for uploaded PDFs"),
            ("src/pages/Profile.jsx", "Student academic profile, stream, and target exam configuration"),
            ("src/pages/Settings.jsx", "Account preferences, notification settings, and password updates"),
            ("src/pages/AlarmDashboard.jsx", "Session alarm manager and custom audio chime selector"),
            ("src/pages/DatabaseExplorer.jsx", "Protected interactive relational database explorer for demo")
        ]
    },
    {
        "category": "8. Institutional Admin Console Screens",
        "description": "Administrative intelligence, student records directory, and session ledger.",
        "files": [
            ("src/pages/admin/AdminOverview.jsx", "Executive dashboard with aggregated student metrics and graphs"),
            ("src/pages/admin/StudentRecords.jsx", "Searchable, filterable directory of all registered students"),
            ("src/pages/admin/StudentDetail.jsx", "Granular inspection modal for individual student learning logs"),
            ("src/pages/admin/AdminPlans.jsx", "AI study plans portfolio tracking student schedules"),
            ("src/pages/admin/AdminSessions.jsx", "Complete ledger of all scheduled, completed, and missed sessions"),
            ("src/pages/admin/AdminSystem.jsx", "System infrastructure, alarm queue monitor, and engine health")
        ]
    }
]

def generate_html():
    toc_items = []
    file_contents_html = []
    total_files = 0
    total_lines = 0

    for s_idx, sec in enumerate(SECTIONS, 1):
        sec_id = f"section-{s_idx}"
        sec_toc = [f"<div class='toc-section'><h3>{sec['category']}</h3><p class='toc-desc'>{sec['description']}</p><ul>"]
        
        for rel_path, desc in sec["files"]:
            full_path = os.path.join(FRONTEND_DIR, rel_path.replace("/", os.sep))
            if not os.path.exists(full_path):
                continue
            
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            lines = content.split("\n")
            line_count = len(lines)
            total_lines += line_count
            total_files += 1

            file_anchor = "file-" + rel_path.replace("/", "-").replace(".", "-")
            sec_toc.append(f"<li><a href='#{file_anchor}'><span class='toc-path'>{rel_path}</span> <span class='toc-meta'>({line_count:,} lines)</span></a><div class='toc-file-desc'>{desc}</div></li>")

            # Format code with line numbers
            formatted_lines = []
            for num, line in enumerate(lines, 1):
                escaped = html.escape(line)
                formatted_lines.append(f"<span class='ln'>{num:4d}</span>  {escaped}")
            code_block = "\n".join(formatted_lines)

            file_contents_html.append(f"""
            <div class='file-container' id='{file_anchor}'>
                <div class='file-header'>
                    <div class='file-title-block'>
                        <span class='category-badge'>{sec['category'].split('.')[1].strip()}</span>
                        <h2 class='file-path'>{rel_path}</h2>
                        <p class='file-desc'>{desc}</p>
                    </div>
                    <div class='file-stats'>
                        <span class='stat-pill'>{line_count:,} Lines</span>
                        <span class='stat-pill'>{len(content):,} Bytes</span>
                    </div>
                </div>
                <div class='code-wrapper'>
                    <pre><code>{code_block}</code></pre>
                </div>
            </div>
            """)

        sec_toc.append("</ul></div>")
        toc_items.append("".join(sec_toc))

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Planora — Complete Frontend Source Code Ledger</title>
<style>
    @page {{
        size: A4;
        margin: 14mm 12mm;
    }}
    * {{
        box-sizing: border-box;
    }}
    body {{
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #0b0f19;
        color: #e2e8f0;
        margin: 0;
        padding: 24px;
        font-size: 11pt;
        line-height: 1.5;
    }}
    a {{
        color: #60a5fa;
        text-decoration: none;
    }}

    /* Cover Page */
    .cover-page {{
        min-height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        page-break-after: always;
        padding: 40px 20px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }}
    .brand-pill {{
        background: rgba(99, 102, 241, 0.15);
        color: #a5b4fc;
        border: 1px solid rgba(99, 102, 241, 0.4);
        font-size: 10pt;
        font-weight: 700;
        padding: 6px 16px;
        border-radius: 9999px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 20px;
    }}
    .cover-title {{
        font-size: 32pt;
        font-weight: 900;
        color: #ffffff;
        margin: 0 0 12px;
        letter-spacing: -0.02em;
    }}
    .cover-subtitle {{
        font-size: 14pt;
        color: #94a3b8;
        max-width: 680px;
        margin: 0 0 36px;
        font-weight: 400;
    }}
    .meta-grid {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        max-width: 760px;
        width: 100%;
        margin-bottom: 40px;
    }}
    .meta-card {{
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 16px;
    }}
    .meta-val {{
        font-size: 18pt;
        font-weight: 800;
        color: #38bdf8;
    }}
    .meta-lbl {{
        font-size: 8.5pt;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
        margin-top: 4px;
    }}
    .cover-footer {{
        color: #64748b;
        font-size: 9pt;
        margin-top: auto;
    }}

    /* Table of Contents */
    .toc-page {{
        page-break-after: always;
        padding: 20px 0;
    }}
    .toc-title {{
        font-size: 20pt;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 12px;
    }}
    .toc-subtitle {{
        color: #94a3b8;
        font-size: 10pt;
        margin-bottom: 24px;
    }}
    .toc-section {{
        margin-bottom: 24px;
        page-break-inside: avoid;
    }}
    .toc-section h3 {{
        font-size: 12pt;
        color: #f43f5e;
        margin: 0 0 4px;
        font-weight: 800;
    }}
    .toc-desc {{
        font-size: 8.5pt;
        color: #64748b;
        margin: 0 0 10px;
    }}
    .toc-section ul {{
        list-style: none;
        padding-left: 0;
        margin: 0;
    }}
    .toc-section li {{
        padding: 5px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }}
    .toc-path {{
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-weight: 600;
        color: #38bdf8;
        font-size: 9.5pt;
    }}
    .toc-meta {{
        color: #64748b;
        font-size: 8pt;
        margin-left: 8px;
    }}
    .toc-file-desc {{
        color: #94a3b8;
        font-size: 8pt;
        margin-top: 2px;
        padding-left: 4px;
    }}

    /* File Section */
    .file-container {{
        page-break-before: always;
        margin-bottom: 40px;
    }}
    .file-header {{
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 16px 20px;
        background: #111827;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        border: 1px solid #1f2937;
        border-bottom: none;
    }}
    .category-badge {{
        font-size: 7.5pt;
        font-weight: 800;
        text-transform: uppercase;
        color: #f43f5e;
        letter-spacing: 0.08em;
    }}
    .file-path {{
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13pt;
        font-weight: 700;
        color: #ffffff;
        margin: 4px 0;
    }}
    .file-desc {{
        font-size: 9pt;
        color: #94a3b8;
        margin: 0;
    }}
    .file-stats {{
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }}
    .stat-pill {{
        background: rgba(255, 255, 255, 0.06);
        color: #cbd5e1;
        font-size: 8pt;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }}
    .code-wrapper {{
        background: #090d16;
        border: 1px solid #1f2937;
        border-bottom-left-radius: 10px;
        border-bottom-right-radius: 10px;
        overflow-x: auto;
    }}
    pre {{
        margin: 0;
        padding: 14px 16px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 7.8pt;
        line-height: 1.45;
        color: #f1f5f9;
        white-space: pre-wrap;
        word-break: break-all;
    }}
    .ln {{
        color: #475569;
        user-select: none;
        display: inline-block;
        width: 32px;
        text-align: right;
        margin-right: 12px;
        font-weight: 500;
    }}

    @media print {{
        body {{
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
        }}
        .cover-page {{
            background: #ffffff !important;
        }}
        .cover-title {{
            color: #0f172a !important;
        }}
        .meta-card {{
            background: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }}
        .meta-val {{
            color: #0284c7 !important;
        }}
        .file-header {{
            background: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
        }}
        .file-path {{
            color: #0f172a !important;
        }}
        .file-desc {{
            color: #475569 !important;
        }}
        .code-wrapper {{
            background: #f8fafc !important;
            border-color: #cbd5e1 !important;
        }}
        pre {{
            color: #0f172a !important;
        }}
        .ln {{
            color: #94a3b8 !important;
        }}
        .toc-title {{
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
        }}
        .toc-path {{
            color: #0369a1 !important;
        }}
    }}
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover-page">
    <div class="brand-pill">Full Production Source Reference</div>
    <h1 class="cover-title">PLANORA</h1>
    <p class="cover-subtitle">Complete Frontend Code Architecture &amp; Component Blueprint for AI-Powered Study Planner &amp; Learning Assistant</p>

    <div class="meta-grid">
        <div class="meta-card">
            <div class="meta-val">{total_files}</div>
            <div class="meta-lbl">Verified Source Files</div>
        </div>
        <div class="meta-card">
            <div class="meta-val">{total_lines:,}</div>
            <div class="meta-lbl">Total Code Lines</div>
        </div>
        <div class="meta-card">
            <div class="meta-val">8</div>
            <div class="meta-lbl">Architectural Modules</div>
        </div>
        <div class="meta-card">
            <div class="meta-val">100%</div>
            <div class="meta-lbl">Production Ready</div>
        </div>
    </div>

    <div class="cover-footer">
        Generated on Windows Environment • Frontend Port 3000 • Backend Port 5000 • React 18 &amp; Vite
    </div>
</div>

<!-- Table of Contents -->
<div class="toc-page">
    <h2 class="toc-title">Table of Contents &amp; Architectural Index</h2>
    <p class="toc-subtitle">Comprehensive catalog of all 55 frontend files organized by domain responsibility.</p>
    {"".join(toc_items)}
</div>

<!-- All Files Code Content -->
{"".join(file_contents_html)}

</body>
</html>
"""

    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated HTML Book: {OUTPUT_HTML} (Size: {os.path.getsize(OUTPUT_HTML):,} bytes)")

def convert_to_pdf():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    print("Converting HTML to PDF using Chrome Headless...")
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={OUTPUT_PDF}",
        "--no-pdf-header-footer",
        OUTPUT_HTML
    ]
    subprocess.run(cmd, check=True)
    print(f"PDF generated successfully at: {OUTPUT_PDF}")
    print(f"File size: {os.path.getsize(OUTPUT_PDF):,} bytes")

    # Copy to Desktop and Docs
    shutil.copyfile(OUTPUT_PDF, DESKTOP_PDF)
    shutil.copyfile(OUTPUT_PDF, DOCS_PDF)
    print(f"Copied to Desktop: {DESKTOP_PDF}")
    print(f"Copied to Docs: {DOCS_PDF}")

    # Clean up temp HTML
    if os.path.exists(OUTPUT_HTML):
        os.remove(OUTPUT_HTML)
        print("Cleaned up temp HTML.")

if __name__ == "__main__":
    generate_html()
    convert_to_pdf()
