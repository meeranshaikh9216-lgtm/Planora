from datetime import datetime, date, timedelta
from app.extensions import db
from app.models.user import User
from app.models.gamification import Achievement, UserAchievement
from app.models.notification import Notification

class GamificationService:
    """
    Rewards engine for streaks, XP, level progression, and badges.
    """

    @staticmethod
    def award_xp(user_id: int, points: int, reason: str = "Activity completed"):
        user = User.query.get(user_id)
        if not user:
            return
        user.xp = (user.xp or 0) + points

        # Update streak
        today = date.today()
        if user.last_active_date:
            if user.last_active_date == today - timedelta(days=1):
                user.streak = (user.streak or 0) + 1
            elif user.last_active_date < today - timedelta(days=1):
                user.streak = 1 # Streak reset
        else:
            user.streak = 1

        user.last_active_date = today
        db.session.commit()

        # Check achievements
        GamificationService.check_achievements(user_id)

    @staticmethod
    def check_achievements(user_id: int):
        user = User.query.get(user_id)
        if not user:
            return

        unlocked_codes = {
            ua.achievement.code for ua in UserAchievement.query.filter_by(user_id=user_id).all()
            if ua.achievement
        }

        # Check FIRST_STEP
        from app.models.planner import StudySession
        done_sessions = StudySession.query.filter_by(user_id=user_id, status='completed').count()
        if done_sessions >= 1 and 'FIRST_STEP' not in unlocked_codes:
            GamificationService._unlock_badge(user_id, 'FIRST_STEP')

        # Check STREAK_3
        if user.streak >= 3 and 'STREAK_3' not in unlocked_codes:
            GamificationService._unlock_badge(user_id, 'STREAK_3')

        # Check STREAK_7
        if user.streak >= 7 and 'STREAK_7' not in unlocked_codes:
            GamificationService._unlock_badge(user_id, 'STREAK_7')

        # Check REVISION_HERO
        from app.models.revision import Revision
        done_revs = Revision.query.filter_by(user_id=user_id, status='completed').count()
        if done_revs >= 5 and 'REVISION_HERO' not in unlocked_codes:
            GamificationService._unlock_badge(user_id, 'REVISION_HERO')

    @staticmethod
    def _unlock_badge(user_id: int, code: str):
        ach = Achievement.query.filter_by(code=code).first()
        if not ach:
            return

        user_ach = UserAchievement(user_id=user_id, achievement_id=ach.id)
        db.session.add(user_ach)

        # Award XP for achievement
        user = User.query.get(user_id)
        user.xp = (user.xp or 0) + ach.xp_reward

        # Push Notification
        notif = Notification(
            user_id=user_id,
            type='achievement',
            title=f"Badge Unlocked: {ach.title}!",
            message=f"Congratulations! You unlocked '{ach.badge_name}' and earned +{ach.xp_reward} XP.",
            link='/profile'
        )
        db.session.add(notif)
        db.session.commit()
