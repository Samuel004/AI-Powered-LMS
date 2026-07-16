import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  thumbnail: String,
  category: String,
  price: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rating: Number,
    comment: String
  }],
  createdAt: { type: Date, default: Date.now }
});




const Course = mongoose.model("Course",courseSchema)

export default Course;