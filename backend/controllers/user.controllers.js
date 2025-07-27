import uploadOnCloudinary from "../config/cloudinary.js"
import User from "../models/user.model.js"

export const getCurrentUser=async (req,res)=>{
try {
    let user=await User.findById(req.userId).select("-password")
    if(!user){
        return res.status(400).json({message:"user not found"})
    }

    return res.status(200).json(user)
} catch (error) {
    return res.status(500).json({message:`current user error ${error}`})
}
}

export const editProfile=async (req,res)=>{
    try {
        let {name, about}=req.body
        let image;
        
        // Only try to upload if file exists and Cloudinary is configured
        if(req.file){
            try {
                image=await uploadOnCloudinary(req.file.path)
            } catch (cloudinaryError) {
                console.log("Cloudinary upload failed:", cloudinaryError);
                // Continue without image upload
            }
        }
        
        let updateData = { name };
        if (about !== undefined) updateData.about = about;
        if (image) updateData.image = image;
        
        let user=await User.findByIdAndUpdate(req.userId, updateData, {new:true})

        if(!user){
            return res.status(400).json({message:"user not found"})
        }

        return res.status(200).json(user)
    } catch (error) {
        console.log("Profile update error:", error);
        return res.status(500).json({message:`profile error ${error}`})
    }
}

export const getOtherUsers=async (req,res)=>{
    try {
        let users=await User.find({
            _id:{$ne:req.userId}
        }).select("-password")
        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json({message:`get other users error ${error}`})
    }
}

export const search =async (req,res)=>{
    try {
        let {query}=req.query
        if(!query){
            return res.status(400).json({message:"query is required"})
        }
        let users=await User.find({
            $or:[
                {name:{$regex:query,$options:"i"}},
                {userName:{$regex:query,$options:"i"}},
            ]
        })
        return res.status(200).json(users)
    } catch (error) {
        return res.status(500).json({message:`search users error ${error}`})
    }
}