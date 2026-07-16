import express from "express";
import { protectRoute, isInstructor } from "../middleware/auth.middleware.js";
import {
  createAssignment,
  getCourseAssignments,
  getAssignmentDetails,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
  getStudentSubmissions
} from "../controllers/assignment.controller.js";

const router = express.Router();

// Assignments CRUD (instructor)
router.post("/:courseId/create/", protectRoute, isInstructor, createAssignment);
router.post("/:courseId/:lessonId/create", protectRoute, isInstructor, createAssignment);

router.put("/:assignmentId/update", protectRoute, isInstructor, updateAssignment);
router.delete("/:assignmentId", protectRoute, isInstructor, deleteAssignment);

// Get assignments
router.get("/:courseId", getCourseAssignments);
router.get("/details/:assignmentId", getAssignmentDetails);

// Student submissions
router.post("/:assignmentId/submit", protectRoute, submitAssignment);
router.get("/student/submissions", protectRoute, getStudentSubmissions);

// Instructor: View submissions and grade
router.get("/:assignmentId/submissions", protectRoute, isInstructor, getSubmissions);
router.put("/submission/:submissionId/grade", protectRoute, isInstructor, gradeSubmission);

export default router;
