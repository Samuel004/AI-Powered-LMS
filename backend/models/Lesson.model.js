import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title:{ type: String, required: true },
  videoUrl: {type:String},
  resources: [{
    url: String,
    fileName: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  duration: Number,
  order:  Number, 
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model("Lesson",lessonSchema);

export default Lesson;
