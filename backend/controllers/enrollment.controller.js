import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import User from "../models/User.model.js";
import Lesson from "../models/Lesson.model.js";


export const enrollInCourse = async(req,res)=>{
    try{
        const { courseId} = req.params;
        if(!mongoose.Types.ObjectId.isValid(courseId)){
            return res.status(400).json({message:"Invalid Course ID!!"});
        }
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course Not Found!!"});
        }

        const studentId = req.user.userId;
        const user = await User.findById(studentId).select("role");
        if(!user){
            return res.status(404).json({message:"User Not Found!!"});
        }
        if(user.role !== "student"){
            return res.status(403).json({message:"Only Students can Enroll in Courses!!"});
        }

        const exisitingEnrollment = await Enrollment.findOne({student:studentId,course:courseId});

        if(exisitingEnrollment){
            return res.status(400).json({message:"Already Enrolled in this Course!!"});
        }

        const enrollment = await Enrollment.create({student:studentId,course:courseId,progress:0});

        return res.status(201).json({message:"Enrolled in Course Successfully!!",enrollment});

    }catch(error){
        return res.status(500).json({message:"Failed to enroll in Course",error:error.message});
    }
}

export const getEnrolledCourses = async(req,res)=>{
    try{
        
        const enrollments = await Enrollment.find({student:req.user.userId}).populate("course");
        const courses = enrollments.map(enrollment=>enrollment.course);
        return res.status(200).json({courses});
    }catch(error){
        return res.status(500).json({message:"Failed to fetch Enrolled Courses",error:error.message});
    }
}

export const getEnrolledStudents = async(req,res)=>{
    try{
        const { courseId} = req.params;
        const instructor = (await Course.findById(courseId)).instructor;
        if(instructor.toString() !== req.user.userId.toString()){
            return res.status(403).json({message:"Only Instructor can view Enrolled Students!!"});
        }
        const enrollments = await Enrollment.find({course:courseId}).populate("student");
        const students = enrollments.map(enrollment=>enrollment.student);
        return res.status(200).json({students});
    }catch(error){
        return res.status(500).json({message:"Failed to fetch Enrolled Students",error:error.message});
    }
}

// Mark a lesson as complete for the student
export const markLessonComplete = async(req,res)=>{
    try{
        const { courseId, lessonId } = req.params;
        const studentId = req.user.userId;

        // Validate course exists
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }

        // Validate lesson exists and belongs to this course
        const lesson = await Lesson.findById(lessonId);
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!!"});
        }
        if(lesson.course.toString() !== courseId){
            return res.status(400).json({message:"Lesson does not belong to this course!!"});
        }

        // Get student's enrollment
        const enrollment = await Enrollment.findOne({student:studentId, course:courseId});
        if(!enrollment){
            return res.status(404).json({message:"Enrollment not found! Please enroll in this course first!!"});
        }

        // Check if lesson is already marked complete (prevent duplicate counting)
        if(!enrollment.completedLessons) enrollment.completedLessons = 0;

        // Get total lessons in course
        const totalLessons = await Lesson.countDocuments({course:courseId});

        // Update enrollment
        enrollment.completedLessons = Math.min(enrollment.completedLessons + 1, totalLessons);
        enrollment.progress = Math.round((enrollment.completedLessons / totalLessons) * 100);

        await enrollment.save();

        return res.status(200).json({
            message:"Lesson marked as complete!",
            enrollment: {
                completedLessons: enrollment.completedLessons,
                totalLessons,
                progress: enrollment.progress
            }
        });

    }catch(error){
        return res.status(500).json({message:"Failed to mark lesson complete",error:error.message});
    }
}

// Get progress for a specific course enrollment
export const checkProgress = async(req,res)=>{
    try{
        const { courseId } = req.params;
        const studentId = req.user.userId;

        // Validate course exists
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }

        // Get enrollment
        const enrollment = await Enrollment.findOne({student:studentId, course:courseId});
        if(!enrollment){
            return res.status(404).json({message:"You are not enrolled in this course!!"});
        }

        // Get total lessons
        const totalLessons = await Lesson.countDocuments({course:courseId});

        return res.status(200).json({
            courseId,
            completedLessons: enrollment.completedLessons || 0,
            totalLessons,
            progress: enrollment.progress || 0,
            isComplete: enrollment.progress === 100
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch progress",error:error.message});
    }
}

// Get progress details for all enrolled courses (dashboard)
export const getStudentProgressAll = async(req,res)=>{
    try{
        const studentId = req.user.userId;

        // Get all enrollments with course details
        const enrollments = await Enrollment.find({student:studentId}).populate("course");

        // For each enrollment, calculate progress details
        const progressData = await Promise.all(
            enrollments.map(async (enrollment) => {
                const totalLessons = await Lesson.countDocuments({course:enrollment.course._id});
                return {
                    courseId: enrollment.course._id,
                    courseName: enrollment.course.title,
                    completedLessons: enrollment.completedLessons || 0,
                    totalLessons,
                    progress: enrollment.progress || 0,
                    enrolledAt: enrollment.enrolledAt,
                    isComplete: enrollment.progress === 100
                };
            })
        );

        return res.status(200).json({progressData});

    }catch(error){
        return res.status(500).json({message:"Failed to fetch all progress",error:error.message});
    }
}
