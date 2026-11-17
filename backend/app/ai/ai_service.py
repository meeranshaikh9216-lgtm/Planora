import logging
from flask import current_app
from app.ai.base import BaseAIProvider
from app.ai.gemini_provider import GeminiAIProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.fallback_provider import FallbackAIProvider

logger = logging.getLogger(__name__)

class AIService:
    """
    Unified AI service layer with provider abstraction and automatic resilient fallback.
    """

    def __init__(self):
        self._provider = None
        self._fallback = FallbackAIProvider()

    def _get_provider(self) -> BaseAIProvider:
        provider_name = current_app.config.get('AI_PROVIDER', 'gemini').lower()
        gemini_key = current_app.config.get('GEMINI_API_KEY', '')
        gemini_model = current_app.config.get('GEMINI_MODEL', 'gemini-3.8-flash')
        openai_key = current_app.config.get('OPENAI_API_KEY', '')

        if provider_name == 'gemini' and gemini_key:
            return GeminiAIProvider(api_key=gemini_key, model=gemini_model)
        elif provider_name == 'openai' and openai_key:
            return OpenAIProvider(api_key=openai_key)
        elif gemini_key:
            return GeminiAIProvider(api_key=gemini_key, model=gemini_model)
        elif openai_key:
            return OpenAIProvider(api_key=openai_key)
        else:
            return self._fallback

    def explain_topic(self, topic: str, subject: str, grade: str = "Grade 12", mode: str = "standard"):
        provider = self._get_provider()
        try:
            return provider.explain_topic(topic, subject, grade=grade, mode=mode)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.explain_topic(topic, subject, grade=grade, mode=mode)

    def solve_doubt(self, question_text: str, image_b64=None, subject=None):
        provider = self._get_provider()
        try:
            return provider.solve_doubt(question_text, image_b64=image_b64, subject=subject)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.solve_doubt(question_text, image_b64=image_b64, subject=subject)

    def generate_notes(self, topic: str, subject: str):
        provider = self._get_provider()
        try:
            return provider.generate_notes(topic, subject)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.generate_notes(topic, subject)

    def generate_quiz(self, topic: str, subject: str, difficulty: str = "Medium", num_questions: int = 5):
        provider = self._get_provider()
        try:
            res = provider.generate_quiz(topic, subject, difficulty=difficulty, num_questions=num_questions)
            if res and len(res) > 0:
                return res
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
        return self._fallback.generate_quiz(topic, subject, difficulty=difficulty, num_questions=num_questions)

    def generate_flashcards(self, topic: str, subject: str, count: int = 5):
        provider = self._get_provider()
        try:
            res = provider.generate_flashcards(topic, subject, count=count)
            if res and len(res) > 0:
                return res
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
        return self._fallback.generate_flashcards(topic, subject, count=count)

    def process_document(self, text_content: str, action: str = "summary"):
        provider = self._get_provider()
        try:
            return provider.process_document(text_content, action=action)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.process_document(text_content, action=action)

    def generate_text(self, prompt: str, system_instruction: str = None):
        provider = self._get_provider()
        try:
            return provider.generate_text(prompt, system_instruction=system_instruction)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.generate_text(prompt, system_instruction=system_instruction)

    def visual_explanation(self, topic: str, subject: str):
        provider = self._get_provider()
        try:
            return provider.visual_explanation(topic, subject)
        except Exception as e:
            logger.warning(f"Live AI provider failed ({e}), using offline fallback.")
            return self._fallback.visual_explanation(topic, subject)

ai_service = AIService()
