import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  title: { type: String, required: true },
  description: String,
  instructions: String,
  
  dueDate: Date,
  
  totalPoints: { type: Number, default: 100 },
  
  attachments: [String], // URLs to assignment files
  
  createdAt: { type: Date, default: Date.now }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
