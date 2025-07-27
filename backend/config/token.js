import jwt from "jsonwebtoken"

const genToken=async (userId)=>{
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined");
        }
        const token=await jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:"7d"})
        return token
    } catch (error) {
        console.log("gen token error:", error.message)
        throw error
    }
}

export default genToken