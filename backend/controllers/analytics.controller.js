import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Payment from "../models/Payment.model.js";
import User from "../models/User.model.js";
import Submission from "../models/Submission.model.js";

// Get course analytics (instructor)
export const getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.userId;

    const course = await Course.findById(courseId);
    if (!course || course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Total enrolled
    const totalEnrolled = await Enrollment.countDocuments({ course: courseId });

    // Revenue
    const revenue = await Payment.aggregate([
      { $match: { course: courseId, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Progress distribution
    const progressDist = await Enrollment.aggregate([
      { $match: { course: courseId } },
      {
        $group: {
          _id: null,
          avg: { $avg: "$progress" },
          max: { $max: "$progress" },
          min: { $min: "$progress" },
          completed: {
            $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] }
          }
        }
      }
    ]);

    // Enrollment over time
    const enrollmentTrend = await Enrollment.aggregate([
      { $match: { course: courseId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$enrolledAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return res.status(200).json({
      course: {
        id: course._id,
        title: course.title,
        price: course.price
      },
      stats: {
        totalEnrolled,
        revenue: revenue[0]?.total || 0,
        progressStats: progressDist[0] || {},
        enrollmentTrend
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

// Get instructor revenue analytics
export const getRevenueAnalytics = async (req, res) => {
  try {
    const instructorId = req.user.userId;
    const { period = "month" } = req.query;

    let dateFilter = new Date();
    if (period === "week") dateFilter.setDate(dateFilter.getDate() - 7);
    else if (period === "month") dateFilter.setMonth(dateFilter.getMonth() - 1);
    else if (period === "year") dateFilter.setFullYear(dateFilter.getFullYear() - 1);

    // Get instructor courses
    const courses = await Course.find({ instructor: instructorId }).select("_id");
    const courseIds = courses.map(c => c._id);

    // Revenue by course
    const revenueBycourse = await Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: "completed",
          completedAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: "$course",
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 }
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
      { $sort: { revenue: -1 } }
    ]);

    // Total revenue
    const total = await Payment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          status: "completed",
          completedAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
          avgTransaction: { $avg: "$amount" }
        }
      }
    ]);

    return res.status(200).json({
      period,
      summary: total[0] || { totalRevenue: 0, totalTransactions: 0, avgTransaction: 0 },
      byCourse: revenueByCourse
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching revenue", error: error.message });
  }
};

// Get student learning analytics
export const getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user.userId;

    // Enrollment stats
    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title");

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const inProgressCourses = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;

    // Average progress
    const avgProgress = enrollments.length > 0
      ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
      : 0;

    // Progress distribution
    const progressDistribution = {
      notStarted: enrollments.filter(e => e.progress === 0).length,
      inProgress: inProgressCourses,
      completed: completedCourses
    };

    // Assignment performance
    const submissions = await Submission.find({ student: studentId });
    const graded = submissions.filter(s => s.status === "graded");
    const avgGrade = graded.length > 0
      ? graded.reduce((sum, s) => sum + s.grade, 0) / graded.length
      : 0;

    // Learning time (estimated from enrollments)
    const totalEnrollmentDays = enrollments.reduce((sum, e) => {
      const days = (new Date() - new Date(e.enrolledAt)) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);

    return res.status(200).json({
      enrollment: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageProgress: Math.round(avgProgress)
      },
      distribution: progressDistribution,
      assignments: {
        totalSubmissions: submissions.length,
        gradedSubmissions: graded.length,
        averageGrade: Math.round(avgGrade * 10) / 10
      },
      timeline: {
        totalEnrollmentDays: Math.round(totalEnrollmentDays),
        averageDaysPerCourse: enrollments.length > 0 ? Math.round(totalEnrollmentDays / enrollments.length) : 0
      },
      courses: enrollments.map(e => ({
        courseTitle: e.course.title,
        progress: e.progress,
        completedLessons: e.completedLessons.length,
        enrolledDate: e.enrolledAt
      }))
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

// Get platform-wide analytics (admin)
export const getPlatformAnalytics = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Course stats
    const totalCourses = await Course.countDocuments();
    const paidCourses = await Course.countDocuments({ price: { $gt: 0 } });
    const freeCourses = totalCourses - paidCourses;

    // Enrollment stats
    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ progress: 100 });
    const avgProgress = await Enrollment.aggregate([
      { $group: { _id: null, avg: { $avg: "$progress" } } }
    ]);

    // Revenue stats
    const revenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // Growth data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const newEnrollments = await Enrollment.countDocuments({ enrolledAt: { $gte: thirtyDaysAgo } });
    const newCourses = await Course.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    return res.status(200).json({
      users: {
        total: totalUsers,
        byRole: usersByRole,
        newLastMonth: newUsers
      },
      courses: {
        total: totalCourses,
        paid: paidCourses,
        free: freeCourses,
        newLastMonth: newCourses
      },
      enrollments: {
        total: totalEnrollments,
        completed: completedEnrollments,
        averageProgress: Math.round((avgProgress[0]?.avg || 0) * 10) / 10,
        newLastMonth: newEnrollments
      },
      revenue: {
        total: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching platform analytics", error: error.message });
  }
};
