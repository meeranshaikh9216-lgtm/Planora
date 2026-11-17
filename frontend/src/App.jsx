import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FocusProvider } from './context/FocusContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminProtectedRoute from './components/AdminProtectedRoute';

// Public & Student Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Planner from './pages/Planner';
import StudyHub from './pages/StudyHub';
import AITutor from './pages/AITutor';
import AIDoubtSolver from './pages/AIDoubtSolver';
import Quiz from './pages/Quiz';
import QuizResult from './pages/QuizResult';
import KnowledgeUniverse from './pages/KnowledgeUniverse';
import SmartRevision from './pages/SmartRevision';
import MistakeBank from './pages/MistakeBank';
import Flashcards from './pages/Flashcards';
import ProgressAnalytics from './pages/ProgressAnalytics';
import FocusMode from './pages/FocusMode';
import PDFTeacher from './pages/PDFTeacher';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import UniversalPracticalLab from './pages/UniversalPracticalLab';
import Assignments from './pages/Assignments';

// Protected Admin Console Pages
import AdminOverview from './pages/admin/AdminOverview';
import StudentRecords from './pages/admin/StudentRecords';
import AdminPlans from './pages/admin/AdminPlans';
import AdminSessions from './pages/admin/AdminSessions';
import AdminSystem from './pages/admin/AdminSystem';
import DatabaseExplorer from './pages/DatabaseExplorer';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FocusProvider>
          <OfflineBanner />
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Onboarding Wizard Route */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Protected Institutional Admin Console Routes */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="students" element={<StudentRecords />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="sessions" element={<AdminSessions />} />
                <Route path="database" element={<DatabaseExplorer />} />
                <Route path="system" element={<AdminSystem />} />
              </Route>

              {/* Main Authenticated Student Layout Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="planner" element={<Planner />} />
                <Route path="universe" element={<KnowledgeUniverse />} />
                <Route path="practicals" element={<UniversalPracticalLab />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="alarms" element={<Navigate to="/planner" replace />} />
                <Route path="study-hub" element={<StudyHub />} />
                <Route path="study-hub/:topicId" element={<StudyHub />} />
                <Route path="ai-tutor" element={<AITutor />} />
                <Route path="doubt-solver" element={<AIDoubtSolver />} />
                <Route path="quizzes" element={<Quiz />} />
                <Route path="quiz-result/:attemptId" element={<QuizResult />} />
                <Route path="revisions" element={<SmartRevision />} />
                <Route path="mistakes" element={<MistakeBank />} />
                <Route path="flashcards" element={<Flashcards />} />
                <Route path="analytics" element={<ProgressAnalytics />} />
                <Route path="focus" element={<FocusMode />} />
                <Route path="pdf-teacher" element={<PDFTeacher />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </FocusProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
