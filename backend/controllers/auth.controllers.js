import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import nodemailer from "nodemailer";
import crypto from "crypto";

// Utility to send email
const sendEmail = async (to, subject, text) => {
  console.log("Email config:", {
    user: process.env.EMAIL_USER,
    passLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    passFirst4: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) : "NONE"
  });
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials not configured");
  }
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
  } catch (error) {
    console.error("Email send error:", error);
    throw error;
  }
};

export const signUp=async (req,res)=>{
   try {
    const {userName,email,password}=req.body
    const checkUserByUserName=await User.findOne({userName})
    if(checkUserByUserName){
        return res.status(400).json({message:"userName already exist"})
    }
    const checkUserByEmail=await User.findOne({email})
    if(checkUserByEmail){
        return res.status(400).json({message:"email already exist"})
    }
if(password.length<6){
    return res.status(400).json({message:"password must be at least 6 characters"})
}

const hashedPassword=await bcrypt.hash(password,10)

const user=await User.create({
    userName,email,password:hashedPassword
})

const token=await genToken(user._id)

   res.cookie("token",token,{
    httpOnly:true,
    maxAge:7*24*60*60*1000,
    sameSite:"Strict",
    secure: process.env.NODE_ENV === "production"
   })

   return res.status(201).json(user)


   } catch (error) {
    return res.status(500).json({message:`signup error ${error}`})
   } 
}
export const login=async (req,res)=>{
    try {
     const {email,password}=req.body
     const user=await User.findOne({email})
     if(!user){
         return res.status(400).json({message:"user does not exist"})
     }

 const isMatch=await bcrypt.compare(password,user.password)
 if(!isMatch){
    return res.status(400).json({message:"incorrect password"})
 }
 
 const token=await genToken(user._id)
 
 res.cookie("token",token,{
     httpOnly:true,
     maxAge:7*24*60*60*1000,
     sameSite:"Strict",
     secure: process.env.NODE_ENV === "production"
    })
 
    return res.status(200).json(user)
 
 
    } catch (error) {
     return res.status(500).json({message:`login error ${error}`})
    } 
 }

 export const logOut=async (req,res)=>{
    try {
        res.clearCookie("token")
        return res.status(200).json({message:"log out successfully"})
    } catch (error) {
        return res.status(500).json({message:`logout error ${error}`})
    }
 }

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();
    await sendEmail(email, "Your OTP for Password Reset", `Your OTP is: ${otp}`);
    return res.status(200).json({ message: "OTP sent to email" });
  } catch (error) {
    return res.status(500).json({ message: `Forgot password error: ${error}` });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: "OTP not requested" });
    }
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.resetPasswordOTPExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    return res.status(200).json({ message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ message: `Verify OTP error: ${error}` });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({ message: "OTP not requested" });
    }
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.resetPasswordOTPExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();
    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: `Reset password error: ${error}` });
  }
};