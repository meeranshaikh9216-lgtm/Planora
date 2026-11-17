-- ========================================================
-- PLANORA - DATABASE SEED DATA
-- ========================================================

USE planora;

-- ACHIEVEMENTS
INSERT INTO achievements (code, title, description, icon, badge_name, xp_reward) VALUES
('FIRST_STEP', 'First Step', 'Completed your first study session', 'footprints', 'Rookie Learner', 50),
('QUIZ_MASTER', 'Quiz Master', 'Scored 100% on any subject quiz', 'award', 'Perfectionist', 100),
('STREAK_3', 'Consistency Spark', 'Maintained a 3-day study streak', 'flame', 'Dedicated', 75),
('STREAK_7', 'Unstoppable Momentum', 'Maintained a 7-day study streak', 'zap', 'Scholar', 200),
('NIGHT_OWL', 'Deep Focus', 'Completed a focus session of over 45 minutes', 'clock', 'Deep Diver', 60),
('REVISION_HERO', 'Memory Champion', 'Completed 5 scheduled spaced revisions', 'repeat', 'Retention Guru', 150),
('DOUBT_CRUSHER', 'Curious Mind', 'Asked AI Tutor 5 questions or doubts', 'sparkles', 'Inquisitive', 80)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- DEFAULT TEST USER (Password: password123)
-- bcrypt hash for 'password123': $2b$12$e/zFm2xLqUuF9H7r9LzF..U6vWv2u6oH6uS6s1h1wQn8lZ1wzY6uW
INSERT INTO users (id, name, email, password_hash, xp, streak, last_active_date) VALUES
(1, 'Alex Mercer', 'demo@planora.ai', '$2b$12$kY4Bv1lUj9kZ.sI6pQWzge6lV7S2n6s1W4e9u2s0q7kQ3r.yZ8s9a', 320, 5, CURDATE())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- STUDENT PROFILE
INSERT INTO student_profiles (user_id, grade_class, board, stream, daily_study_hours, preferred_study_time, exam_date, study_goal, target_score, onboarding_completed) VALUES
(1, 'Grade 12', 'CBSE', 'Science (PCM)', 4.5, 'evening', DATE_ADD(CURDATE(), INTERVAL 28 DAY), 'Score 95%+ in Board Exams', '95%', TRUE)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- SUBJECTS
INSERT INTO subjects (id, user_id, name, code, color, icon, target_score, exam_date) VALUES
(1, 1, 'Mathematics', 'MATH-12', '#6366f1', 'calculator', '95%', DATE_ADD(CURDATE(), INTERVAL 28 DAY)),
(2, 1, 'Physics', 'PHY-12', '#38bdf8', 'atom', '92%', DATE_ADD(CURDATE(), INTERVAL 35 DAY)),
(3, 1, 'Chemistry', 'CHEM-12', '#ec4899', 'flask-conical', '90%', DATE_ADD(CURDATE(), INTERVAL 42 DAY))
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- TOPICS FOR MATHEMATICS
INSERT INTO topics (id, subject_id, name, description, chapter, difficulty, estimated_minutes, order_index) VALUES
(1, 1, 'Limits & Continuity', 'Foundational limit laws and continuity conditions', 'Calculus', 'Easy', 45, 1),
(2, 1, 'Differentiation', 'Derivatives, chain rule, implicit functions, and applications', 'Calculus', 'Medium', 60, 2),
(3, 1, 'Integration', 'Indefinite integrals, substitution, by parts, and definite integrals', 'Calculus', 'Hard', 75, 3),
(4, 1, 'Differential Equations', 'First order separable and linear differential equations', 'Calculus', 'Hard', 60, 4)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- PREREQUISITES: Limits -> Differentiation -> Integration -> Differential Equations
INSERT INTO topic_prerequisites (topic_id, prerequisite_topic_id) VALUES
(2, 1),
(3, 2),
(4, 3)
ON DUPLICATE KEY UPDATE topic_id=VALUES(topic_id);

-- TOPICS FOR PHYSICS
INSERT INTO topics (id, subject_id, name, description, chapter, difficulty, estimated_minutes, order_index) VALUES
(5, 2, 'Electrostatics', 'Coulombs law, electric field, and potential energy', 'Electromagnetism', 'Medium', 60, 1),
(6, 2, 'Current Electricity', 'Ohms law, Kirchhoff laws, and potentiometers', 'Electromagnetism', 'Easy', 50, 2),
(7, 2, 'Electromagnetic Induction', 'Faradays law, Lenzs law, and self/mutual inductance', 'Electromagnetism', 'Hard', 70, 3)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- TOPICS FOR CHEMISTRY
INSERT INTO topics (id, subject_id, name, description, chapter, difficulty, estimated_minutes, order_index) VALUES
(8, 3, 'Chemical Kinetics', 'Rate laws, order of reaction, and Arrhenius equation', 'Physical Chemistry', 'Medium', 55, 1),
(9, 3, 'Electrochemistry', 'Nernst equation, galvanic cells, and conductometry', 'Physical Chemistry', 'Hard', 65, 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- TOPIC PROGRESS
INSERT INTO topic_progress (user_id, topic_id, status, confidence_level, quiz_attempts_count, average_quiz_score, last_studied_at) VALUES
(1, 1, 'mastered', 5, 2, 95.0, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 2, 'learning', 4, 2, 85.0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 3, 'needs_revision', 2, 3, 55.0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 5, 'learning', 3, 1, 75.0, DATE_SUB(NOW(), INTERVAL 3 DAY))
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- MISTAKES
INSERT INTO mistakes (user_id, subject_id, topic_id, question_text, student_answer, correct_answer, explanation, recurrence_count, is_resolved) VALUES
(1, 1, 3, 'Find integral of x * e^x dx', 'x * e^x + C', 'e^x * (x - 1) + C', 'Remember integration by parts: ∫ u v dx = u ∫ v dx - ∫ (u\' ∫ v dx) dx. For x*e^x, let u=x, v=e^x, then u\'=1, so x*e^x - e^x + C.', 2, FALSE),
(1, 2, 5, 'Direction of electric field due to a negative point charge', 'Outwards', 'Inwards towards the charge', 'By convention, test charge is positive, so field lines point radially inward toward negative charges.', 1, FALSE)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- REVISIONS
INSERT INTO revisions (user_id, topic_id, interval_day, scheduled_date, status, performance_score) VALUES
(1, 3, 1, CURDATE(), 'pending', NULL),
(1, 2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'pending', NULL),
(1, 1, 7, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'pending', NULL)
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- STUDY MEMORY
INSERT INTO study_memories (user_id, subject_id, topic_id, chapter, last_position, last_activity) VALUES
(1, 1, 3, 'Calculus', 'Definite Integrals - Exercise 7.4 Q12', 'Practiced by-parts substitution')
ON DUPLICATE KEY UPDATE last_activity=VALUES(last_activity);

-- 27. SESSION REMINDERS
INSERT INTO session_reminders (id, user_id, session_id, title, subject_name, topic_name, scheduled_start, remind_at, minutes_before, sound_enabled, status) VALUES
(1, 1, 1, 'Differentiation Problem Solving', 'Mathematics', 'Differentiation', DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 110 MINUTE), 10, TRUE, 'pending'),
(2, 1, 2, 'Electrostatics Numerical Practice', 'Physics', 'Electrostatics', DATE_ADD(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 290 MINUTE), 10, TRUE, 'pending')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 28. UNIVERSAL PRACTICALS
INSERT INTO practicals (id, user_id, subject_id, title, field_category, academic_level, aim, apparatus_or_tools, theory_concepts, procedure_steps, observations_schema, calculations_formula, safety_guidelines, viva_questions_json, is_custom) VALUES
(1, 1, 2, 'Verification of Ohm\'s Law and Resistance per Unit Length', 'science', 'Undergraduate', 'To determine resistance per cm of a given wire by plotting a graph of potential difference versus current.', 'A wire of unknown resistance, battery eliminator (0-6V), voltmeter (0-3V), ammeter (0-1.5A), rheostat, plug key, connecting wires.', 'Ohm\'s Law states that electric current flowing through a conductor is directly proportional to the potential difference across its ends, provided physical conditions like temperature remain constant: V = I * R.', '[{"step": 1, "text": "Draw circuit diagram and connect voltmeter in parallel and ammeter in series."}, {"step": 2, "text": "Adjust rheostat to get lowest measurable current reading on ammeter."}, {"step": 3, "text": "Record corresponding voltmeter reading."}, {"step": 4, "text": "Increase current in 5 equal steps and record corresponding V values."}, {"step": 5, "text": "Plot V vs I graph and calculate slope = R."}]', '{"columns": ["S.No", "Ammeter Reading I (A)", "Voltmeter Reading V (V)", "Calculated Resistance R = V/I (Ω)"]}', 'Slope of V-I graph: R = ΔV / ΔI. Resistance per cm = R / Length (cm).', 'Ensure connections are tight. Remove plug key when not taking readings to prevent heating of wire.', '[{"q": "What is the physical significance of the slope of a V-I graph?", "a": "The slope of the V-I graph represents the resistance R of the conductor."}, {"q": "Why does resistance increase with temperature for a metallic conductor?", "a": "Increased temperature increases lattice vibrations of metal ions, leading to more frequent collisions with free electrons."}]', FALSE),
(2, 1, 1, 'Implementation of Binary Search with Complexity Verification', 'computer_science', 'Undergraduate', 'To design, implement and analyze Binary Search algorithm on sorted dataset and verify O(log n) time complexity.', 'Python 3.10+, VS Code or Jupyter Notebook, random sorted integer arrays of sizes N=1000, 10000, 100000.', 'Binary Search operates on divide-and-conquer. It repeatedly compares target with middle element and halves search space. Recurrence: T(n) = T(n/2) + O(1), leading to O(log n).', '[{"step": 1, "text": "Initialize pointers low = 0 and high = len(arr) - 1."}, {"step": 2, "text": "While low <= high, compute mid = low + (high - low) // 2."}, {"step": 3, "text": "If arr[mid] == target, return mid index."}, {"step": 4, "text": "If arr[mid] < target, set low = mid + 1, else high = mid - 1."}, {"step": 5, "text": "Measure execution time across array sizes and plot comparison."}]', '{"columns": ["Array Size (N)", "Target Element", "Search Time (µs)", "Comparisons Count", "Theoretical log2(N)"]}', 'T(N) = O(log2 N). Mid calculation avoids integer overflow: mid = low + (high - low) // 2.', 'Ensure array is sorted before executing binary search. Guard against off-by-one errors in while condition.', '[{"q": "What is the worst-case number of comparisons for N elements?", "a": "Floor(log2 N) + 1 comparisons."}, {"q": "Why is (low + high) // 2 potentially risky in languages like C/Java?", "a": "If low + high exceeds the maximum integer limit (2^31 - 1), it causes integer overflow. low + (high - low) // 2 avoids this."}]', FALSE),
(3, 1, NULL, 'Preparation of Final Accounts with Adjustments', 'commerce', 'Undergraduate', 'To prepare Trading Account, Profit & Loss Account, and Balance Sheet from a given Trial Balance with 5 standard closing adjustments.', 'Trial balance sheet, columnar ledger sheets, calculator, MS Excel or spreadsheet.', 'Final accounts determine gross profit, net operating profit, and financial standing at end of financial year. Dual aspect convention requires every adjustment to have equal debit and credit impacts.', '[{"step": 1, "text": "Extract all opening balances from the given Trial Balance."}, {"step": 2, "text": "Transfer direct expenses and sales to Trading Account to compute Gross Profit."}, {"step": 3, "text": "Transfer indirect expenses and incomes to Profit & Loss Account to compute Net Profit."}, {"step": 4, "text": "Incorporate adjustments: closing stock, outstanding expenses, prepaid expenses, depreciation, provision for doubtful debts."}, {"step": 5, "text": "Compile Assets and Liabilities on Balance Sheet and verify tally."}]', '{"columns": ["Item Description", "Trading / P&L (Dr)", "Trading / P&L (Cr)", "Balance Sheet (Assets)", "Balance Sheet (Liabilities)"]}', 'Gross Profit = Net Sales - Cost of Goods Sold. Net Profit = Gross Profit + Other Incomes - Operating Expenses. Total Assets = Total Liabilities + Owner Capital.', 'Double check that adjustments are entered in TWO places: once in Revenue Account (Trading/P&L) and once in Balance Sheet.', '[{"q": "Why is closing stock shown in both Trading Account and Balance Sheet?", "a": "Because it is an unrecorded transaction at year-end. As an adjustment, dual-entry requires crediting Trading Account (reducing COGS) and debiting current assets on Balance Sheet."}, {"q": "What is the difference between Provision for Bad Debts and Reserve?", "a": "A provision is a charge against profits for an anticipated loss, whereas a reserve is an appropriation of undistributed profits for financial strength."}]', FALSE)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 30. ASSIGNMENTS
INSERT INTO assignments (id, user_id, subject_id, title, description, due_date, priority, status, progress_percentage) VALUES
(1, 1, 1, 'Calculus Problem Set #4', 'Complete 15 questions on Chain Rule and Implicit Differentiation from Chapter 5.', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'High', 'in_progress', 60),
(2, 1, 2, 'Physics Lab Report Submission', 'Write up observations, V-I graph, and error calculations for Ohm\'s Law experiment.', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Medium', 'pending', 20),
(3, 1, 3, 'Chemical Kinetics Case Study', 'Solve reaction kinetics numericals and submit graphical Arrhenius plot analysis.', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Low', 'pending', 0)
ON DUPLICATE KEY UPDATE title=VALUES(title);

