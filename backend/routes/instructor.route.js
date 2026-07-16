import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {isInstructor} from "../middleware/role.middleware.js";
import {
    getInstructorDashboard, 
    getInstructorStats, 
    getCourseAnalytics,
    getStudentProgressInCourse,
    getAllStudents
} from "../controllers/instructor.controller.js";

const router = express.Router();

// Protected: Instructor role required
router.use(protectRoute, isInstructor);

// Instructor dashboard - overview of all courses and students
router.get("/dashboard", getInstructorDashboard);

// Instructor stats - quick metrics
router.get("/stats", getInstructorStats);

// Detailed analytics for a specific course
router.get("/course/:courseId/analytics", getCourseAnalytics);

// Student progress in a specific course
router.get("/course/:courseId/student/:studentId", getStudentProgressInCourse);

// All students across all instructor's courses
router.get("/students", getAllStudents);

export default router;
