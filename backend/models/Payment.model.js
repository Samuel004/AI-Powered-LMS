import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({

    amount : Number,

    user: {type:mongoose.Schema.Types.ObjectId, ref:"User"},

    course: {type: mongoose.Schema.Types.ObjectId, ref:"Course"},

    paymentId: String,
    
    stripePaymentIntentId: String,
    
    currency: { type: String, default: "usd" },

    status: {type: String,
        enum: ["pending","completed","failed"],
        default: "pending"
    },
    
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: "Enrollment" },
    
    completedAt: Date,
    
    createdAt: {type:Date,default:Date.now}


});

const Payment = mongoose.model("Payment",paymentSchema);

export default Payment;
