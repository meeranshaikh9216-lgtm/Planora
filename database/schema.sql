-- ========================================================
-- PLANORA - DATABASE SCHEMA (MySQL 8.0+)
-- AI-Powered Study Planner and Learning Assistant
-- Tagline: Plan. Learn. Revise. Improve.
-- ========================================================

CREATE DATABASE IF NOT EXISTS planora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE planora;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    xp INT DEFAULT 0,
    streak INT DEFAULT 0,
    last_active_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. STUDENT PROFILES TABLE
CREATE TABLE IF NOT EXISTS student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    grade_class VARCHAR(50) NOT NULL,
    board VARCHAR(80) NOT NULL,
    stream VARCHAR(80) NOT NULL,
    daily_study_hours DECIMAL(3,1) DEFAULT 4.0,
    preferred_study_time VARCHAR(50) DEFAULT 'evening', -- morning, afternoon, evening, night
    exam_date DATE NULL,
    study_goal VARCHAR(255) NULL,
    target_score VARCHAR(50) NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NULL,
    color VARCHAR(30) DEFAULT '#6366f1',
    icon VARCHAR(50) DEFAULT 'book',
    target_score VARCHAR(50) NULL,
    exam_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subject_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_subject_user (user_id)
) ENGINE=InnoDB;

-- 4. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    chapter VARCHAR(100) NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    estimated_minutes INT DEFAULT 60,
    order_index INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_topic_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    INDEX idx_topic_subject (subject_id)
) ENGINE=InnoDB;

-- 5. TOPIC PREREQUISITES TABLE
CREATE TABLE IF NOT EXISTS topic_prerequisites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic_id INT NOT NULL,
    prerequisite_topic_id INT NOT NULL,
    CONSTRAINT fk_tp_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_prereq FOREIGN KEY (prerequisite_topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_topic_prereq (topic_id, prerequisite_topic_id)
) ENGINE=InnoDB;

-- 6. PLANNERS TABLE
CREATE TABLE IF NOT EXISTS planners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    daily_hours DECIMAL(3,1) DEFAULT 4.0,
    status ENUM('active', 'completed', 'archived') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_planner_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_planner_user (user_id)
) ENGINE=InnoDB;

-- 7. PLANNER SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS planner_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    planner_id INT NOT NULL,
    subject_id INT NOT NULL,
    priority_weight DECIMAL(3,2) DEFAULT 1.0,
    CONSTRAINT fk_ps_planner FOREIGN KEY (planner_id) REFERENCES planners(id) ON DELETE CASCADE,
    CONSTRAINT fk_ps_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY uq_planner_subject (planner_id, subject_id)
) ENGINE=InnoDB;

-- 8. STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS study_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    planner_id INT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    title VARCHAR(200) NOT NULL,
    scheduled_start DATETIME NOT NULL,
    scheduled_end DATETIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    status ENUM('scheduled', 'in_progress', 'completed', 'missed', 'rescheduled') DEFAULT 'scheduled',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_planner FOREIGN KEY (planner_id) REFERENCES planners(id) ON DELETE SET NULL,
    CONSTRAINT fk_session_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_session_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    INDEX idx_session_schedule (user_id, scheduled_start, status)
) ENGINE=InnoDB;

-- 9. STUDY LOGS TABLE
CREATE TABLE IF NOT EXISTS study_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    actual_minutes INT NOT NULL,
    focus_rating INT DEFAULT 5, -- 1 to 5
    topics_covered TEXT NULL,
    completed_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_session FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE SET NULL,
    CONSTRAINT fk_log_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    INDEX idx_log_user_date (user_id, completed_at)
) ENGINE=InnoDB;

-- 10. TOPIC PROGRESS TABLE
CREATE TABLE IF NOT EXISTS topic_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic_id INT NOT NULL,
    status ENUM('not_started', 'learning', 'mastered', 'needs_revision') DEFAULT 'not_started',
    confidence_level INT DEFAULT 1, -- 1 to 5
    quiz_attempts_count INT DEFAULT 0,
    average_quiz_score DECIMAL(5,2) DEFAULT 0.0,
    last_studied_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tp_target_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_topic_progress (user_id, topic_id)
) ENGINE=InnoDB;

-- 11. REVISIONS TABLE
CREATE TABLE IF NOT EXISTS revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic_id INT NOT NULL,
    interval_day INT NOT NULL, -- 1, 3, 7, 15, 30
    scheduled_date DATE NOT NULL,
    status ENUM('pending', 'completed', 'skipped') DEFAULT 'pending',
    performance_score DECIMAL(5,2) NULL,
    completed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_rev_schedule (user_id, scheduled_date, status)
) ENGINE=InnoDB;

-- 12. MISTAKES TABLE (Mistake Bank)
CREATE TABLE IF NOT EXISTS mistakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    question_text TEXT NOT NULL,
    student_answer TEXT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NULL,
    recurrence_count INT DEFAULT 1,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mistake_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mistake_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_mistake_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
    INDEX idx_mistake_user (user_id, is_resolved)
) ENGINE=InnoDB;

-- 13. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    title VARCHAR(200) NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    total_questions INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    explanation TEXT NULL,
    points INT DEFAULT 1,
    CONSTRAINT fk_qq_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    time_taken_seconds INT DEFAULT 0,
    completed_at DATETIME NOT NULL,
    CONSTRAINT fk_qa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_qa_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_qa_user (user_id, completed_at)
) ENGINE=InnoDB;

-- 16. QUIZ ANSWERS TABLE
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option CHAR(1) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    CONSTRAINT fk_ans_attempt FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    title VARCHAR(200) NOT NULL,
    summary TEXT NULL,
    key_points JSON NULL,
    formulas JSON NULL,
    examples JSON NULL,
    exam_tips JSON NULL,
    raw_content LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 18. FLASHCARDS TABLE
CREATE TABLE IF NOT EXISTS flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
    mastery_level ENUM('new', 'need_revision', 'known') DEFAULT 'new',
    last_reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fc_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_fc_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 19. AI CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS ai_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic_id INT NULL,
    title VARCHAR(200) NOT NULL,
    mode ENUM('tutor', 'doubt_solver', 'pdf_teacher', 'general') DEFAULT 'tutor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 20. AI MESSAGES TABLE
CREATE TABLE IF NOT EXISTS ai_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content LONGTEXT NOT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 21. UPLOADED DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    extracted_text_summary TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 22. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'award',
    badge_name VARCHAR(50) NOT NULL,
    xp_reward INT DEFAULT 50
) ENGINE=InnoDB;

-- 23. USER ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ua_ach FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_ach (user_id, achievement_id)
) ENGINE=InnoDB;

-- 24. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- upcoming_session, revision_due, missed_session, exam_countdown, streak_reminder, achievement
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user (user_id, is_read, created_at)
) ENGINE=InnoDB;

-- 25. FOCUS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS focus_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NULL,
    topic_id INT NULL,
    duration_minutes INT NOT NULL,
    actual_minutes INT NOT NULL,
    breaks_count INT DEFAULT 0,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_focus_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_focus_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    CONSTRAINT fk_focus_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 26. STUDY MEMORIES TABLE ("Continue Where You Stopped")
CREATE TABLE IF NOT EXISTS study_memories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NOT NULL,
    topic_id INT NOT NULL,
    chapter VARCHAR(100) NULL,
    last_position VARCHAR(255) NULL,
    last_activity VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    CONSTRAINT fk_mem_topic FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    UNIQUE KEY uq_user_topic_memory (user_id, topic_id)
) ENGINE=InnoDB;

-- 27. SESSION REMINDERS TABLE (Smart Alarms)
CREATE TABLE IF NOT EXISTS session_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_id INT NULL,
    title VARCHAR(150) NOT NULL,
    subject_name VARCHAR(100) NULL,
    topic_name VARCHAR(150) NULL,
    scheduled_start DATETIME NOT NULL,
    remind_at DATETIME NOT NULL,
    minutes_before INT DEFAULT 10,
    sound_enabled BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) DEFAULT 'pending', -- pending, delivered, dismissed, snoozed
    delivered_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rem_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rem_session FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE CASCADE,
    INDEX idx_rem_user (user_id),
    INDEX idx_rem_status_time (status, remind_at)
) ENGINE=InnoDB;

-- 28. UNIVERSAL PRACTICALS TABLE
CREATE TABLE IF NOT EXISTS practicals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NULL,
    title VARCHAR(200) NOT NULL,
    field_category VARCHAR(50) NOT NULL, -- science, computer_science, engineering, commerce, humanities, vocational
    academic_level VARCHAR(50) DEFAULT 'Undergraduate',
    aim TEXT NOT NULL,
    apparatus_or_tools TEXT NULL,
    theory_concepts TEXT NULL,
    procedure_steps TEXT NULL,
    observations_schema TEXT NULL,
    calculations_formula TEXT NULL,
    safety_guidelines TEXT NULL,
    viva_questions_json TEXT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prac_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prac_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_prac_field (field_category)
) ENGINE=InnoDB;

-- 29. PRACTICAL ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS practical_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    practical_id INT NOT NULL,
    observations_data TEXT NULL,
    calculations_data TEXT NULL,
    student_notes_or_code TEXT NULL,
    viva_score DECIMAL(5,2) DEFAULT 0.0,
    readiness_percentage DECIMAL(5,2) DEFAULT 0.0,
    feedback TEXT NULL,
    status VARCHAR(30) DEFAULT 'completed',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prac_att_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prac_att_prac FOREIGN KEY (practical_id) REFERENCES practicals(id) ON DELETE CASCADE,
    INDEX idx_prac_att_user (user_id)
) ENGINE=InnoDB;

-- 30. ASSIGNMENTS TABLE (Deadline Manager)
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject_id INT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    due_date DATE NOT NULL,
    priority VARCHAR(20) DEFAULT 'Medium', -- High, Medium, Low
    status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed
    progress_percentage INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_assign_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_assign_due (due_date)
) ENGINE=InnoDB;
