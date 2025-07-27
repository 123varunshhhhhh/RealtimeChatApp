import jwt from "jsonwebtoken"
const isAuth=async (req,res,next)=>{
    try {
        let token=req.cookies.token
        if(!token){
            return res.status(400).json({message:"token is not found"})
        }

        if (!process.env.JWT_SECRET) {
            console.log("JWT_SECRET is not defined");
            return res.status(500).json({message:"Server configuration error"})
        }

        let verifyToken=  jwt.verify(token,process.env.JWT_SECRET)
        req.userId=verifyToken.userId
        next()


    } catch (error) {
        console.log("Auth middleware error:", error.message)
        if (error.name === 'JsonWebTokenError') {
            return res.status(400).json({message:"Invalid token"})
        } else if (error.name === 'TokenExpiredError') {
            return res.status(400).json({message:"Token expired"})
        }
        return res.status(500).json({message:`Auth error: ${error.message}`})
    }
}

export default isAuth