import Course from "../models/Course.model.js";
import Lesson from "../models/Lesson.model.js";
import Enrollment from "../models/Enrollment.model.js";


export const getCourse = async(req,res)=>{

    try {
        const courses = await Course.find();
        res.json(courses);
    }catch (error){
        return res.status(500).json({message:"Failed to fetch Courses",error:error.message});
    } 

}

export const getCourseById = async(req,res)=>{
    try{

        const {courseId} = req.params;
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course Not Found!!"});
        }
        
        res.json(course);
    }catch(error){
        return res.status(500).json({message:"Failed to fetch Course",error:error.message});
    }
}


export const deleteCourseById = async(req,res)=>{
    try{
        const {courseId} = req.params;
        const course = await Course.findByIdAndDelete(courseId);
        if(!course){
            return res.status(404).json({message:"Course Not Found!!"});
        }
        res.json({message:"Course Deleted Successfully!!"});
    }catch(error){
        return res.status(500).json({message:"Failed to delete Course",error:error.message});
    }
}

export const addCourse = async(req,res)=>{
    try{
        const {title,description,thumbnail,category} = req.body;
        if(!title){
            return res.status(400).json({message:"Title is required!!"});
        }
        const course = await Course.create({title,description,thumbnail,category,instructor:req.user.userId});
        res.status(201).json(course);
    }catch(error){
        return res.status(500).json({message:"Failed to create Course",error:error.message});
    }
    
}

export const updateCourseById = async(req,res)=>{
    try{
        const {courseId} = req.params;
        const {title,description,thumbnail,category} = req.body;
        const course = await Course.findById(courseId);

         if(!course){
            return res.status(404).json({message:"Course Not Found!!"});
        }

        if(course.instructor.toString()!== req.user.userId && req.user.role !=="admin"){
            return res.status(403).json({message:"Unauthorized to update this course!!"});
        }

        if (course.instructor.toString() !== req.user.userId && req.user.role !== "admin"){
            return res.status(403).json({message:"Unauthorized to update this course!!"});
        }
       
        const updatedCourse = await Course.findByIdAndUpdate(courseId, {title,description,thumbnail,category}, {new:true});
        res.json(updatedCourse);
    }catch(error){
        return res.status(500).json({message:"Failed to update Course",error:error.message});
    }
}

// Search and filter courses
export const searchCourses = async(req,res)=>{
    try{
        const {
            q = "",                    // Search query (title/description)
            category = "",             // Filter by category
            instructor = "",           // Filter by instructor ID
            sortBy = "createdAt",      // Sort field
            sortOrder = "desc",        // Sort order (asc/desc)
            page = 1,                  // Pagination
            limit = 10                 // Results per page
        } = req.query;

        // Build filter object
        const filter = {};

        // Text search on title and description
        if(q && q.trim()){
            filter.$or = [
                {title: {$regex: q, $options: "i"}},
                {description: {$regex: q, $options: "i"}}
            ];
        }

        // Category filter
        if(category && category.trim()){
            filter.category = {$regex: category, $options: "i"};
        }

        // Instructor filter
        if(instructor && instructor.trim()){
            filter.instructor = instructor;
        }

        // Parse pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        // Parse sort
        const sortObj = {};
        const validSortFields = ["title", "createdAt", "category"];
        const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
        const sortDir = sortOrder && sortOrder.toLowerCase() === "asc" ? 1 : -1;
        sortObj[sortField] = sortDir;

        // Execute query with pagination
        const courses = await Course.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .populate("instructor", "name email");

        // Get total count for pagination info
        const totalCourses = await Course.countDocuments(filter);
        const totalPages = Math.ceil(totalCourses / limitNum);

        // Enrich courses with enrollment and lesson data
        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = await Enrollment.countDocuments({course:course._id});
                const lessonCount = await Lesson.countDocuments({course:course._id});

                return {
                    _id: course._id,
                    title: course.title,
                    description: course.description,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    instructor: course.instructor,
                    enrollmentCount,
                    lessonCount,
                    createdAt: course.createdAt
                };
            })
        );

        return res.status(200).json({
            data: enrichedCourses,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCourses,
                coursesPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                searchQuery: q,
                category: category || "all",
                instructor: instructor || "all",
                sortBy: sortField,
                sortOrder: sortDir === 1 ? "asc" : "desc"
            }
        });

    }catch(error){
        return res.status(500).json({message:"Failed to search courses",error:error.message});
    }
}

// Get available categories (for filter dropdowns)
export const getCategories = async(req,res)=>{
    try{
        const categories = await Course.distinct("category");
        const categoriesWithCount = await Promise.all(
            categories.map(async (cat) => {
                const count = await Course.countDocuments({category:cat});
                return {
                    name: cat,
                    count
                };
            })
        );

        return res.status(200).json({
            categories: categoriesWithCount.sort((a, b) => b.count - a.count)
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch categories",error:error.message});
    }
}

// Get top courses (by enrollment count)
export const getTopCourses = async(req,res)=>{
    try{
        const {limit = 5} = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 5));

        // Get all courses with enrollment counts
        const courses = await Course.find()
            .populate("instructor", "name email")
            .lean();

        // Enrich with enrollment and lesson counts
        const enrichedCourses = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = await Enrollment.countDocuments({course:course._id});
                const lessonCount = await Lesson.countDocuments({course:course._id});
                const avgProgress = await getAverageProgress(course._id);

                return {
                    ...course,
                    enrollmentCount,
                    lessonCount,
                    avgProgress
                };
            })
        );

        // Sort by enrollment count and get top
        const topCourses = enrichedCourses
            .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
            .slice(0, limitNum);

        return res.status(200).json({
            topCourses
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch top courses",error:error.message});
    }
}

// Get trending courses (by recent enrollments)
export const getTrendingCourses = async(req,res)=>{
    try{
        const {limit = 5, days = 30} = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 5));
        const daysNum = parseInt(days) || 30;

        // Get recent enrollments
        const cutoffDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);
        const recentEnrollments = await Enrollment.find({
            enrolledAt: {$gte: cutoffDate}
        }).distinct("course");

        // Get those courses
        const trendingCourses = await Course.find({_id: {$in: recentEnrollments}})
            .populate("instructor", "name email")
            .lean();

        // Enrich with data
        const enriched = await Promise.all(
            trendingCourses.map(async (course) => {
                const enrollmentCount = await Enrollment.countDocuments({
                    course:course._id,
                    enrolledAt: {$gte: cutoffDate}
                });
                const lessonCount = await Lesson.countDocuments({course:course._id});

                return {
                    ...course,
                    recentEnrollments: enrollmentCount,
                    totalLessons: lessonCount
                };
            })
        );

        // Sort by recent enrollments
        const sorted = enriched
            .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
            .slice(0, limitNum);

        return res.status(200).json({
            trendingCourses: sorted,
            period: `Last ${daysNum} days`
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch trending courses",error:error.message});
    }
}

// Helper function to get average progress
async function getAverageProgress(courseId){
    const enrollments = await Enrollment.find({course:courseId});
    if(enrollments.length === 0) return 0;
    const avgProg = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length;
    return Math.round(avgProg);
}