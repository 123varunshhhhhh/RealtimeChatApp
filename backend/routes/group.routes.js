import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  createGroup,
  addGroupMember,
  removeGroupMember,
  updateGroupInfo,
  getUserGroups
} from "../controllers/group.controllers.js";
import { uploadSingleImage } from "../middlewares/multer.js";

const groupRouter = express.Router();

groupRouter.post("/create", isAuth, uploadSingleImage, createGroup);
groupRouter.post("/add-member", isAuth, addGroupMember);
groupRouter.post("/remove-member", isAuth, removeGroupMember);
groupRouter.put("/update", isAuth, uploadSingleImage, updateGroupInfo);
groupRouter.get("/my-groups", isAuth, getUserGroups);

export default groupRouter; 