import express from "express";
import { protectRoute, isInstructor } from "../middleware/auth.middleware.js";
import {
  scheduleClass,
  startClass,
  joinClass,
  getActiveSessions,
  getSessionDetails,
  addMessage,
  endClass,
  getSessionHistory,
  getUpcomingClasses,
  recordSession
} from "../controllers/live.controller.js";

const router = express.Router();

// Schedule a new class (instructor only)
router.post("/:courseId/schedule", protectRoute, isInstructor, scheduleClass);

// Start a class (instructor only)
router.put("/:sessionId/start", protectRoute, isInstructor, startClass);

// Join a class (authenticated users)
router.post("/:sessionId/join", protectRoute, joinClass);

// Get active sessions for a course
router.get("/:courseId/active", getActiveSessions);

// Get session details
router.get("/:sessionId/details", getSessionDetails);

// Add message to session chat
router.post("/:sessionId/message", protectRoute, addMessage);

// End a class (instructor only)
router.put("/:sessionId/end", protectRoute, isInstructor, endClass);

// Get session history for a course
router.get("/:courseId/history", getSessionHistory);

// Get instructor's upcoming classes
router.get("/instructor/upcoming", protectRoute, isInstructor, getUpcomingClasses);

// Save recording (optional)
router.post("/:sessionId/recording", protectRoute, isInstructor, recordSession);

export default router;
