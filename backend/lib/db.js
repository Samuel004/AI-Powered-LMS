import mongoose from "mongoose";

export const connectDB = async(req,res) => {

    try { 
        const con  = await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected Successfully!!",con.connection.host)
    }catch(err){
        console.log("Connection error: ",err);
    }

}

