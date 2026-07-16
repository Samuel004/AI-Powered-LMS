import dotenv from "dotenv";
import Lesson from "../models/Lesson.model.js";
import Course from "../models/Course.model.js";
import Enrollment from "../models/Enrollment.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

// Generate AI notes from lesson content
export const generateNotes = async(req,res)=>{
    try{
        const {lessonId} = req.params;
        const {tone = "professional"} = req.body;

        // Get lesson details
        const lesson = await Lesson.findById(lessonId).populate("course");
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!!"});
        }

        // Verify student is enrolled or is instructor
        const studentId = req.user.userId;
        const course = lesson.course;
        
        const enrolled = await Enrollment.findOne({student:studentId, course:lesson.course._id});
        if(!enrolled && course.instructor.toString() !== studentId.toString()){
            return res.status(403).json({message:"Access denied!!"});
        }

        // Generate notes using Gemini
        const prompt = `
You are an educational content expert. Generate comprehensive study notes for the following lesson.
Make the notes clear, well-structured, and easy to understand.
Use bullet points, headings, and summaries where appropriate.
Tone: ${tone}

Lesson Title: ${lesson.title}
Video URL: ${lesson.videoUrl}
Duration: ${lesson.duration} minutes
Resources: ${lesson.resources.join(", ") || "None"}

Based on this lesson information, create detailed study notes that would help a student understand and retain the key concepts.
Include:
1. Key Concepts
2. Important Points
3. Summary
4. Tips for Learning
5. Practice Questions (3-5 questions)

Format the response in clear markdown.
        `;

        const result = await model.generateContent(prompt);
        const notes = result.response.text();

        return res.status(200).json({
            lessonId,
            lessonTitle: lesson.title,
            notes,
            generatedAt: new Date(),
            tone
        });

    }catch(error){
        console.error("AI Error:", error);
        return res.status(500).json({message:"Failed to generate notes", error:error.message});
    }
}

// Generate AI quiz from lesson content
export const generateQuiz = async(req,res)=>{
    try{
        const {lessonId} = req.params;
        const {numQuestions = 5, questionTypes = ["mcq", "true-false", "short-answer"]} = req.body;

        // Get lesson
        const lesson = await Lesson.findById(lessonId).populate("course");
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!!"});
        }

        // Verify access
        const studentId = req.user.userId;
        const enrolled = await Enrollment.findOne({student:studentId, course:lesson.course._id});
        if(!enrolled && lesson.course.instructor.toString() !== studentId.toString()){
            return res.status(403).json({message:"Access denied!!"});
        }

        // Validate inputs
        const num = Math.min(20, Math.max(1, parseInt(numQuestions) || 5));
        const types = Array.isArray(questionTypes) ? questionTypes : ["mcq"];

        const typesList = types.join(", ");

        // Generate quiz using Gemini
        const prompt = `
You are an expert quiz creator. Generate a quiz based on the following lesson.
The quiz should test comprehension and learning of the key concepts.

Lesson Title: ${lesson.title}
Duration: ${lesson.duration} minutes
Number of Questions: ${num}
Question Types: ${typesList}

Generate ${num} questions in the following format:
For MCQ (Multiple Choice):
{
  "type": "mcq",
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this is correct"
}

For True/False:
{
  "type": "true-false",
  "question": "Statement here?",
  "correctAnswer": true,
  "explanation": "Explanation"
}

For Short Answer:
{
  "type": "short-answer",
  "question": "Question here?",
  "keywords": ["keyword1", "keyword2"],
  "explanation": "Sample answer"
}

Return ONLY valid JSON array with ${num} questions. No markdown, no explanation outside JSON.
Make questions progressively harder. Mix all question types.
        `;

        const result = await model.generateContent(prompt);
        let quizText = result.response.text();
        
        // Clean response - remove markdown formatting if present
        quizText = quizText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let quiz;
        try {
            quiz = JSON.parse(quizText);
        } catch(e) {
            // Try to extract JSON from the response
            const jsonMatch = quizText.match(/\[[\s\S]*\]/);
            if(jsonMatch){
                quiz = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Could not parse quiz JSON");
            }
        }

        return res.status(200).json({
            lessonId,
            lessonTitle: lesson.title,
            quiz: Array.isArray(quiz) ? quiz : [quiz],
            totalQuestions: (Array.isArray(quiz) ? quiz : [quiz]).length,
            generatedAt: new Date()
        });

    }catch(error){
        console.error("AI Error:", error);
        return res.status(500).json({message:"Failed to generate quiz", error:error.message});
    }
}

// AI Tutor - Chat with AI about course content
export const aiTutor = async(req,res)=>{
    try{
        const {courseId} = req.params;
        const {message, conversationHistory = []} = req.body;

        if(!message || message.trim() === ""){
            return res.status(400).json({message:"Message cannot be empty!!"});
        }

        // Get course
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message:"Course not found!!"});
        }

        // Verify enrollment
        const studentId = req.user.userId;
        const enrolled = await Enrollment.findOne({student:studentId, course:courseId});
        if(!enrolled && course.instructor.toString() !== studentId.toString()){
            return res.status(403).json({message:"Access denied!!"});
        }

        // Get lessons for context
        const lessons = await Lesson.find({course:courseId}).select("title order");
        const lessonsContext = lessons.map(l => `${l.order}. ${l.title}`).join("\n");

        // Build conversation history for context
        const conversationContext = conversationHistory
            .slice(-10) // Last 10 messages for context
            .map(msg => `${msg.role === "student" ? "Student" : "Tutor"}: ${msg.text}`)
            .join("\n");

        const systemPrompt = `
You are an expert tutor helping a student learn about the course: "${course.title}"

Course Description: ${course.description}

Course Lessons:
${lessonsContext}

Your role:
- Answer questions about the course content
- Explain concepts clearly
- Provide examples
- Give study tips
- Encourage learning
- Be supportive and patient

Keep responses concise but informative (2-3 paragraphs max).
If asked about topics outside this course, politely redirect to course content.

Previous conversation:
${conversationContext}
        `;

        // Generate response using Gemini
        const prompt = `${systemPrompt}\n\nStudent: ${message}`;

        const result = await model.generateContent(prompt);
        const tutorResponse = result.response.text();

        // Update conversation history
        const updatedHistory = [
            ...conversationHistory,
            {role: "student", text: message},
            {role: "tutor", text: tutorResponse}
        ];

        return res.status(200).json({
            courseId,
            courseName: course.title,
            studentMessage: message,
            tutorResponse,
            conversationHistory: updatedHistory.slice(-20), // Keep last 20 messages
            generatedAt: new Date()
        });

    }catch(error){
        console.error("AI Error:", error);
        return res.status(500).json({message:"Failed to get tutor response", error:error.message});
    }
}

// Get AI content (retrieve previously generated notes/quizzes)
export const getAiContent = async(req,res)=>{
    try{
        const {lessonId} = req.params;
        const {type = "all"} = req.query; // all, notes, quiz

        const lesson = await Lesson.findById(lessonId);
        if(!lesson){
            return res.status(404).json({message:"Lesson not found!!"});
        }

        // For now, return info that content can be generated
        // In production, you'd store and retrieve from database
        return res.status(200).json({
            lessonId,
            lessonTitle: lesson.title,
            availableContent: {
                notes: "Can be generated with generateNotes endpoint",
                quiz: "Can be generated with generateQuiz endpoint"
            },
            message: "Use specific endpoints to generate AI content"
        });

    }catch(error){
        return res.status(500).json({message:"Failed to fetch AI content", error:error.message});
    }
}

// Check AI API health
export const checkAiHealth = async(req,res)=>{
    try{
        // Test Gemini API connection
        const testPrompt = "Say 'AI is ready' in one sentence.";
        const result = await model.generateContent(testPrompt);
        const response = result.response.text();

        return res.status(200).json({
            status: "healthy",
            model: "gemini-3.5-flash",
            apiKey: process.env.GEM_API_KEY ? "configured" : "missing",
            response: response.substring(0, 100) // First 100 chars
        });

    }catch(error){
        return res.status(500).json({
            status: "error",
            message: "AI service unavailable",
            error: error.message
        });
    }
}
