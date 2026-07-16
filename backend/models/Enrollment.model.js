import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    student : { type: mongoose.Schema.Types.ObjectId, ref: "User"},
    course : {type: mongoose.Schema.Types.ObjectId, ref: "Course"},
    progress :{ type: Number, default: 0 },
    completedLessons : {type:Number, default: 0},
    enrolledAt: { type: Date, default: Date.now }
});

const Enrollment = mongoose.model("Enrollment",enrollmentSchema);

export default Enrollment;
