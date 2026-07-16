import Stripe from "stripe";
import Payment from "../models/Payment.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a payment intent for course enrollment
export const createPaymentIntent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if already enrolled
    const existing = await Enrollment.findOne({ student: userId, course: courseId });
    if (existing) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    // Free course - auto enroll
    if (course.price === 0 || !course.price) {
      const enrollment = new Enrollment({
        student: userId,
        course: courseId,
        progress: 0,
        completedLessons: [],
        enrolledAt: new Date()
      });
      await enrollment.save();

      return res.status(201).json({
        message: "Enrolled successfully (free course)",
        type: "free",
        enrollment
      });
    }

    // Paid course - create payment intent
   

    const paymentIntent = await stripe.paymentIntents.create({
      amount: course.price,
      currency: "usd",
      metadata: {
        courseId: courseId.toString(),
        userId: userId.toString(),
        courseName: course.title
      }
    });

    // Store payment record
    const payment = new Payment({
      user: userId,
      course: courseId,
      amount: course.price,
      currency: "usd",
      stripePaymentIntentId: paymentIntent.id,
      status: "pending"
    });
    await payment.save();

    return res.status(200).json({
      message: "Payment intent created",
      type: "paid",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: course.price,
      courseName: course.title
    });
  } catch (error) {
    return res.status(500).json({ message: "Error creating payment intent", error: error.message });
  }
};

// Confirm payment and create enrollment
export const confirmPayment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    // Get course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: userId,
      course: courseId,
      progress: 0,
      completedLessons: [],
      enrolledAt: new Date()
    });
    await enrollment.save();

    // Update payment record
    await Payment.updateOne(
      { stripePaymentIntentId: paymentIntentId },
      {
        status: "completed",
        enrollment: enrollment._id,
        completedAt: new Date()
      }
    );

    return res.status(201).json({
      message: "Payment confirmed and enrolled successfully",
      enrollment,
      enrollmentId: enrollment._id
    });
  } catch (error) {
    return res.status(500).json({ message: "Error confirming payment", error: error.message });
  }
};

// Get user's payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const payments = await Payment.find({ user: userId })
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: userId });

    return res.status(200).json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};

// Get payment details
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.userId;

    const payment = await Payment.findById(paymentId).populate("course", "title");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify ownership
    if (payment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return res.status(200).json({ payment });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching payment", error: error.message });
  }
};

// Admin: Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const payments = await Payment.find(filter)
      .populate("user", "username email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    // Calculate stats
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    return res.status(200).json({
      payments,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};

// Admin: Get revenue analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query; // day, week, month, year

    let dateFilter = new Date();
    if (period === "week") dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === "month") dateFilter.setMonth(dateFilter.getMonth() - 1);
    else if (period === "year") dateFilter.setFullYear(dateFilter.getFullYear() - 1);

    const revenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          completedAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: "$amount" }
        }
      }
    ]);

    // Top courses by revenue
    const topCourses = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          completedAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: "$course",
          revenue: { $sum: "$amount" },
          students: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return res.status(200).json({
      period,
      revenue: revenue[0] || { totalRevenue: 0, transactionCount: 0, averageTransaction: 0 },
      topCourses
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

// Webhook handler for Stripe events (required for async payment processing)
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).json({ message: `Webhook Error: ${error.message}` });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Handle successful payment
        await Payment.updateOne(
          { stripePaymentIntentId: paymentIntent.id },
          { status: "completed" }
        );
        break;

      case "payment_intent.payment_failed":
        const failedPayment = event.data.object;
        // Handle failed payment
        await Payment.updateOne(
          { stripePaymentIntentId: failedPayment.id },
          { status: "failed" }
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ message: "Event processed" });
  } catch (error) {
    return res.status(500).json({ message: "Webhook processing error", error: error.message });
  }
};
