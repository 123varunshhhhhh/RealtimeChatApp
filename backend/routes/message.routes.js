import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { uploadFields } from "../middlewares/multer.js"; // ✅ CORRECT
import Message from "../models/message.model.js";

import {
  sendMessage,
  getMessages,
  updateMessageStatus,
  markMessageAsSeen,
  addReaction,
  deleteMessage,
  getConversationsWithUnread,
} from "../controllers/message.controllers.js";

const messageRouter = express.Router();

// ✅ File upload middleware supports image/audio
messageRouter.post(
  "/send/:receiver",
  isAuth,
  uploadFields,
  sendMessage
);

messageRouter.post("/send-group/:groupId", isAuth, uploadFields, sendMessage);
messageRouter.get("/group/:groupId", isAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("❌ get group messages error:", error);
    res.status(500).json({ message: `get group messages error ${error}` });
  }
});

messageRouter.get("/get/:receiver", isAuth, getMessages);
messageRouter.put("/status", isAuth, updateMessageStatus);
messageRouter.put("/seen", isAuth, markMessageAsSeen);
messageRouter.put("/reaction", isAuth, addReaction);
messageRouter.delete("/delete", isAuth, deleteMessage);
messageRouter.get("/conversations-with-unread", isAuth, getConversationsWithUnread);

// Mark group messages as read
messageRouter.post("/mark-group-read", isAuth, async (req, res) => {
  try {
    const { groupId, messageIds } = req.body;
    const userId = req.userId;
    
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        groupId: groupId,
        sender: { $ne: userId },
        $or: [
          { seenBy: { $exists: false } },
          { seenBy: { $ne: userId } }
        ]
      },
      { 
        $addToSet: { seenBy: userId },
        status: "seen"
      }
    );
    
    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("❌ mark group read error:", error);
    res.status(500).json({ message: `mark group read error ${error}` });
  }
});

export default messageRouter;
