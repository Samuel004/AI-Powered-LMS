import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  
  submittedAt: { type: Date, default: Date.now },
  
  attachments: [String], // URLs to submission files
  content: String,
  
  status: { type: String, enum: ["submitted", "graded", "late"], default: "submitted" },
  
  grade: Number,
  feedback: String,
  
  gradedAt: Date,
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model("Submission", submissionSchema);

export default Submission;
