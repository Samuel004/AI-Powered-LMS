export const isInstructor = (req,res,next) =>{
    if (req.user?.role !== "instructor"){
        return res.status(403).json({message:"Instructor Access Only!!"});
    }
    next();
}

export const isAdmin = (req,res,next) =>{
    if (req.user?.role !=="admin"){
        return res.status(403).json({message:"Admin Access Only!!"});
    }
    next();
};