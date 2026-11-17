import json
import re
import requests
import logging
from typing import Dict, Any, List, Optional
from app.ai.base import BaseAIProvider

logger = logging.getLogger(__name__)

class GeminiAIProvider(BaseAIProvider):
    """
    Google Gemini API implementation for Planora AI Study Coach.
    Supports multimodal queries (text + images), JSON structured outputs, and text completion.
    Uses Gemini 3.8 Flash with automatic fallback to Gemini 3.5 Flash and Gemini Flash Latest.
    """

    def __init__(self, api_key: str, model: str = "gemini-3.1-flash-lite"):
        self.api_key = api_key
        self.model = model
        self.candidate_models = [
            self.model,
            "gemini-3.5-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.8-flash",
            "gemini-flash-latest"
        ]

    def _clean_json(self, text: str) -> str:
        """Strip markdown code block wrappers (```json ... ```) if present."""
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
            text = re.sub(r"\s*```$", "", text)
        return text.strip()

    def _call_api(self, contents: list, system_instruction: Optional[str] = None, response_schema: Optional[bool] = None) -> str:
        headers = {"Content-Type": "application/json"}
        payload = {"contents": contents}

        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        generation_config = {
            "temperature": 0.4,
            "maxOutputTokens": 2048,
        }
        if response_schema:
            generation_config["responseMimeType"] = "application/json"

        payload["generationConfig"] = generation_config

        last_error = None
        # Try primary model and fallback to backup candidate models if needed
        for m in self.candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=25)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "")
                    return ""
                else:
                    last_error = f"Model {m} status {response.status_code}: {response.text}"
                    logger.warning(f"Gemini model {m} failed ({response.status_code}), trying next fallback...")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Gemini model {m} request exception: {e}")

        raise RuntimeError(f"All Gemini models exhausted. Last error: {last_error}")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        contents = [{"parts": [{"text": prompt}]}]
        return self._call_api(contents, system_instruction=system_instruction)

    def explain_topic(self, topic: str, subject: str, grade: str = "Grade 12", mode: str = "standard") -> Dict[str, Any]:
        system_instruction = (
            "You are Planora's AI Master Study Coach. Explain the academic topic clearly, "
            "rigorously, and engagingly. Return valid JSON only."
        )
        prompt = f"""
        Explain the topic '{topic}' in the subject '{subject}' for a student in '{grade}'.
        Explanation mode: '{mode}' (Options: 'standard', 'simplified', 'step_by_step', 'teach_me_back').
        
        Return a JSON object with:
        {{
            "topic": "{topic}",
            "subject": "{subject}",
            "mode": "{mode}",
            "title": "Clear educational title",
            "summary": "2-3 sentence core summary",
            "core_concepts": ["concept 1", "concept 2", "concept 3"],
            "step_by_step_breakdown": ["step 1", "step 2", "step 3"],
            "key_formulas": [{{"name": "...", "formula": "...", "note": "..."}}],
            "common_pitfalls": ["pitfall 1", "pitfall 2"],
            "pro_tip": "Advice for exam scoring"
        }}
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            return json.loads(self._clean_json(raw))
        except Exception:
            return {"topic": topic, "subject": subject, "summary": raw, "core_concepts": [], "step_by_step_breakdown": []}

    def solve_doubt(self, question_text: str, image_b64: Optional[str] = None, subject: Optional[str] = None) -> Dict[str, Any]:
        system_instruction = (
            "You are Planora's AI Doubt Solver. Analyze the student's question, provide the exact step-by-step solution, "
            "highlight common mistakes, and provide a similar practice question. Return valid JSON."
        )
        parts = []
        if question_text:
            parts.append({"text": f"Question text: {question_text}\nSubject context: {subject or 'General'}"})
        if image_b64:
            mime_type = "image/jpeg"
            b64_data = image_b64
            if "," in image_b64:
                prefix, b64_data = image_b64.split(",", 1)
                if "png" in prefix:
                    mime_type = "image/png"
                elif "webp" in prefix:
                    mime_type = "image/webp"

            parts.append({
                "inlineData": {
                    "mimeType": mime_type,
                    "data": b64_data
                }
            })

        parts.append({"text": """
        Format your response strictly as JSON with this structure:
        {
            "question_understood": "Clear summary of the question identified",
            "subject": "Subject identified",
            "conceptual_category": "Topic category",
            "step_by_step_solution": ["Step 1...", "Step 2...", "Step 3..."],
            "final_answer": "Final evaluated answer",
            "common_mistake": "The exact trap or mistake students often make in this question",
            "similar_practice_question": "One similar question for the student to practice"
        }
        """})

        raw = self._call_api([{"parts": parts}], system_instruction=system_instruction, response_schema=True)
        try:
            return json.loads(self._clean_json(raw))
        except Exception:
            return {
                "question_understood": question_text,
                "step_by_step_solution": [raw],
                "final_answer": "See steps above",
                "common_mistake": "Carefully verify each substitution",
                "similar_practice_question": "Try solving with different numerical coefficients."
            }

    def generate_notes(self, topic: str, subject: str) -> Dict[str, Any]:
        system_instruction = "You are Planora's AI Academic Notes Generator. Produce structured, high-yield revision notes. Return JSON."
        prompt = f"""
        Generate comprehensive, exam-ready notes for:
        Topic: {topic}
        Subject: {subject}

        Return JSON matching this schema:
        {{
            "title": "Revision Notes: {topic}",
            "topic": "{topic}",
            "subject": "{subject}",
            "summary": "Concise high-yield summary",
            "definitions": [{{"term": "...", "definition": "..."}}],
            "key_points": ["point 1", "point 2", "point 3"],
            "formulas": [{{"name": "...", "expression": "...", "usage": "..."}}],
            "examples": [{{"problem": "...", "approach": "...", "solution": "..."}}],
            "exam_tips": ["tip 1", "tip 2"]
        }}
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            return json.loads(self._clean_json(raw))
        except Exception:
            return {"title": f"Notes: {topic}", "summary": raw, "key_points": []}

    def generate_quiz(self, topic: str, subject: str, difficulty: str = "Medium", num_questions: int = 5) -> List[Dict[str, Any]]:
        system_instruction = "You are Planora's AI Assessment Specialist. Create high quality multiple-choice questions for testing students. Return JSON."
        prompt = f"""
        Create {num_questions} multiple choice questions for topic '{topic}' in '{subject}'.
        Difficulty: {difficulty}.
        
        Return a JSON array of question objects:
        [
            {{
                "question_text": "...",
                "option_a": "...",
                "option_b": "...",
                "option_c": "...",
                "option_d": "...",
                "correct_option": "A",
                "explanation": "Why this option is correct and why other options are incorrect"
            }}
        ]
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            parsed = json.loads(self._clean_json(raw))
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "questions" in parsed:
                return parsed["questions"]
            return []
        except Exception:
            return []

    def generate_flashcards(self, topic: str, subject: str, count: int = 5) -> List[Dict[str, Any]]:
        system_instruction = "You are Planora's Flashcard Specialist. Generate concise spaced repetition flashcards. Return JSON."
        prompt = f"""
        Generate {count} flashcards for topic '{topic}' in '{subject}'.
        Return a JSON array:
        [
            {{
                "front": "Question or prompt",
                "back": "Concise, precise answer",
                "difficulty": "Medium"
            }}
        ]
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            parsed = json.loads(self._clean_json(raw))
            if isinstance(parsed, list):
                return parsed
            return []
        except Exception:
            return []

    def process_document(self, text_content: str, action: str = "summary") -> Dict[str, Any]:
        truncated_text = text_content[:10000]
        system_instruction = "You are Planora's PDF Study Assistant. Analyze student course materials and extract structured learning insights. Return JSON."
        prompt = f"""
        Analyze this study document material:
        ---
        {truncated_text}
        ---

        Task requested: {action} (e.g. 'summary', 'notes', 'key_concepts', 'flashcards').
        
        Return a JSON object:
        {{
            "action": "{action}",
            "summary": "Structured summary of the provided text",
            "key_insights": ["insight 1", "insight 2", "insight 3"],
            "study_recommendation": "Advice on how to study this material"
        }}
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            return json.loads(self._clean_json(raw))
        except Exception:
            return {"action": action, "summary": raw, "key_insights": []}

    def visual_explanation(self, topic: str, subject: str) -> Dict[str, Any]:
        system_instruction = (
            "You are Planora's AI Visual Concept Designer. Create a vivid, highly intuitive "
            "mental model, step-by-step visual pipeline, ASCII diagram, and formula breakdown for the student. Return valid JSON."
        )
        prompt = f"""
        Explain the topic '{topic}' in '{subject}' visually.
        
        Return JSON with:
        {{
            "topic": "{topic}",
            "subject": "{subject}",
            "mental_model_analogy": "A vivid real-world intuitive metaphor or mental picture (2-3 sentences)",
            "stages": [
                {{"step": 1, "label": "Initial Stage / Input", "description": "What we start with visually", "formula_or_symbol": "f(x)"}},
                {{"step": 2, "label": "Transformation Process", "description": "The exact change or mechanism applied", "formula_or_symbol": "Δy/Δx"}},
                {{"step": 3, "label": "Critical Transition / Limit", "description": "The key insight or inflection point", "formula_or_symbol": "lim Δx->0"}},
                {{"step": 4, "label": "Final Output State", "description": "The resulting solved concept or physical meaning", "formula_or_symbol": "f'(x)"}}
            ],
            "ascii_diagram": "A clear, clean 4-6 line ASCII flow or geometric diagram illustrating this topic",
            "core_equation": "The central mathematical or physical formula",
            "key_takeaway": "Key visual exam rule to always remember"
        }}
        """
        raw = self._call_api([{"parts": [{"text": prompt}]}], system_instruction=system_instruction, response_schema=True)
        try:
            return json.loads(self._clean_json(raw))
        except Exception:
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
