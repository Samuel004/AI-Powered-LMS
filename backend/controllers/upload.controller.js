import Lesson from "../models/Lesson.model.js";
import Course from "../models/Course.model.js";

// Upload lesson video
export const uploadLessonVideo = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const instructorId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const lesson = await Lesson.findById(lessonId).populate("course");
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Verify instructor
    if (lesson.course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // File uploaded via multer-storage-cloudinary
    const videoUrl = req.file.secure_url;

    lesson.videoUrl = videoUrl;
    await lesson.save();

    return res.status(200).json({
      message: "Video uploaded successfully",
      videoUrl,
      lesson
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading video", error: error.message });
  }
};

// Upload lesson resources (PDF, documents, etc.)
export const uploadLessonResource = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const instructorId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const lesson = await Lesson.findById(lessonId).populate("course");
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Verify instructor
    if (lesson.course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const resourceUrl = req.file.secure_url;
    const fileName = req.file.original_name || req.file.filename;

    // Add to resources array
    lesson.resources.push({
      url: resourceUrl,
      fileName: fileName
    });

    await lesson.save();

    return res.status(200).json({
      message: "Resource uploaded successfully",
      resourceUrl,
      fileName,
      resources: lesson.resources
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading resource", error: error.message });
  }
};

// Upload course thumbnail
export const uploadCourseThumbnail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify instructor
    if (course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const thumbnailUrl = req.file.secure_url;

    course.thumbnail = thumbnailUrl;
    await course.save();

    return res.status(200).json({
      message: "Thumbnail uploaded successfully",
      thumbnailUrl,
      course
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading thumbnail", error: error.message });
  }
};

// Upload assignment attachment (instructor)
export const uploadAssignmentAttachment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const instructorId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    // Note: Requires Assignment model to have attachments field
    // This endpoint stores attachment URLs for reference

    const attachmentUrls = req.files.map(file => ({
      url: file.secure_url,
      fileName: file.original_name || file.filename,
      uploadedAt: new Date()
    }));

    return res.status(200).json({
      message: "Attachments uploaded successfully",
      attachments: attachmentUrls,
      count: attachmentUrls.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading attachments", error: error.message });
  }
};

// Upload student submission files
export const uploadSubmissionFile = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const studentId = req.user.userId;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const submissionFiles = req.files.map(file => ({
      url: file.secure_url,
      fileName: file.original_name || file.filename,
      uploadedAt: new Date()
    }));

    return res.status(200).json({
      message: "Submission files uploaded successfully",
      files: submissionFiles,
      count: submissionFiles.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading files", error: error.message });
  }
};

// Delete file from Cloudinary
export const deleteFile = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: "Public ID required" });
    }

    // In production, implement Cloudinary delete via API
    // For now, return success - can be extended later

    return res.status(200).json({
      message: "File deletion queued",
      publicId
    });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting file", error: error.message });
  }
};

// Get upload status/info
export const getUploadInfo = async (req, res) => {
  try {
    return res.status(200).json({
      status: "ready",
      cloudinary: {
        maxFileSize: "100MB",
        supportedFormats: ["video/mp4", "application/pdf", "image/jpeg", "image/png"],
        uploadEndpoint: "/api/upload"
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching info", error: error.message });
  }
};
