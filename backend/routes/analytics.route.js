import express from "express";
import { protectRoute, isAdmin, isInstructor } from "../middleware/auth.middleware.js";
import {
  getCourseAnalytics,
  getRevenueAnalytics,
  getStudentAnalytics,
  getPlatformAnalytics
} from "../controllers/analytics.controller.js";

const router = express.Router();

// Instructor analytics
router.get("/course/:courseId", protectRoute, isInstructor, getCourseAnalytics);
router.get("/revenue", protectRoute, isInstructor, getRevenueAnalytics);

// Student analytics
router.get("/student/learning", protectRoute, getStudentAnalytics);

// Platform analytics (admin)
router.get("/admin/platform", protectRoute, isAdmin, getPlatformAnalytics);

export default router;
