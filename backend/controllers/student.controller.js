import Enrollment from "../models/Enrollment.model.js";
import Lesson from "../models/Lesson.model.js";

// Get student dashboard with all enrolled courses and progress
export const getStudentDashboard = async(req,res)=>{
    try{
        const studentId = req.user.userId;

        // Get all enrollments with populated course data
        const enrollments = await Enrollment.find({student:studentId})
            .populate({
                path: "course",
                select: "title description thumbnail category instructor createdAt"
            })
            .sort({enrolledAt: -1});

        if(!enrollments || enrollments.length === 0){
            return res.status(200).json({ 
                enrolledCourses: [],
                completedCourses: [],
                stats: {
                    totalEnrolled: 0,
                    totalCompleted: 0,
                    avgProgress: 0
                }
            });
        }

        // Enrich enrollments with additional details (lesson counts, etc.)
        const enrichedCourses = await Promise.all(
            enrollments.map(async (enrollment) => {
                const totalLessons = await Lesson.countDocuments({course:enrollment.course._id});
                
                return {
                    enrollmentId: enrollment._id,
                    courseId: enrollment.course._id,
                    courseName: enrollment.course.title,
                    description: enrollment.course.description,
                    thumbnail: enrollment.course.thumbnail,
                    category: enrollment.course.category,
                    instructor: enrollment.course.instructor,
                    completedLessons: enrollment.completedLessons || 0,
                    totalLessons,
                    progress: enrollment.progress || 0,
                    enrolledAt: enrollment.enrolledAt,
                    isComplete: enrollment.progress === 100
                };
            })
        );

        // Separate into ongoing and completed courses
        const enrolledCourses = enrichedCourses.filter(course => course.progress < 100);
        const completedCourses = enrichedCourses.filter(course => course.progress === 100);

        // Calculate statistics
        const totalEnrolled = enrichedCourses.length;
        const totalCompleted = completedCourses.length;
        const avgProgress = totalEnrolled > 0 
            ? Math.round(
                enrichedCourses.reduce((sum, course) => sum + course.progress, 0) / totalEnrolled
              )
            : 0;

        return res.status(200).json({
            enrolledCourses,
            completedCourses,
            stats: {
                totalEnrolled,
                totalCompleted,
                avgProgress,
                inProgress: totalEnrolled - totalCompleted
            }
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch student dashboard",error:error.message});
    }
}

// Get quick stats for student (progress summary)
export const getStudentStats = async(req,res)=>{
    try{
        const studentId = req.user.userId;

        // Get all enrollments
        const enrollments = await Enrollment.find({student:studentId});

        if(!enrollments || enrollments.length === 0){
            return res.status(200).json({
                totalCourses: 0,
                completedCourses: 0,
                inProgressCourses: 0,
                overallProgress: 0,
                hoursSpent: 0
            });
        }

        const totalCourses = enrollments.length;
        const completedCourses = enrollments.filter(e => e.progress === 100).length;
        const inProgressCourses = totalCourses - completedCourses;
        const overallProgress = Math.round(
            enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalCourses
        );

        // Calculate total hours (based on lessons completed)
        let totalMinutes = 0;
        for(const enrollment of enrollments){
            const completedLessons = await Lesson.find({
                course: enrollment.course,
                order: {$lte: enrollment.completedLessons || 0}
            });
            
            const minutesSpent = completedLessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0);
            totalMinutes += minutesSpent;
        }
        
        const hoursSpent = Math.round(totalMinutes / 60);

        return res.status(200).json({
            totalCourses,
            completedCourses,
            inProgressCourses,
            overallProgress,
            hoursSpent
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch student stats",error:error.message});
    }
}

// Get recommended courses (courses similar to ones student is taking)
export const getRecommendedCourses = async(req,res)=>{
    try{
        const studentId = req.user.userId;
        const {limit = 5} = req.query;

        // Get student's enrolled courses
        const studentEnrollments = await Enrollment.find({student:studentId}).populate("course");
        const enrolledCourseIds = studentEnrollments.map(e => e.course._id);
        const enrolledCategories = studentEnrollments.map(e => e.course.category).filter(Boolean);

        // Find courses in same categories that student is NOT enrolled in
        const recommendedCourses = await Lesson.find({
            course: {$nin: enrolledCourseIds}
        })
            .populate({
                path: "course",
                match: {category: {$in: enrolledCategories}},
                select: "title description thumbnail category instructor"
            })
            .limit(parseInt(limit))
            .lean();

        // Filter out null courses and deduplicate
        const uniqueCourses = [];
        const courseIds = new Set();

        for(const lesson of recommendedCourses){
            if(lesson.course && !courseIds.has(lesson.course._id.toString())){
                courseIds.add(lesson.course._id.toString());
                uniqueCourses.push(lesson.course);
            }
        }

        return res.status(200).json({
            recommended: uniqueCourses.slice(0, parseInt(limit))
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch recommended courses",error:error.message});
    }
}
