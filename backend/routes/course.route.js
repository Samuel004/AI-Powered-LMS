import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import {addCourse,getCourse,getCourseById,deleteCourseById,updateCourseById,searchCourses,getCategories,getTopCourses,getTrendingCourses} from "../controllers/course.controller.js";
import {isInstructor,isAdmin} from "../middleware/role.middleware.js";
import { addLesson,getLessonByCourseId} from "../controllers/lesson.controller.js";
import {enrollInCourse,getEnrolledCourses,getEnrolledStudents, checkProgress, markLessonComplete, getStudentProgressAll} from "../controllers/enrollment.controller.js";
const router = express.Router()

router.get("/enrollments/me",protectRoute,getEnrolledCourses);
router.get("/enrollments/progress/all",protectRoute,getStudentProgressAll);

// Search and discovery endpoints (public)
router.get("/search",searchCourses);
router.get("/categories",getCategories);
router.get("/top",getTopCourses);
router.get("/trending",getTrendingCourses);

router.post("/",protectRoute,isInstructor,addCourse);
router.post("/:courseId/lessons",protectRoute,isInstructor,addLesson);
router.get("/:courseId/lessons",protectRoute,getLessonByCourseId);
router.get("/",getCourse);
router.get("/:courseId",getCourseById);
router.put("/:courseId",protectRoute,isInstructor,updateCourseById);
router.delete("/:courseId",protectRoute,isInstructor,deleteCourseById);



router.post("/:courseId/enroll",protectRoute,enrollInCourse);
router.get("/:courseId/students",protectRoute,isInstructor,getEnrolledStudents);

// Progress tracking endpoints
router.get("/:courseId/progress",protectRoute,checkProgress);
router.post("/:courseId/lessons/:lessonId/complete",protectRoute,markLessonComplete);


export default router;