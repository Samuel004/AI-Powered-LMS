import Certificate from "../models/Certificate.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Course from "../models/Course.model.js";

// Generate certificate when course is completed
export const generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.userId;

    // Check enrollment and progress
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.progress < 100) {
      return res.status(400).json({ message: "Course not completed. Progress: " + enrollment.progress + "%" });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({ student: studentId, course: courseId });
    if (existing && existing.status === "issued") {
      return res.status(200).json({ message: "Certificate already issued", certificate: existing });
    }

    const course = await Course.findById(courseId).populate("instructor", "name email");

    // Generate unique certificate number
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const certificate = new Certificate({
      student: studentId,
      course: courseId,
      instructor: course.instructor._id,
      certificateNumber,
      completionDate: new Date(),
      status: "issued",
      score: enrollment.progress
    });

    await certificate.save();

    return res.status(201).json({
      message: "Certificate generated successfully",
      certificate,
      certificateNumber
    });
  } catch (error) {
    return res.status(500).json({ message: "Error generating certificate", error: error.message });
  }
};

// Get user's certificates
export const getUserCertificates = async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const certificates = await Certificate.find({ student: studentId, status: "issued" })
      .populate("course", "title")
      .populate("instructor", "name")
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments({ student: studentId, status: "issued" });

    return res.status(200).json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching certificates", error: error.message });
  }
};

// Get certificate details
export const getCertificateDetails = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.userId;

    const certificate = await Certificate.findById(certificateId)
      .populate("student", "name email")
      .populate("course", "title description")
      .populate("instructor", "name email");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Verify ownership or instructor
    if (
      certificate.student._id.toString() !== userId.toString() &&
      certificate.instructor._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ certificate });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching certificate", error: error.message });
  }
};

// Verify certificate authenticity
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate("student", "name email")
      .populate("course", "title")
      .populate("instructor", "name");

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    if (certificate.status !== "issued") {
      return res.status(400).json({ message: "Certificate is not valid" });
    }

    return res.status(200).json({
      valid: true,
      certificate,
      verificationDate: new Date()
    });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying certificate", error: error.message });
  }
};

// Admin: Get all certificates
export const getAllCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const certificates = await Certificate.find()
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments();

    return res.status(200).json({
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching certificates", error: error.message });
  }
};

// Revoke certificate
export const revokeCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    certificate.status = "revoked";
    await certificate.save();

    return res.status(200).json({ message: "Certificate revoked", certificate });
  } catch (error) {
    return res.status(500).json({ message: "Error revoking certificate", error: error.message });
  }
};
