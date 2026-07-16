import api from './client2';

// Auth endpoints
export const register = (data) => api.post('/api/auth/signup', data);
export const login = (data) => api.post('/api/auth/login', data);

// Courses endpoints
export const getCourses = (page = 1, limit = 10, search = '', category = '') => 
  api.get('/api/courses', { params: { page, limit, search, category } });

export const getCourseById = (id) => api.get(`/api/courses/${id}`);

export const searchCourses = (query) => api.get('/api/courses/search', { params: { q: query } });

export const getCourseCategories = () => api.get('/api/courses/categories');

export const getTopCourses = () => api.get('/api/courses/top');

// Enrollment endpoints
export const enrollCourse = (courseId) => api.post('/api/enrollment/enroll', { courseId });

export const getEnrolledCourses = () => api.get('/api/enrollment/my-courses');

// Lessons endpoints
export const getLessonsByCourse = (courseId) => api.get(`/api/lessons/${courseId}`);

export const getLessonById = (lessonId) => api.get(`/api/lessons/lesson/${lessonId}`);

// Progress endpoints
export const markLessonComplete = (enrollmentId, lessonId) => 
  api.post('/api/progress/mark-complete', { enrollmentId, lessonId });

export const checkProgress = (courseId) => api.get(`/api/progress/${courseId}`);

export const getStudentProgress = () => api.get('/api/progress/all');

// Student Dashboard
export const getStudentDashboard = () => api.get('/api/student/dashboard');

export const getStudentStats = () => api.get('/api/student/stats');

export const getStudentRecommendations = () => api.get('/api/student/recommendations');

// Instructor Dashboard
export const getInstructorDashboard = () => api.get('/api/instructor/dashboard');

export const getInstructorStats = () => api.get('/api/instructor/stats');

export const getInstructorAnalytics = () => api.get('/api/instructor/analytics');

// AI endpoints
export const generateNotes = (lessonId, tone = 'professional') => 
  api.post(`/api/ai/notes/${lessonId}`, { tone });

export const generateQuiz = (lessonId, numQuestions = 5, questionTypes = ['mcq', 'true-false']) =>
  api.post(`/api/ai/quiz/${lessonId}`, { numQuestions, questionTypes });

export const aiTutor = (courseId, message, conversationHistory = []) =>
  api.post(`/api/ai/tutor/${courseId}`, { message, conversationHistory });

// Payments
export const createPaymentIntent = (courseId) => 
  api.post(`/api/payments/${courseId}/intent`, {});

export const confirmPayment = (courseId, paymentIntentId) =>
  api.post(`/api/payments/${courseId}/confirm`, { paymentIntentId });

export const getPaymentHistory = () => api.get('/api/payments/history');
