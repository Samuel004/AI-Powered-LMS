import express from "express";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";
import {
  generateCertificate,
  getUserCertificates,
  getCertificateDetails,
  verifyCertificate,
  getAllCertificates,
  revokeCertificate
} from "../controllers/certificate.controller.js";

const router = express.Router();

// Generate certificate (student)
router.post("/:courseId/generate", protectRoute, generateCertificate);

// Get user's certificates
router.get("/user", protectRoute, getUserCertificates);

// Get certificate details
router.get("/:certificateId/details", protectRoute, getCertificateDetails);

// Verify certificate (public - no auth)
router.get("/:certificateNumber/verify", verifyCertificate);

// Admin: Get all certificates
router.get("/admin/all", protectRoute, isAdmin, getAllCertificates);

// Admin: Revoke certificate
router.put("/:certificateId/revoke", protectRoute, isAdmin, revokeCertificate);

export default router;
