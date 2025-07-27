import express from "express"
import { login, logOut, signUp, forgotPassword, verifyOTP, resetPassword } from "../controllers/auth.controllers.js"

const authRouter=express.Router()

authRouter.post("/signup",signUp)
authRouter.post("/login",login)
authRouter.get("/logout",logOut)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/verify-otp", verifyOTP)
authRouter.post("/reset-password", resetPassword)

export default authRouter