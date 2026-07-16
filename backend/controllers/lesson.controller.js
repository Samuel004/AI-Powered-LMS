import Lesson from "../models/Lesson.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
//adding a lesson to a course
export const addLesson = async(req,res)=>{
    try{
        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }
        if(course.instructor.toString() !== req.user.userId){
            return res.status(403).json({message:"You are not the instructor of this course!!"});
        }
        const {title,videoUrl,resources,duration} = req.body;
        const existingLesson = await Lesson.find({course:courseId});
        const order = existingLesson.length + 1;
        const lesson = await Lesson.create({title,videoUrl,resources,duration, course:courseId, order});
        return res.status(201).json(lesson);
    }catch(error){
        return res.status(500).json({message:"Failed to add Lesson",error:error.message});
    }
}

//getting a specific lesson by id
export const getLessonById = async(req,res)=>{
    try{
        const { lessonId } = req.params;
        const user = req.user.userId;

        const lesson = await Lesson.findById(lessonId).populate("course");

        if(!lesson){
            return res.status(404).json({message:"Lesson not found!!"});
        }
        const enrolled = await Enrollment.findOne({student:user,course:lesson.course._id}); 
        if(!enrolled && lesson.course.instructor.toString()!==user.toString()){
            return res.status(403).json({message:"You are not enrolled in this course!!"});
        }
        return res.status(200).json(lesson);
    }catch(error){
        return res.status(500).json({message:"Failed to fetch Lesson!",error:error.message});
    }
}

//getting all lessons for a specific course
export const getLessonByCourseId = async(req,res)=>{
    try{
        const { courseId} = req.params;
        const user = req.user.userId;
        const lessons = await Lesson.find({course:courseId}).sort({order:1});
        if(!lessons || lessons.length === 0){
            return res.status(200).json([]);
        }
        const enrolled = await Enrollment.findOne({student:user,course:courseId}); 
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }
        if(!enrolled && course.instructor.toString()!==user.toString()){
            return res.status(403).json({message:"You are not enrolled in this course!!"});
        }
        return res.status(200).json(lessons);
    }catch(error){
        return res.status(500).json({message:"Failed to fetch lessons for the course!",error:error.message});
    }
}

//updating a lesson by id
export const updateLessonById = async(req,res)=>{
    try{
        const { lessonId} = req.params;
        const lesson = await Lesson.findById(lessonId);
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!"});
        }
        const course = await Course.findById(lesson.course);
        if(!course){
            return res.status(404).json({message:"Course not found for this lesson!!"});
        }
        if (course.instructor.toString() !== req.user.userId){
            return res.status(403).json({message:"You are not the instructor of this course!!"});
        }

        const {title,videoUrl,resources,duration } = req.body;
        const updatedLesson = await Lesson.findByIdAndUpdate(lessonId,{title,videoUrl,resources,duration},{new:true});
        
        return res.status(200).json(updatedLesson);
    }catch(error){
        return res.status(500).json({message:"Failed to update Lesson!",error:error.message});
    }
}

//deleting a lesson by id
export const deleteLessonById = async(req,res)=>{
    try{
        const {lessonId} = req.params;
        const lesson = await Lesson.findById(lessonId);
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!"});
        }

        const course = await Course.findById(lesson.course);
        if(!course){
            return res.status(404).json({message:"Course not found for this lesson!!"});
        }

        if(course.instructor.toString() !== req.user.userId){
            return res.status(403).json({message:"You are not the instructor of this course!!"});
        }
        await lesson.deleteOne();
        return res.status(200).json({message:"Lesson deleted successfully!"});

    }catch(error){
        return res.status(500).json({message:"Failed to delete lesson!",error:error.message});
    }
}