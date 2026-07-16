import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { LessonViewerPage } from './pages/LessonViewerPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { CreateCoursePage } from './pages/CreateCoursePage';
import { EditCoursePage } from './pages/EditCoursePage';
import { ManageLessonsPage } from './pages/ManageLessonsPage';
import { EnrolledStudentsPage } from './pages/EnrolledStudentsPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { AIQuizPage } from './pages/AIQuizPage';
import { AITutorPage } from './pages/AITutorPage';
import { LiveClassesPage } from './pages/LiveClassesPage';
import { ScheduleSessionPage } from './pages/ScheduleSessionPage';
import { MeetingRoomPage } from './pages/MeetingRoomPage';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<><Navbar /><LandingPage /></>} />
      <Route path="/login" element={user ? <Navigate to="/" /> : <><Navbar /><LoginPage /></>} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <><Navbar /><RegisterPage /></>} />
      <Route path="/courses" element={<><Navbar /><CoursesPage /></>} />
      <Route path="/courses/:courseId" element={<><Navbar /><CourseDetailsPage /></>} />
      <Route path="/courses/:courseId/lessons/:lessonId" element={<><Navbar /><LessonViewerPage /></>} />

      {/* AI Tools Routes */}
      <Route
        path="/ai-tools"
        element={
          <ProtectedRoute requiredRole="student">
            <><Navbar /><AIToolsPage /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-quiz"
        element={
          <ProtectedRoute requiredRole="student">
            <><Navbar /><AIQuizPage /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/ai-tutor"
        element={
          <ProtectedRoute requiredRole="student">
            <><Navbar /><AITutorPage /></>
          </ProtectedRoute>
        }
      />

      {/* Student Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <><Navbar /><StudentDashboard /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-courses"
        element={
          <ProtectedRoute requiredRole="student">
            <><Navbar /><MyCoursesPage /></>
          </ProtectedRoute>
        }
      />

      {/* Instructor Protected Routes */}
      <Route
        path="/instructor"
        element={
          <ProtectedRoute requiredRole="instructor">
            <><Navbar /><InstructorDashboard /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/create-course"
        element={
          <ProtectedRoute requiredRole="instructor">
            <><Navbar /><CreateCoursePage /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/course/:courseId/edit"
        element={
          <ProtectedRoute requiredRole="instructor">
            <><Navbar /><EditCoursePage /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/course/:courseId/lessons"
        element={
          <ProtectedRoute requiredRole="instructor">
            <><Navbar /><ManageLessonsPage /></>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/course/:courseId/students"
        element={
          <ProtectedRoute requiredRole="instructor">
            <><Navbar /><EnrolledStudentsPage /></>
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <><Navbar /><AdminDashboard /></>
          </ProtectedRoute>
        }
      />

      {/* Live classes routes */}
      <Route path="/live-classes" element={<ProtectedRoute><><Navbar /><LiveClassesPage /></></ProtectedRoute>} />

      <Route path="/live/:sessionId" element={<ProtectedRoute><><Navbar /><MeetingRoomPage /></></ProtectedRoute>} />

      {/* Instructor live scheduling */}
      <Route path="/instructor/live" element={<ProtectedRoute requiredRole="instructor"><><Navbar /><ScheduleSessionPage /></></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
