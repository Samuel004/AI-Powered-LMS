import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  type: { type: String, enum: ["course_enrolled", "class_reminder", "assignment_due", "course_completed", "new_message", "grade_posted"], required: true },
  
  title: String,
  message: String,
  
  relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  relatedLiveSession: { type: mongoose.Schema.Types.ObjectId, ref: "LiveSession" },
  
  isRead: { type: Boolean, default: false },
  
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
