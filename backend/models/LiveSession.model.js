import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  description: String,
  
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in minutes
  
  status: { type: String, enum: ["scheduled", "active", "completed", "cancelled"], default: "scheduled" },
  
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    joinedAt: Date,
    role: { type: String, enum: ["instructor", "student"], default: "student" }
  }],
  
  messages: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  recordingUrl: String,
  
  createdAt: { type: Date, default: Date.now }
});

const LiveSession = mongoose.model("LiveSession",liveSessionSchema);

export default LiveSession;
