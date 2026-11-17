import json
from typing import Dict, Any, List, Optional
from app.ai.base import BaseAIProvider

class FallbackAIProvider(BaseAIProvider):
    """
    Intelligent offline academic fallback provider.
    Ensures Planora remains fully interactive and testable even without live API keys.
    """

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        return f"[AI Coach Offline Mode]: Processed request for '{prompt[:60]}...'. For live AI generative reasoning, configure GEMINI_API_KEY or OPENAI_API_KEY in .env."

    def explain_topic(self, topic: str, subject: str, grade: str = "Grade 12", mode: str = "standard") -> Dict[str, Any]:
        simplified = mode == "simplified"
        step_by_step = mode == "step_by_step"
        teach_me_back = mode == "teach_me_back"

        if teach_me_back:
            return {
                "topic": topic,
                "subject": subject,
                "mode": mode,
                "prompt": f"Let's test your understanding of {topic}! Explain in your own words:",
                "questions": [
                    f"What is the fundamental intuition behind {topic}?",
                    f"Can you state the most important formula or condition in {topic} and why it works?",
                    "Where would a student typically make a sign or algebraic error here?"
                ],
                "evaluation_guide": "Focus on conceptual clarity, boundary conditions, and real-world intuition."
            }

        return {
            "topic": topic,
            "subject": subject,
            "grade": grade,
            "mode": mode,
            "title": f"Comprehensive Masterclass: {topic}",
            "summary": f"{topic} is a core milestone in {subject}. Mastery of this topic connects previous conceptual prerequisites to advanced problem-solving techniques.",
            "core_concepts": [
                f"Fundamental definition and standard algebraic/physical formulation of {topic}.",
                "Essential properties, boundary cases, and common constraints.",
                "Systematic analytical method to decompose examination problems."
            ],
            "step_by_step_breakdown": [
                "Step 1: Identify given variables, boundary conditions, and relevant governing laws.",
                "Step 2: Choose the optimal transformation or formula to simplify the expression.",
                "Step 3: Execute algebraic substitution carefully, paying attention to units and signs.",
                "Step 4: Check if the solution satisfies boundary constraints and physical reality."
            ],
            "key_formulas": [
                {"name": "Standard Identity", "formula": "f(x) = ∫ g(x) dx + C", "note": "Always add constant of integration for indefinite forms"},
                {"name": "Conservation / Balance Condition", "formula": "∑ F_net = m · a  or  ΔV = I · R", "note": "Ensure coherent reference frame"}
            ],
            "common_pitfalls": [
                "Neglecting boundary conditions or sign changes during algebraic manipulation.",
                "Applying shortcut formulas outside their valid domain of definition.",
                "Skipping intermediate verification steps before finalizing the numerical answer."
            ],
            "pro_tip": f"When solving complex questions on {topic}, sketch a diagram or write out known quantities before touching calculations."
        }

    def solve_doubt(self, question_text: str, image_b64: Optional[str] = None, subject: Optional[str] = None) -> Dict[str, Any]:
        return {
            "question_understood": question_text or "Question extracted from uploaded study image.",
            "subject": subject or "General Sciences",
            "conceptual_category": "Analytical Problem Solving",
            "step_by_step_solution": [
                "Identify given values and note the target unknown quantity.",
                "State the primary governing principle and relevant theorem.",
                "Substitute known parameters and solve algebraic relations systematically.",
                "Verify dimensional consistency and numerical validity."
            ],
            "final_answer": "Final Result: Evaluated systematically with proven solution steps.",
            "common_mistake": "Rushing through substitution without checking units or boundary signs.",
            "similar_practice_question": f"Practice variant: Apply the same method with inverted boundary conditions to verify conceptual mastery.",
            "note": "AI Provider Fallback: To get dynamic multimodal image OCR and live step-by-step reasoning, provide your GEMINI_API_KEY in backend/.env"
        }

    def generate_notes(self, topic: str, subject: str) -> Dict[str, Any]:
        return {
            "title": f"High-Yield Revision Notes: {topic}",
            "topic": topic,
            "subject": subject,
            "summary": f"Comprehensive, exam-oriented study notes for {topic} in {subject}. Optimized for rapid revision and scoring high marks.",
            "definitions": [
                {"term": f"{topic} Principle", "definition": f"The mathematical or empirical rule that establishes the foundational behavior of {topic}."}
            ],
            "key_points": [
                f"{topic} forms the bridge between basic definitions and practical applications.",
                "High-frequency topic in competitive and board examinations.",
                "Standard problems usually involve 2-3 standard transformation techniques."
            ],
            "formulas": [
                {"name": "Standard Representation", "expression": "y = f(x) + C", "usage": "Primary formula for direct calculation"},
                {"name": "Rate / Derivative Equivalent", "expression": "dy/dx = lim_{Δx→0} Δy/Δx", "usage": "Instantaneous rate of change"}
            ],
            "examples": [
                {
                    "problem": f"Standard exam question on {topic}",
                    "approach": "Identify the standard form, apply substitution, and simplify.",
                    "solution": "Applying standard theorem yields the clean verified result."
                }
            ],
            "exam_tips": [
                "Highlight final answers in a box for examiner clarity.",
                "Always write down the initial formula before substituting numerical values.",
                "Double-check arithmetic and sign conventions."
            ]
        }

    def generate_quiz(self, topic: str, subject: str, difficulty: str = "Medium", num_questions: int = 5) -> List[Dict[str, Any]]:
        questions = [
            {
                "question_text": f"What is the fundamental condition or definition associated with {topic}?",
                "option_a": "It applies universally under continuous and differentiable conditions.",
                "option_b": "It only works when values are strictly zero.",
                "option_c": "It is an empirical approximation with no theoretical proof.",
                "option_d": "It cannot be integrated or differentiated.",
                "correct_option": "A",
                "explanation": f"Under standard curriculum guidelines, {topic} relies on continuous behavior within its operational domain."
            },
            {
                "question_text": f"In {subject}, when analyzing {topic}, what is the most critical common mistake?",
                "option_a": "Using SI units consistently",
                "option_b": "Ignoring sign conventions and boundary constants",
                "option_c": "Writing down intermediate steps",
                "option_d": "Verifying the final answer dimensionally",
                "correct_option": "B",
                "explanation": "Ignoring boundary constants (like + C in integration) or sign changes is the most frequent scoring error."
            },
            {
                "question_text": f"Which of the following best represents the relationship between {topic} and its prerequisites?",
                "option_a": "It operates in total isolation from earlier chapters.",
                "option_b": "It directly builds upon algebraic simplification and core definitions.",
                "option_c": "Prerequisites contradict the core theorems of this chapter.",
                "option_d": "Only empirical memory is needed, no conceptual links exist.",
                "correct_option": "B",
                "explanation": "Mastery of prerequisite topics is vital for decomposing multi-step examination problems."
            },
            {
                "question_text": f"If the complexity parameter in {topic} is doubled under constant conditions, what is the expected outcome?",
                "option_a": "Remains unchanged",
                "option_b": "Scales proportionally according to the governing relation",
                "option_c": "Drops immediately to zero",
                "option_d": "Becomes mathematically undefined",
                "correct_option": "B",
                "explanation": "Governing relations in standard curricula display direct proportionality under controlled variables."
            },
            {
                "question_text": f"How should you verify the correctness of a computed result in {topic}?",
                "option_a": "By checking limiting cases, dimensional consistency, and inverse operations",
                "option_b": "By guessing the closest round number",
                "option_c": "Verification is impossible",
                "option_d": "By skipping boundary condition testing",
                "correct_option": "A",
                "explanation": "Inverse operations (like differentiation to verify integration) and checking limiting cases guarantee correctness."
            }
        ]
        return questions[:num_questions]

    def generate_flashcards(self, topic: str, subject: str, count: int = 5) -> List[Dict[str, Any]]:
        cards = [
            {"front": f"What is {topic}?", "back": f"A foundational concept in {subject} that models systematic changes, rates, or relationships.", "difficulty": "Easy"},
            {"front": f"Core formula in {topic}", "back": "Standard form: y = f(x) + C. Always verify validity conditions.", "difficulty": "Medium"},
            {"front": f"Most common trap in {topic}", "back": "Forgetting the constant of integration or inverse sign during variable substitution.", "difficulty": "Hard"},
            {"front": f"Prerequisite connection for {topic}", "back": "Requires confident algebra, basic definitions, and limit concepts.", "difficulty": "Easy"},
            {"front": f"Exam scoring tip for {topic}", "back": "Always write standard formula first, specify units, and box the final value.", "difficulty": "Medium"}
        ]
        return cards[:count]

    def process_document(self, text_content: str, action: str = "summary") -> Dict[str, Any]:
        preview = text_content[:300].strip() if text_content else "No text extracted"
        return {
            "action": action,
            "document_preview": preview,
            "summary": f"Key study material analyzed ({len(text_content)} characters processed). The document focuses on core academic concepts, problem methodologies, and revision points.",
            "key_insights": [
                "Primary concepts extracted and organized for study planning.",
                "Highlighted definitions and procedural steps for quick revision.",
                "Generated structured queries for active recall and self-assessment."
            ]
        }

    def visual_explanation(self, topic: str, subject: str) -> Dict[str, Any]:
        return {
            "topic": topic,
            "subject": subject,
            "mental_model_analogy": f"Think of {topic} as a continuous transformation of inputs into dynamic rates of change.",
            "stages": [
                {"step": 1, "label": "Initial State", "description": f"Input variables and baseline conditions for {topic}.", "formula_or_symbol": "f(x)"},
                {"step": 2, "label": "Governing Law", "description": "Mathematical or physical transformation mechanism.", "formula_or_symbol": "Δ"},
                {"step": 3, "label": "Boundary Constraints", "description": "Checking edge limits and convergence.", "formula_or_symbol": "lim"},
                {"step": 4, "label": "Result State", "description": f"Solved analytical state for {topic}.", "formula_or_symbol": "Solution"}
            ],
            "ascii_diagram": f"[Input State] ---> [Transformation Law] ---> [Solved {topic}]",
            "core_equation": f"Fundamental Formula for {topic}",
            "key_takeaway": f"Always inspect boundary conditions and rates of change when analyzing {topic}."
        }
