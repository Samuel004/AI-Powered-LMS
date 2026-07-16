import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";
import { protectRoute, isInstructor } from "../middleware/auth.middleware.js";
import {
  uploadLessonVideo,
  uploadLessonResource,
  uploadCourseThumbnail,
  uploadAssignmentAttachment,
  uploadSubmissionFile,
  deleteFile,
  getUploadInfo
} from "../controllers/upload.controller.js";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

// Storage for different file types
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "lms/videos",
    resource_type: "video",
    max_file_size: 100000000 // 100MB
  }
});

const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "lms/resources",
    max_file_size: 50000000 // 50MB
  }
});

const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "lms/images",
    max_file_size: 10000000 // 10MB
  }
});

const fileStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "lms/files",
    max_file_size: 50000000 // 50MB
  }
});

// Multer instances
const uploadVideo = multer({ storage: videoStorage });
const uploadResource = multer({ storage: resourceStorage });
const uploadImage = multer({ storage: imageStorage });
const uploadFile = multer({ storage: fileStorage });

// Upload lesson video
router.post(
  "/lesson/:lessonId/video",
  protectRoute,
  isInstructor,
  uploadVideo.single("video"),
  uploadLessonVideo
);

// Upload lesson resources (PDF, documents)
router.post(
  "/lesson/:lessonId/resource",
  protectRoute,
  isInstructor,
  uploadResource.single("resource"),
  uploadLessonResource
);

// Upload course thumbnail
router.post(
  "/course/:courseId/thumbnail",
  protectRoute,
  isInstructor,
  uploadImage.single("thumbnail"),
  uploadCourseThumbnail
);

// Upload assignment attachments
router.post(
  "/assignment/:assignmentId/attachment",
  protectRoute,
  isInstructor,
  uploadFile.array("attachments", 5),
  uploadAssignmentAttachment
);

// Upload submission files
router.post(
  "/submission/:submissionId/file",
  protectRoute,
  uploadFile.array("files", 5),
  uploadSubmissionFile
);

// Delete file
router.delete(
  "/:publicId",
  protectRoute,
  deleteFile
);

// Get upload info
router.get("/info", getUploadInfo);

export default router;
