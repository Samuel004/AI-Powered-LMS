import express from "express";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  manageUser,
  getAllCourses,
  manageCourse,
  verifyInstructor,
  getPendingVerifications,
  getEnrollmentAnalytics,
  generateReport
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protectRoute, isAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Users management
router.get("/users", getAllUsers);
router.put("/users/:userId", manageUser);

// Courses management
router.get("/courses", getAllCourses);
router.put("/courses/:courseId", manageCourse);

// Instructor verification
router.put("/instructors/:userId/verify", verifyInstructor);

// Pending verifications and approvals
router.get("/pending", getPendingVerifications);

// Analytics
router.get("/analytics/enrollments", getEnrollmentAnalytics);

// Reports
router.get("/reports", generateReport);

export default router;
