import sys, os, json
sys.path.insert(0, '.')
from datetime import datetime, timedelta, date
from app import create_app
from app.extensions import db
from app.models import Practical, SessionReminder, Assignment, User, Subject

app = create_app()
with app.app_context():
    # 1. Seed practicals if empty
    if Practical.query.count() == 0:
        p1 = Practical(
            user_id=1, subject_id=2,
            title="Verification of Ohm's Law and Resistance per Unit Length",
            field_category='science', academic_level='Undergraduate',
            aim='To determine resistance per cm of a given wire by plotting a graph of potential difference versus current.',
            apparatus_or_tools='A wire of unknown resistance, battery eliminator (0-6V), voltmeter (0-3V), ammeter (0-1.5A), rheostat, plug key, connecting wires.',
            theory_concepts="Ohm's Law states that electric current flowing through a conductor is directly proportional to the potential difference across its ends, provided physical conditions like temperature remain constant: V = I * R.",
            procedure_steps=json.dumps([
                {"step": 1, "text": "Draw circuit diagram and connect voltmeter in parallel and ammeter in series."},
                {"step": 2, "text": "Adjust rheostat to get lowest measurable current reading on ammeter."},
                {"step": 3, "text": "Record corresponding voltmeter reading."},
                {"step": 4, "text": "Increase current in 5 equal steps and record corresponding V values."},
                {"step": 5, "text": "Plot V vs I graph and calculate slope = R."}
            ]),
            observations_schema=json.dumps({"columns": ["S.No", "Ammeter Reading I (A)", "Voltmeter Reading V (V)", "Calculated Resistance R = V/I (Ω)"]}),
            calculations_formula='Slope of V-I graph: R = ΔV / ΔI. Resistance per cm = R / Length (cm).',
            safety_guidelines='Ensure connections are tight. Remove plug key when not taking readings to prevent heating of wire.',
            viva_questions_json=json.dumps([
                {"q": "What is the physical significance of the slope of a V-I graph?", "a": "The slope of the V-I graph represents the resistance R of the conductor."},
                {"q": "Why does resistance increase with temperature for a metallic conductor?", "a": "Increased temperature increases lattice vibrations of metal ions, leading to more frequent collisions with free electrons."}
            ])
        )
        p2 = Practical(
            user_id=1, subject_id=1,
            title='Implementation of Binary Search with Complexity Verification',
            field_category='computer_science', academic_level='Undergraduate',
            aim='To design, implement and analyze Binary Search algorithm on sorted dataset and verify O(log n) time complexity.',
            apparatus_or_tools='Python 3.10+, VS Code or Jupyter Notebook, random sorted integer arrays of sizes N=1000, 10000, 100000.',
            theory_concepts='Binary Search operates on divide-and-conquer. It repeatedly compares target with middle element and halves search space. Recurrence: T(n) = T(n/2) + O(1), leading to O(log n).',
            procedure_steps=json.dumps([
                {"step": 1, "text": "Initialize pointers low = 0 and high = len(arr) - 1."},
                {"step": 2, "text": "While low <= high, compute mid = low + (high - low) // 2."},
                {"step": 3, "text": "If arr[mid] == target, return mid index."},
                {"step": 4, "text": "If arr[mid] < target, set low = mid + 1, else high = mid - 1."},
                {"step": 5, "text": "Measure execution time across array sizes and plot comparison."}
            ]),
            observations_schema=json.dumps({"columns": ["Array Size (N)", "Target Element", "Search Time (µs)", "Comparisons Count", "Theoretical log2(N)"]}),
            calculations_formula='T(N) = O(log2 N). Mid calculation avoids integer overflow: mid = low + (high - low) // 2.',
            safety_guidelines='Ensure array is sorted before executing binary search. Guard against off-by-one errors in while condition.',
            viva_questions_json=json.dumps([
                {"q": "What is the worst-case number of comparisons for N elements?", "a": "Floor(log2 N) + 1 comparisons."},
                {"q": "Why is (low + high) // 2 potentially risky in languages like C/Java?", "a": "If low + high exceeds the maximum integer limit (2^31 - 1), it causes integer overflow. low + (high - low) // 2 avoids this."}
            ])
        )
        p3 = Practical(
            user_id=1, subject_id=None,
            title='Preparation of Final Accounts with Adjustments',
            field_category='commerce', academic_level='Undergraduate',
            aim='To prepare Trading Account, Profit & Loss Account, and Balance Sheet from a given Trial Balance with 5 standard closing adjustments.',
            apparatus_or_tools='Trial balance sheet, columnar ledger sheets, calculator, MS Excel or spreadsheet.',
            theory_concepts='Final accounts determine gross profit, net operating profit, and financial standing at end of financial year. Dual aspect convention requires every adjustment to have equal debit and credit impacts.',
            procedure_steps=json.dumps([
                {"step": 1, "text": "Extract all opening balances from the given Trial Balance."},
                {"step": 2, "text": "Transfer direct expenses and sales to Trading Account to compute Gross Profit."},
                {"step": 3, "text": "Transfer indirect expenses and incomes to Profit & Loss Account to compute Net Profit."},
                {"step": 4, "text": "Incorporate adjustments: closing stock, outstanding expenses, prepaid expenses, depreciation, provision for doubtful debts."},
                {"step": 5, "text": "Compile Assets and Liabilities on Balance Sheet and verify tally."}
            ]),
            observations_schema=json.dumps({"columns": ["Item Description", "Trading / P&L (Dr)", "Trading / P&L (Cr)", "Balance Sheet (Assets)", "Balance Sheet (Liabilities)"]}),
            calculations_formula='Gross Profit = Net Sales - Cost of Goods Sold. Net Profit = Gross Profit + Other Incomes - Operating Expenses. Total Assets = Total Liabilities + Owner Capital.',
            safety_guidelines='Double check that adjustments are entered in TWO places: once in Revenue Account (Trading/P&L) and once in Balance Sheet.',
            viva_questions_json=json.dumps([
                {"q": "Why is closing stock shown in both Trading Account and Balance Sheet?", "a": "Because it is an unrecorded transaction at year-end. As an adjustment, dual-entry requires crediting Trading Account (reducing COGS) and debiting current assets on Balance Sheet."},
                {"q": "What is the difference between Provision for Bad Debts and Reserve?", "a": "A provision is a charge against profits for an anticipated loss, whereas a reserve is an appropriation of undistributed profits for financial strength."}
            ])
        )
        db.session.add_all([p1, p2, p3])
        print("Seeded 3 universal practicals!")

    # 2. Seed reminders if empty
    if SessionReminder.query.count() == 0:
        r1 = SessionReminder(
            user_id=1, session_id=1,
            title='Calculus Practice Session',
            subject_name='Mathematics', topic_name='Differentiation',
            scheduled_start=datetime.utcnow() + timedelta(hours=2),
            remind_at=datetime.utcnow() + timedelta(minutes=110),
            minutes_before=10, sound_enabled=True, status='pending'
        )
        r2 = SessionReminder(
            user_id=1, session_id=2,
            title='Physics Electrostatics Numerical Focus',
            subject_name='Physics', topic_name='Electrostatics',
            scheduled_start=datetime.utcnow() + timedelta(hours=5),
            remind_at=datetime.utcnow() + timedelta(minutes=290),
            minutes_before=10, sound_enabled=True, status='pending'
        )
        db.session.add_all([r1, r2])
        print("Seeded 2 session reminders!")

    # 3. Seed assignments if empty
    if Assignment.query.count() == 0:
        a1 = Assignment(
            user_id=1, subject_id=1,
            title='Calculus Problem Set #4',
            description='Complete 15 questions on Chain Rule and Implicit Differentiation from Chapter 5.',
            due_date=date.today() + timedelta(days=3),
            priority='High', status='in_progress', progress_percentage=60
        )
        a2 = Assignment(
            user_id=1, subject_id=2,
            title='Physics Lab Report Submission',
            description="Write up observations, V-I graph, and error calculations for Ohm's Law experiment.",
            due_date=date.today() + timedelta(days=5),
            priority='Medium', status='pending', progress_percentage=20
        )
        db.session.add_all([a1, a2])
        print("Seeded 2 assignments!")

    db.session.commit()
    print("All initial records committed successfully.")
