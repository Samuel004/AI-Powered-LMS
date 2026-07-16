import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {getStudentDashboard, getStudentStats, getRecommendedCourses} from "../controllers/student.controller.js";

const router = express.Router();

// Student dashboard - Get all enrolled courses with progress
router.get("/dashboard", protectRoute, getStudentDashboard);

// Student stats - Quick overview
router.get("/stats", protectRoute, getStudentStats);

// Recommended courses - Get suggestions based on enrolled courses
router.get("/recommended", protectRoute, getRecommendedCourses);

export default router;
