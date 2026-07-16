import mongoose from "mongoose";

const aiContentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  generatedNotes: String,
  quiz: [
    {
      question: String,
      options: [String],
      answer: String
    }
  ],
  summary: String,
  flashCards: String,
  createdAt: { type: Date, default: Date.now }
});

const AiContent = mongoose.model("AiContent",aiContentSchema);

export default AiContent;
