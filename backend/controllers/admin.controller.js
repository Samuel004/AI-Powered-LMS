import User from "../models/User.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Payment from "../models/Payment.model.js";

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // User breakdown
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Course stats
    const courseStats = await Course.aggregate([
      {
        $lookup: {
          from: "enrollments",
          localField: "_id",
          foreignField: "course",
          as: "enrollmentData"
        }
      },
      {
        $group: {
          _id: null,
          avgEnrollments: { $avg: { $size: "$enrollmentData" } },
          totalEnrollments: { $sum: { $size: "$enrollmentData" } }
        }
      }
    ]);

    // Recent activity
    const recentEnrollments = await Enrollment.find()
      .populate("student", "username email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .limit(5);

    return res.status(200).json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue: totalRevenue[0]?.total || 0,
        userBreakdown: userStats,
        courseStats: courseStats[0] || {}
      },
      recentActivity: {
        recentEnrollments
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching dashboard", error: error.message });
  }
};

// Get all users with filtering
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return res.status(200).json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Manage user (suspend/unsuspend/change role)
export const manageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, newRole } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    switch (action) {
      case "suspend":
        user.isSuspended = true;
        break;
      case "unsuspend":
        user.isSuspended = false;
        break;
      case "changeRole":
        if (["student", "instructor", "admin"].includes(newRole)) {
          user.role = newRole;
        } else {
          return res.status(400).json({ message: "Invalid role" });
        }
        break;
      case "delete":
        await User.deleteOne({ _id: userId });
        return res.status(200).json({ message: "User deleted" });
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await user.save();
    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Error managing user", error: error.message });
  }
};

// Get all courses with stats
export const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const skip = (page - 1) * limit;
    const filter = status ? { status } : {};

    const courses = await Course.find(filter)
      .populate("instructor", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add enrollment count for each course
    const coursesWithStats = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
        const revenue = await Payment.aggregate([
          { $match: { course: course._id, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return {
          ...course.toObject(),
          enrollmentCount,
          revenue: revenue[0]?.total || 0
        };
      })
    );

    const total = await Course.countDocuments(filter);

    return res.status(200).json({
      courses: coursesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching courses", error: error.message });
  }
};

// Manage course (approve/reject/suspend)
export const manageCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { action } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    switch (action) {
      case "approve":
        course.isApproved = true;
        break;
      case "reject":
        course.isApproved = false;
        break;
      case "suspend":
        course.isSuspended = true;
        break;
      case "unsuspend":
        course.isSuspended = false;
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await course.save();
    return res.status(200).json({ message: "Course updated", course });
  } catch (error) {
    return res.status(500).json({ message: "Error managing course", error: error.message });
  }
};

// Verify instructor account
export const verifyInstructor = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== "instructor") {
      return res.status(404).json({ message: "Instructor not found" });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "Instructor verified", user });
  } catch (error) {
    return res.status(500).json({ message: "Error verifying instructor", error: error.message });
  }
};

// Get pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    let query = {};
    if (type === "instructors") {
      query = { role: "instructor", isVerified: false };
    } else if (type === "courses") {
      query = { isApproved: false };
    }

    let results, total;

    if (type === "courses") {
      results = await Course.find(query)
        .populate("instructor", "username email")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      total = await Course.countDocuments(query);
    } else {
      results = await User.find(query)
        .select("-password")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      total = await User.countDocuments(query);
    }

    return res.status(200).json({
      pending: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching pending", error: error.message });
  }
};

// Get enrollment analytics
export const getEnrollmentAnalytics = async (req, res) => {
  try {
    const { courseId, instructorId } = req.query;

    const filter = {};
    if (courseId) filter.course = courseId;

    let aggregation = [
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "student",
          foreignField: "_id",
          as: "studentInfo"
        }
      },
      {
        $lookup: {
          from: "courses",
          localField: "course",
          foreignField: "_id",
          as: "courseInfo"
        }
      },
      {
        $group: {
          _id: "$course",
          totalEnrollments: { $sum: 1 },
          avgProgress: { $avg: "$progress" },
          activeStudents: {
            $sum: { $cond: [{ $gt: ["$progress", 0] }, 1, 0] }
          },
          completedStudents: {
            $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] }
          }
        }
      }
    ];

    const analytics = await Enrollment.aggregate(aggregation);

    return res.status(200).json({
      analytics,
      count: analytics.length
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

// Generate system report
export const generateReport = async (req, res) => {
  try {
    const { reportType = "summary" } = req.query;

    const report = {
      generatedAt: new Date(),
      period: "all-time"
    };

    if (reportType === "summary" || reportType === "all") {
      report.users = await User.countDocuments();
      report.courses = await Course.countDocuments();
      report.enrollments = await Enrollment.countDocuments();

      const userRoles = await User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]);
      report.userBreakdown = userRoles;
    }

    if (reportType === "revenue" || reportType === "all") {
      const revenue = await Payment.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            transactions: { $sum: 1 },
            avgTransaction: { $avg: "$amount" }
          }
        }
      ]);
      report.revenue = revenue[0] || {};
    }

    if (reportType === "courses" || reportType === "all") {
      const topCourses = await Course.aggregate([
        {
          $lookup: {
            from: "enrollments",
            localField: "_id",
            foreignField: "course",
            as: "enrollments"
          }
        },
        {
          $project: {
            title: 1,
            instructor: 1,
            price: 1,
            enrollmentCount: { $size: "$enrollments" }
          }
        },
        { $sort: { enrollmentCount: -1 } },
        { $limit: 10 }
      ]);
      report.topCourses = topCourses;
    }

    return res.status(200).json(report);
  } catch (error) {
    return res.status(500).json({ message: "Error generating report", error: error.message });
  }
};
