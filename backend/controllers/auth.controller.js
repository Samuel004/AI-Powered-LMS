import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";

export const signup = async(req,res) => {

    const { name,email,pass } = req.body;

    try{

        if(!name ||!email ||!pass){
            return res.status(400).json({message:"Please fill out all the fields!"});
        }
        if(pass.length < 10){
            return res.status(400).json({message:"Password must have atleast 10 characters!"});
        }

        const existingUser = await User.findOne({email})
        if(existingUser) return res.status(400).json({message:"Email already exists!"});

        const salt  = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(pass,salt);

        

        const newUser = await User.create({
            name,
            email,
            password:hashedPassword
        });

        res.status(201).json({message:"User has been created Successfully!"});

    }catch(err){
        res.status(500).json({message:err.message});
    }
};

export const login = async(req,res) => {
    try{
        const { email , pass} = req.body;

        if(!email) return res.status(404).json({message:"Enter your Email!!"});
        if(!pass) return res.status(404).json({message:"Enter your password!!"});

        const user = await User.findOne({email})

        if(!user) return res.status(404).json({message:"User not Found!!"});

        const isMatch = await bcrypt.compare(pass,user.password)

        if(!isMatch) return res.status(400).json({message:"Invalid Password!"});


        generateToken(user,res);
        res.json({message:" Logged in Successfully!"});

    }catch(err){
        res.status(500).json({message:err.message});
    }
};

export const logout = (req,res)=>{
    try{
        
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });


        res.status(200).json({message:"Logged out Successfully!"});
    }catch(err){
        console.log("Error",err.message);
        res.status(500).json({message:"Server Error!"});
    }
} 

export const checkAuth = (req,res)=> {
    try{
        res.status(200).json(req.user);
    }catch(err){
        console.log("Error while checking Auth");
        console.log("Error:",err.message);
        return res.status(500).json({message:"Server Error!"});
    }
}