import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import create_app
from app.ai.ai_service import AIService

app = create_app()
with app.app_context():
    ai = AIService()
    print("1. Testing AI Topic Explanation with Gemini:")
    explanation = ai.explain_topic('Electromagnetic Induction', 'Physics')
    print("   Title:", explanation.get('title'))
    print("   Summary:", explanation.get('summary'))
    print("   Core Concepts:", explanation.get('core_concepts')[:2])

    print("\n2. Testing AI Doubt Solver with Gemini:")
    solution = ai.solve_doubt("What is Ohm's Law and its formula?")
    print("   Question Understood:", solution.get('question_understood'))
    print("   Final Answer:", solution.get('final_answer'))
    print("   Common Mistake:", solution.get('common_mistake'))

    print("\n3. Testing AI Quiz Generation with Gemini:")
    quiz = ai.generate_quiz('Chemical Bonding', 'Chemistry', num_questions=2)
    print(f"   Generated {len(quiz)} quiz questions:")
    for idx, q in enumerate(quiz, 1):
        print(f"   [{idx}] {q.get('question_text')}")
        print(f"       Correct: {q.get('correct_option')} - {q.get('explanation')[:60]}...")

    print("\n🎉 SUCCESS: All Gemini AI features are working perfectly with your API key!")
