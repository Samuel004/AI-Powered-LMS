import jwt from "jsonwebtoken";

export const protectRoute = async(req,res,next)=> {
    
    const token =  req.cookies?.jwt;

        if(!token) {
            return res.status(401).json({message:"No token!"})
        }
    
    try{

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        
        next();
    }catch(err){
        console.log("JWT Error:",err.message);
        return res.status(401).json({message:"Invalid token!"});
    }
};

export const isInstructor = (req, res, next) => {
    if (req.user && req.user.role === "instructor") {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Instructor role required." });
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }
    return res.status(403).json({ message: "Access denied. Admin role required." });
};
