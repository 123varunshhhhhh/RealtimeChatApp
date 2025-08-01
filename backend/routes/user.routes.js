import express from "express";
import { editProfile, getCurrentUser, getOtherUsers, search } from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { uploadSingleImage } from "../middlewares/multer.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);
userRouter.get("/others", isAuth, getOtherUsers);
userRouter.put("/profile", isAuth, uploadSingleImage, editProfile); // Image only
userRouter.get("/search", isAuth, search);

export default userRouter;
