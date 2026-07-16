import express from "express";
import {protectRoute} from "../middleware/auth.middleware.js";
import { isInstructor } from "../middleware/role.middleware.js";
import { getLessonById, updateLessonById, deleteLessonById } from "../controllers/lesson.controller.js";

const router = express.Router()


router.get("/:lessonId",protectRoute,getLessonById);

router.put("/:lessonId",protectRoute,isInstructor,updateLessonById);
router.delete("/:lessonId",protectRoute,isInstructor,deleteLessonById);





export default router;
 