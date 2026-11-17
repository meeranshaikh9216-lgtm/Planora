from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    """Abstract base class for all AI providers in Planora."""

    @abstractmethod
    def generate_text(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """General text completion."""
        pass

    @abstractmethod
    def explain_topic(self, topic: str, subject: str, grade: str = "Grade 12", mode: str = "standard") -> Dict[str, Any]:
        """Explain an academic topic (standard, simplified, step-by-step, or teach-me-back)."""
        pass

    @abstractmethod
    def solve_doubt(self, question_text: str, image_b64: Optional[str] = None, subject: Optional[str] = None) -> Dict[str, Any]:
        """Solve student doubts from text or images."""
        pass

    @abstractmethod
    def generate_notes(self, topic: str, subject: str) -> Dict[str, Any]:
        """Generate structured revision notes."""
        pass

    @abstractmethod
    def generate_quiz(self, topic: str, subject: str, difficulty: str = "Medium", num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate MCQ questions for a quiz."""
        pass

    @abstractmethod
    def generate_flashcards(self, topic: str, subject: str, count: int = 5) -> List[Dict[str, Any]]:
        """Generate spaced repetition flashcards."""
        pass

    @abstractmethod
    def process_document(self, text_content: str, action: str = "summary") -> Dict[str, Any]:
        """Summarize or extract learning points from uploaded PDF text."""
        pass

    @abstractmethod
    def visual_explanation(self, topic: str, subject: str) -> Dict[str, Any]:
        """Generate a visual conceptual explanation with mental models, stages, and diagrams."""
        pass
