import express from "express";
import { protectRoute, isAdmin } from "../middleware/auth.middleware.js";
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  getPaymentDetails,
  getAllPayments,
  getRevenueAnalytics,
  handleStripeWebhook
} from "../controllers/payment.controller.js";

const router = express.Router();

// Create payment intent for a course
router.post("/:courseId/intent", protectRoute, createPaymentIntent);

// Confirm payment
router.post("/:courseId/confirm", protectRoute, confirmPayment);

// Get user's payment history
router.get("/history", protectRoute, getPaymentHistory);

// Get payment details
router.get("/:paymentId/details", protectRoute, getPaymentDetails);

// Admin: Get all payments
router.get("/admin/all", protectRoute, isAdmin, getAllPayments);

// Admin: Get revenue analytics
router.get("/admin/analytics", protectRoute, isAdmin, getRevenueAnalytics);

// Stripe webhook (no auth - raw body required)
router.post("/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
