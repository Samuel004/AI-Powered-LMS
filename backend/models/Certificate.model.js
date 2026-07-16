import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  certificateNumber: { type: String, unique: true },
  issuedDate: { type: Date, default: Date.now },
  completionDate: Date,
  
  pdfUrl: String,
  
  grade: String,
  score: Number,
  
  status: { type: String, enum: ["pending", "issued", "revoked"], default: "pending" },
  
  createdAt: { type: Date, default: Date.now }
});

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
