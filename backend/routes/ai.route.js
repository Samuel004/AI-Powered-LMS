import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  generateNotes,
  generateQuiz,
  aiTutor,
  getAiContent,
  checkAiHealth,
  submitQuiz,
  generateFlashcards
} from "../controllers/ai.controller.js";

const router = express.Router();

// AI Notes - POST /api/ai/notes/:lessonId
// Generates study notes from lesson content
router.post("/notes/:lessonId", protectRoute, generateNotes);

// AI Quiz - POST /api/ai/quiz/:lessonId
// Generates quiz questions from lesson content
router.post("/quiz/:lessonId", protectRoute, generateQuiz);

// AI Tutor - POST /api/ai/tutor/:courseId
// Chat with AI tutor about course content
router.post("/tutor/:courseId", protectRoute, aiTutor);

// Get AI Content - GET /api/ai/content/:lessonId
// Retrieve generated AI content for a lesson
router.get("/content/:lessonId", protectRoute, getAiContent);

// Health Check - GET /api/ai/health
// Check if AI service is operational
router.get("/health", checkAiHealth);

// Alias routes for frontend AI calls
router.post("/generate-notes", protectRoute, (req, res) => {
  if (!req.body.lessonId) return res.status(400).json({message:"lessonId is required"});
  req.params.lessonId = req.body.lessonId;
  return generateNotes(req, res);
});

router.post("/generate-quiz", protectRoute, (req, res) => {
  if (!req.body.lessonId) return res.status(400).json({message:"lessonId is required"});
  req.params.lessonId = req.body.lessonId;
  return generateQuiz(req, res);
});

router.post("/chat", protectRoute, (req, res) => {
  if (!req.body.courseId) return res.status(400).json({message:"courseId is required"});
  req.params.courseId = req.body.courseId;
  return aiTutor(req, res);
});

router.post("/submit-quiz", protectRoute, (req, res) => {
  if (!req.body.lessonId) return res.status(400).json({message:"lessonId is required"});
  req.params.lessonId = req.body.lessonId;
  return submitQuiz(req, res);
});

router.post("/generate-flashcards", protectRoute, (req, res) => {
  if (!req.body.lessonId) return res.status(400).json({message:"lessonId is required"});
  req.params.lessonId = req.body.lessonId;
  return generateFlashcards(req, res);
});

export default router;
