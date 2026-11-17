const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

/**
 * Core HTTP Request Wrapper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('planora_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData uploads
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('planora_token');
        localStorage.removeItem('planora_user');
        window.location.href = '/login';
      }
      const errorMsg = data?.error?.message || 'Something went wrong';
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Profile & Onboarding
  getProfile: () => request('/profile'),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  completeOnboarding: (payload) => request('/profile/onboarding', { method: 'POST', body: JSON.stringify(payload) }),

  // Subjects & Topics
  listSubjects: () => request('/subjects'),
  createSubject: (payload) => request('/subjects', { method: 'POST', body: JSON.stringify(payload) }),
  getSubject: (id) => request(`/subjects/${id}`),
  updateSubject: (id, payload) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  listTopics: (subjectId) => request(`/subjects/${subjectId}/topics`),
  createTopic: (subjectId, payload) => request(`/subjects/${subjectId}/topics`, { method: 'POST', body: JSON.stringify(payload) }),
  getTopic: (id) => request(`/topics/${id}`),
  updateTopic: (id, payload) => request(`/topics/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Planners
  listPlanners: () => request('/planners'),
  generatePlanner: (payload) => request('/planners/generate', { method: 'POST', body: JSON.stringify(payload) }),
  getPlanner: (id) => request(`/planners/${id}`),
  deletePlanner: (id) => request(`/planners/${id}`, { method: 'DELETE' }),

  // Sessions
  listSessions: (params = '') => request(`/sessions${params ? '?' + params : ''}`),
  getTodaySessions: () => request('/sessions/today'),
  getMissedSessions: () => request('/sessions/missed'),
  recoverSession: (id, action) => request(`/sessions/${id}/recover`, { method: 'POST', body: JSON.stringify({ action }) }),
  createSession: (payload) => request('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  updateSession: (id, payload) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  completeSession: (id, payload) => request(`/sessions/${id}/complete`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteSession: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),

  // Study Hub & Memory
  getStudyMemory: () => request('/study/memory'),
  saveStudyMemory: (payload) => request('/study/memory', { method: 'POST', body: JSON.stringify(payload) }),
  getKnowledgeUniverse: () => request('/study/universe'),
  getLearningPath: () => request('/study/path'),
  getStudyHub: (topicId) => request(`/study/hub/${topicId}`),

  // AI Service
  explainTopic: (payload) => request('/ai/explain', { method: 'POST', body: JSON.stringify(payload) }),
  solveDoubt: (payload) => request('/ai/doubt', { method: 'POST', body: JSON.stringify(payload) }),
  chatTutor: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  listConversations: () => request('/ai/conversations'),
  getConversation: (id) => request(`/ai/conversations/${id}`),
  visualExplanation: (payload) => request('/ai/visual-explanation', { method: 'POST', body: JSON.stringify(payload) }),

  // Quizzes
  listQuizzes: (params = '') => request(`/quizzes${params ? '?' + params : ''}`),
  generateQuiz: (payload) => request('/quizzes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  getQuiz: (id, includeAnswers = false) => request(`/quizzes/${id}?include_answers=${includeAnswers}`),
  submitQuiz: (id, payload) => request(`/quizzes/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  getAttempt: (id) => request(`/quizzes/attempts/${id}`),

  // Revisions
  listRevisions: (params = '') => request(`/revisions${params ? '?' + params : ''}`),
  completeRevision: (id, score = 100) => request(`/revisions/${id}/complete`, { method: 'POST', body: JSON.stringify({ score }) }),

  // Mistakes
  listMistakes: (params = '') => request(`/mistakes${params ? '?' + params : ''}`),
  resolveMistake: (id, isResolved) => request(`/mistakes/${id}/resolve`, { method: 'PUT', body: JSON.stringify({ is_resolved: isResolved }) }),
  generateMistakeQuiz: () => request('/mistakes/quiz', { method: 'POST' }),

  // Notes
  listNotes: (params = '') => request(`/notes${params ? '?' + params : ''}`),
  generateNotes: (payload) => request('/notes/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createNote: (payload) => request('/notes', { method: 'POST', body: JSON.stringify(payload) }),
  getNote: (id) => request(`/notes/${id}`),
  updateNote: (id, payload) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteNote: (id) => request(`/notes/${id}`, { method: 'DELETE' }),

  // Flashcards
  listFlashcards: (params = '') => request(`/flashcards${params ? '?' + params : ''}`),
  generateFlashcards: (payload) => request('/flashcards/generate', { method: 'POST', body: JSON.stringify(payload) }),
  createFlashcard: (payload) => request('/flashcards', { method: 'POST', body: JSON.stringify(payload) }),
  reviewFlashcard: (id, mastery) => request(`/flashcards/${id}/review`, { method: 'PUT', body: JSON.stringify({ mastery_level: mastery }) }),
  deleteFlashcard: (id) => request(`/flashcards/${id}`, { method: 'DELETE' }),

  // Progress & Analytics
  getDashboard: () => request('/progress/dashboard'),
  getAnalytics: () => request('/progress/analytics'),
  getKnowledgeGaps: () => request('/progress/gaps'),

  // Focus Mode
  completeFocus: (payload) => request('/focus/complete', { method: 'POST', body: JSON.stringify(payload) }),
  getFocusHistory: () => request('/focus/history'),

  // Documents
  uploadDocument: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
  listDocuments: () => request('/documents'),
  processDocument: (id, action) => request(`/documents/${id}/process`, { method: 'POST', body: JSON.stringify({ action }) }),

  // Notifications & Achievements
  listNotifications: (unreadOnly = false) => request(`/notifications?unread_only=${unreadOnly}`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PUT' }),
  listAchievements: () => request('/achievements'),

  // Database Explorer (Admin & Diagnostics)
  getDbOverview: () => request('/admin/database/overview'),
  getTableRecords: (tableName, params = '') => request(`/admin/database/table/${tableName}${params ? '?' + params : ''}`),

  // Smart Alarms & Reminders
  listReminders: (status = '') => request(`/reminders${status ? '?status=' + status : ''}`),
  getDueReminders: () => request('/reminders/due'),
  createReminder: (payload) => request('/reminders', { method: 'POST', body: JSON.stringify(payload) }),
  dismissReminder: (id) => request(`/reminders/${id}/dismiss`, { method: 'POST' }),
  snoozeReminder: (id, minutes = 5) => request(`/reminders/${id}/snooze`, { method: 'POST', body: JSON.stringify({ minutes }) }),
  testAlarm: () => request('/reminders/test', { method: 'POST' }),
  syncSessionReminders: () => request('/reminders/sync-sessions', { method: 'POST' }),

  // AI Learning Intelligence Engine
  getIntelligenceOverview: () => request('/intelligence/overview'),
  getRecommendations: () => request('/intelligence/recommendations'),
  getRetentionMap: () => request('/intelligence/retention-map'),

  // Universal Practical Lab
  listPracticals: (params = '') => request(`/practicals${params ? '?' + params : ''}`),
  getPractical: (id) => request(`/practicals/${id}`),
  createPractical: (payload) => request('/practicals', { method: 'POST', body: JSON.stringify(payload) }),
  aiGeneratePractical: (payload) => request('/practicals/ai-generate', { method: 'POST', body: JSON.stringify(payload) }),
  submitPracticalAttempt: (id, payload) => request(`/practicals/${id}/submit-attempt`, { method: 'POST', body: JSON.stringify(payload) }),
  evaluateVivaAnswer: (payload) => request('/practicals/viva-evaluate', { method: 'POST', body: JSON.stringify(payload) }),

  // Assignments & Deadlines
  listAssignments: (params = '') => request(`/assignments${params ? '?' + params : ''}`),
  createAssignment: (payload) => request('/assignments', { method: 'POST', body: JSON.stringify(payload) }),
  updateAssignment: (id, payload) => request(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAssignment: (id) => request(`/assignments/${id}`, { method: 'DELETE' }),

  // Admin Console & Management
  adminLogin: (payload) => request('/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminOverview: () => request('/admin/overview'),
  getAdminStudents: (params = '') => request(`/admin/students${params ? '?' + params : ''}`),
  getAdminStudentDetail: (id) => request(`/admin/students/${id}`),
  getAdminPlans: (params = '') => request(`/admin/plans${params ? '?' + params : ''}`),
  getAdminSessions: (params = '') => request(`/admin/sessions${params ? '?' + params : ''}`),
  getAdminRemindersMonitor: () => request('/admin/monitor/reminders'),
  getAdminSystemHealth: () => request('/admin/monitor/system')
};
