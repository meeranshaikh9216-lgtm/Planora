import json
import requests
from typing import Dict, Any, List, Optional
from app.ai.base import BaseAIProvider

class OpenAIProvider(BaseAIProvider):
    """
    OpenAI API implementation for Planora.
    Uses chat completions endpoint with json_object mode.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.openai.com/v1/chat/completions"

    def _call_api(self, messages: list, json_mode: bool = False) -> str:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
        if response.status_code != 200:
            raise RuntimeError(f"OpenAI API error ({response.status_code}): {response.text}")

        data = response.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenAI returned no choices.")
        return choices[0].get("message", {}).get("content", "")

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})
        return self._call_api(messages)

    def explain_topic(self, topic: str, subject: str, grade: str = "Grade 12", mode: str = "standard") -> Dict[str, Any]:
        sys = "You are Planora's AI Master Study Coach. Explain the academic topic clearly. Return valid JSON only."
        prompt = f"""
        Explain the topic '{topic}' in the subject '{subject}' for '{grade}'.
        Explanation mode: '{mode}'.
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
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": prompt}], json_mode=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"topic": topic, "subject": subject, "summary": raw, "core_concepts": []}

    def solve_doubt(self, question_text: str, image_b64: Optional[str] = None, subject: Optional[str] = None) -> Dict[str, Any]:
        sys = "You are Planora's AI Doubt Solver. Analyze question, provide step-by-step solution, highlight common mistakes. Return valid JSON."
        user_content = []
        if question_text:
            user_content.append({"type": "text", "text": f"Question: {question_text} (Subject: {subject or 'General'})"})
        if image_b64:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": image_b64 if image_b64.startswith("data:") else f"data:image/jpeg;base64,{image_b64}"}
            })
        user_content.append({"type": "text", "text": """
        Return JSON strictly matching:
        {
            "question_understood": "Question summary",
            "subject": "Subject identified",
            "conceptual_category": "Topic category",
            "step_by_step_solution": ["Step 1", "Step 2"],
            "final_answer": "Final evaluated answer",
            "common_mistake": "Common trap or error",
            "similar_practice_question": "Practice question"
        }
        """})
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": user_content}], json_mode=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"question_understood": question_text, "step_by_step_solution": [raw], "final_answer": ""}

    def generate_notes(self, topic: str, subject: str) -> Dict[str, Any]:
        sys = "You are Planora's AI Notes Generator. Return valid JSON."
        prompt = f"""
        Generate exam notes for:
        Topic: {topic}, Subject: {subject}.
        Return JSON object with keys: title, topic, subject, summary, definitions, key_points, formulas, examples, exam_tips.
        """
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": prompt}], json_mode=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"title": f"Notes: {topic}", "summary": raw}

    def generate_quiz(self, topic: str, subject: str, difficulty: str = "Medium", num_questions: int = 5) -> List[Dict[str, Any]]:
        sys = "You are Planora's AI Assessment Specialist. Return JSON with a 'questions' array."
        prompt = f"""
        Create {num_questions} multiple choice questions for topic '{topic}' in '{subject}'. Difficulty: {difficulty}.
        Return JSON:
        {{
            "questions": [
                {{
                    "question_text": "...",
                    "option_a": "...",
                    "option_b": "...",
                    "option_c": "...",
                    "option_d": "...",
                    "correct_option": "A",
                    "explanation": "..."
                }}
            ]
        }}
        """
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": prompt}], json_mode=True)
        try:
            parsed = json.loads(raw)
            return parsed.get("questions", [])
        except Exception:
            return []

    def generate_flashcards(self, topic: str, subject: str, count: int = 5) -> List[Dict[str, Any]]:
        sys = "You are Planora's Flashcard Specialist. Return JSON with a 'cards' array."
        prompt = f"""
        Generate {count} flashcards for topic '{topic}' in '{subject}'.
        Return JSON:
        {{
            "cards": [
                {{"front": "...", "back": "...", "difficulty": "Medium"}}
            ]
        }}
        """
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": prompt}], json_mode=True)
        try:
            parsed = json.loads(raw)
            return parsed.get("cards", [])
        except Exception:
            return []

    def process_document(self, text_content: str, action: str = "summary") -> Dict[str, Any]:
        sys = "You are Planora's PDF Study Assistant. Return valid JSON."
        prompt = f"Analyze document for task '{action}':\n\n{text_content[:8000]}\n\nReturn JSON: {{'action': '{action}', 'summary': '...', 'key_insights': []}}"
        raw = self._call_api([{"role": "system", "content": sys}, {"role": "user", "content": prompt}], json_mode=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"action": action, "summary": raw, "key_insights": []}
