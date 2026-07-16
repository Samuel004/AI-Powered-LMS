import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : { type:String,required:true },
    username: { type: String, unique: true, sparse: true },

    email : { type: String, required:true, unique:true},

    password: { type: String, required: true },
    role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },

    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    isSuspended: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
    
});


const User = mongoose.model("User",userSchema);

export default User;