import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Lesson from "../models/Lesson.model.js";
import User from "../models/User.model.js";

// Get instructor dashboard - overview of all created courses and students
export const getInstructorDashboard = async(req,res)=>{
    try{
        const instructorId = req.user.userId;

        // Get all courses created by instructor
        const courses = await Course.findOne({instructor:instructorId}).select("_id");
        
        if(!courses) {
            // Instructor hasn't created any courses yet
            return res.status(200).json({
                courses: [],
                stats: {
                    totalCourses: 0,
                    totalStudents: 0,
                    averageCompletion: 0,
                    totalRevenue: 0,
                    topCourse: null
                },
                analyticsData: {
                    courseBreakdown: [],
                    studentProgress: []
                }
            });
        }

        // Get all courses for this instructor
        const instructorCourses = await Course.find({instructor:instructorId})
            .select("_id title description thumbnail category createdAt");

        if(!instructorCourses || instructorCourses.length === 0){
            return res.status(200).json({
                courses: [],
                stats: {
                    totalCourses: 0,
                    totalStudents: 0,
                    averageCompletion: 0,
                    totalRevenue: 0,
                    topCourse: null
                },
                analyticsData: {
                    courseBreakdown: [],
                    studentProgress: []
                }
            });
        }

        const courseIds = instructorCourses.map(c => c._id);

        // Get all enrollments for these courses
        const enrollments = await Enrollment.find({course: {$in: courseIds}})
            .populate({
                path: "student",
                select: "name email"
            })
            .populate({
                path: "course",
                select: "_id title"
            });

        // Calculate course-level analytics
        const courseAnalytics = await Promise.all(
            instructorCourses.map(async (course) => {
                const courseEnrollments = enrollments.filter(
                    e => e.course._id.toString() === course._id.toString()
                );
                
                const totalLessons = await Lesson.countDocuments({course:course._id});
                const studentCount = courseEnrollments.length;
                const completedCount = courseEnrollments.filter(e => e.progress === 100).length;
                const avgCompletion = studentCount > 0 
                    ? Math.round(
                        courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / studentCount
                      )
                    : 0;

                return {
                    courseId: course._id,
                    courseName: course.title,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    studentCount,
                    completedCount,
                    averageCompletion: avgCompletion,
                    totalLessons,
                    createdAt: course.createdAt
                };
            })
        );

        // Overall statistics
        const totalCourses = instructorCourses.length;
        const totalStudents = enrollments.length;
        const averageCompletion = totalStudents > 0
            ? Math.round(
                enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalStudents
              )
            : 0;
        const topCourse = courseAnalytics.length > 0
            ? courseAnalytics.reduce((top, current) => 
                current.studentCount > top.studentCount ? current : top
              )
            : null;

        // Student progress breakdown
        const studentProgressBreakdown = [
            {label: "Not Started (0%)", count: enrollments.filter(e => e.progress === 0).length},
            {label: "In Progress (1-50%)", count: enrollments.filter(e => e.progress > 0 && e.progress <= 50).length},
            {label: "Advanced (51-99%)", count: enrollments.filter(e => e.progress > 50 && e.progress < 100).length},
            {label: "Completed (100%)", count: enrollments.filter(e => e.progress === 100).length}
        ];

        return res.status(200).json({
            courses: courseAnalytics.sort((a, b) => b.studentCount - a.studentCount),
            stats: {
                totalCourses,
                totalStudents,
                averageCompletion,
                totalRevenue: 0, // For future payment integration
                topCourse
            },
            analyticsData: {
                courseBreakdown: courseAnalytics.sort((a, b) => b.averageCompletion - a.averageCompletion),
                studentProgress: studentProgressBreakdown
            }
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch instructor dashboard",error:error.message});
    }
}

// Get quick stats for instructor
export const getInstructorStats = async(req,res)=>{
    try{
        const instructorId = req.user.userId;

        // Get all courses
        const courses = await Course.find({instructor:instructorId}).select("_id");
        const courseIds = courses.map(c => c._id);

        // Get enrollments
        const enrollments = await Enrollment.find({course: {$in: courseIds}});

        const totalCourses = courses.length;
        const totalStudents = enrollments.length;
        const activeStudents = new Set(enrollments.map(e => e.student.toString())).size;
        const completedEnrollments = enrollments.filter(e => e.progress === 100).length;
        const completionRate = totalStudents > 0 
            ? Math.round((completedEnrollments / totalStudents) * 100)
            : 0;

        return res.status(200).json({
            totalCourses,
            totalStudents,
            activeStudents,
            completionRate,
            totalRevenue: 0
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch instructor stats",error:error.message});
    }
}

// Get detailed course analytics
export const getCourseAnalytics = async(req,res)=>{
    try{
        const {courseId} = req.params;
        const instructorId = req.user.userId;

        // Verify course belongs to instructor
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }
        if(course.instructor.toString() !== instructorId.toString()){
            return res.status(403).json({message:"Unauthorized to view this course analytics!!"});
        }

        // Get enrollments
        const enrollments = await Enrollment.find({course:courseId})
            .populate({
                path: "student",
                select: "name email"
            });

        // Get lessons
        const lessons = await Lesson.find({course:courseId}).sort({order:1});

        // Calculate metrics
        const totalStudents = enrollments.length;
        const completedStudents = enrollments.filter(e => e.progress === 100).length;
        const averageProgress = totalStudents > 0
            ? Math.round(
                enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalStudents
              )
            : 0;

        // Student details with progress
        const studentDetails = enrollments.map(enrollment => ({
            studentId: enrollment.student._id,
            studentName: enrollment.student.name,
            studentEmail: enrollment.student.email,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons || 0,
            totalLessons: lessons.length,
            enrolledAt: enrollment.enrolledAt,
            isComplete: enrollment.progress === 100
        }));

        // Lesson-level analytics
        const lessonAnalytics = await Promise.all(
            lessons.map(async (lesson) => {
                // Count students who completed this lesson
                const completedCount = enrollments.filter(
                    e => e.completedLessons && e.completedLessons >= lesson.order
                ).length;
                
                return {
                    lessonId: lesson._id,
                    lessonName: lesson.title,
                    order: lesson.order,
                    duration: lesson.duration,
                    studentsCompleted: completedCount,
                    completionRate: totalStudents > 0 
                        ? Math.round((completedCount / totalStudents) * 100)
                        : 0
                };
            })
        );

        return res.status(200).json({
            courseId,
            courseName: course.title,
            totalStudents,
            completedStudents,
            averageProgress,
            completionRate: totalStudents > 0
                ? Math.round((completedStudents / totalStudents) * 100)
                : 0,
            totalLessons: lessons.length,
            studentDetails: studentDetails.sort((a, b) => b.progress - a.progress),
            lessonAnalytics
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch course analytics",error:error.message});
    }
}

// Get detailed student progress in a specific course
export const getStudentProgressInCourse = async(req,res)=>{
    try{
        const {courseId, studentId} = req.params;
        const instructorId = req.user.userId;

        // Verify course belongs to instructor
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }
        if(course.instructor.toString() !== instructorId.toString()){
            return res.status(403).json({message:"Unauthorized!!"});
        }

        // Get student
        const student = await User.findById(studentId).select("name email");
        if(!student){
            return res.status(404).json({message:"Student not found!!"});
        }

        // Get enrollment
        const enrollment = await Enrollment.findOne({student:studentId, course:courseId});
        if(!enrollment){
            return res.status(404).json({message:"Student not enrolled in this course!!"});
        }

        // Get lessons
        const lessons = await Lesson.find({course:courseId}).sort({order:1});

        return res.status(200).json({
            studentId,
            studentName: student.name,
            studentEmail: student.email,
            courseId,
            courseName: course.title,
            progress: enrollment.progress,
            completedLessons: enrollment.completedLessons || 0,
            totalLessons: lessons.length,
            enrolledAt: enrollment.enrolledAt,
            lastActive: enrollment.updatedAt || enrollment.enrolledAt,
            isComplete: enrollment.progress === 100,
            lessonsCompleted: lessons
                .filter((_, index) => index < (enrollment.completedLessons || 0))
                .map(lesson => ({
                    lessonId: lesson._id,
                    lessonName: lesson.title,
                    order: lesson.order
                }))
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch student progress",error:error.message});
    }
}

// Get all students in all instructor's courses (for management)
export const getAllStudents = async(req,res)=>{
    try{
        const instructorId = req.user.userId;
        const {courseId} = req.query;

        let query = {};
        if(courseId){
            query.course = courseId;
        } else {
            // Get all courses for this instructor
            const courses = await Course.find({instructor:instructorId}).select("_id");
            const courseIds = courses.map(c => c._id);
            query.course = {$in: courseIds};
        }

        // Get enrollments
        const enrollments = await Enrollment.find(query)
            .populate({
                path: "student",
                select: "name email role"
            })
            .populate({
                path: "course",
                select: "_id title"
            })
            .sort({enrolledAt: -1});

        // Deduplicate students and add their courses
        const studentMap = new Map();
        
        enrollments.forEach(enrollment => {
            const studentId = enrollment.student._id.toString();
            
            if(!studentMap.has(studentId)){
                studentMap.set(studentId, {
                    studentId: enrollment.student._id,
                    studentName: enrollment.student.name,
                    studentEmail: enrollment.student.email,
                    totalCourses: 0,
                    completedCourses: 0,
                    averageProgress: 0,
                    courses: []
                });
            }
            
            const student = studentMap.get(studentId);
            student.courses.push({
                courseId: enrollment.course._id,
                courseName: enrollment.course.title,
                progress: enrollment.progress,
                enrolledAt: enrollment.enrolledAt
            });
            
            student.totalCourses = student.courses.length;
            student.completedCourses = student.courses.filter(c => c.progress === 100).length;
            student.averageProgress = Math.round(
                student.courses.reduce((sum, c) => sum + c.progress, 0) / student.courses.length
            );
        });

        const students = Array.from(studentMap.values())
            .sort((a, b) => b.averageProgress - a.averageProgress);

        return res.status(200).json({
            totalStudents: students.length,
            students
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch students",error:error.message});
    }
}
