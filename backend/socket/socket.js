// ✅ socket.js
import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// 🔁 Active user socket mapping
const userSocketMap = {}; // { userId: socketId }
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  const userId = socket.handshake.query?.userId;

  // 🔒 Validate userId before mapping
  if (!userId || userId === "undefined") {
    console.warn(`⚠️ Invalid userId on socket: ${socket.id}`);
    return socket.disconnect(true); // Force disconnect invalid socket
  }

  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ✅ Handle new message
  socket.on("newMessage", async ({ message, conversationId, receiverId }) => {
    const receiverSocket = getReceiverSocketId(receiverId);
    if (receiverSocket) io.to(receiverSocket).emit("newMessage", message);

    const senderSocket = getReceiverSocketId(message.sender);
    if (senderSocket && senderSocket !== socket.id) {
      io.to(senderSocket).emit("newMessage", message);
    }
  });

  // ✅ Handle reactions
  socket.on("addReaction", async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const existingIndex = message.reactions.findIndex(
        (r) => r.userId.toString() === userId
      );

      if (existingIndex > -1) {
        if (message.reactions[existingIndex].emoji === emoji) {
          message.reactions.splice(existingIndex, 1); // Toggle off
        } else {
          message.reactions[existingIndex].emoji = emoji; // Update
        }
      } else {
        message.reactions.push({ userId, emoji });
      }

      await message.save();

      const data = {
        messageId,
        userId,
        emoji,
        reactions: message.reactions,
      };

      [message.sender.toString(), message.receiver.toString()].forEach((id) => {
        const socketId = getReceiverSocketId(id);
        if (socketId) io.to(socketId).emit("reactionAdded", data);
      });
    } catch (err) {
      console.error("❌ Reaction Error:", err);
    }
  });

  // ✅ Handle delete
  socket.on("deleteMessage", async ({ messageId, conversationId, receiverId }) => {
    try {
      const deletedMessage = await Message.findByIdAndDelete(messageId);
      if (deletedMessage) {
        const conversation = await Conversation.findById(conversationId);
        if (
          conversation?.lastMessage?.messageId?.toString() === messageId
        ) {
          const latest = await Message.findOne({ conversationId }).sort({
            createdAt: -1,
          });

          conversation.lastMessage = latest
            ? {
                message:
                  latest.message ||
                  (latest.image
                    ? "Image"
                    : latest.audio
                    ? "Audio"
                    : "Media"),
                senderId: latest.sender,
                messageId: latest._id,
              }
            : null;

          await conversation.save();
        }

        [receiverId, deletedMessage.sender.toString()].forEach((id) => {
          const socketId = getReceiverSocketId(id);
          if (socketId) io.to(socketId).emit("messageDeleted", { messageId });
        });
      }
    } catch (err) {
      console.error("❌ Delete Error:", err);
    }
  });

  // ✅ Handle seen
  socket.on("markMessagesAsSeen", async ({ messageIds, receiverId }) => {
    try {
      const messages = await Message.find({ _id: { $in: messageIds } });
      if (!messages.length) return;

      const senderId = messages[0]?.sender?.toString();

      await Message.updateMany(
        {
          _id: { $in: messageIds },
          seenBy: { $ne: receiverId },
        },
        { $push: { seenBy: receiverId }, status: "seen" }
      );

      const senderSocket = getReceiverSocketId(senderId);
      if (senderSocket && senderId !== receiverId) {
        messageIds.forEach((msgId) => {
          io.to(senderSocket).emit("messageStatusUpdate", {
            messageId: msgId,
            status: "seen",
          });
        });
      }
    } catch (err) {
      console.error("❌ Seen Update Error:", err);
    }
  });

  // Real-time group messaging
  socket.on("sendGroupMessage", async ({ message, groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;
      group.members.forEach(memberId => {
        const socketId = getReceiverSocketId(memberId.toString());
        if (socketId && socketId !== socket.id) {
          io.to(socketId).emit("groupMessage", { groupId, message });
        }
      });
    } catch (err) {
      console.error("❌ Group Message Error:", err);
    }
  });

  // Handle group messages read
  socket.on("groupMessagesRead", async ({ groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;
      
      // Mark all unread messages in the group as read for this user
      await Message.updateMany(
        {
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
      
      // Notify all group members that messages have been read
      group.members.forEach(memberId => {
        const socketId = getReceiverSocketId(memberId.toString());
        if (socketId) {
          io.to(socketId).emit("groupMessagesRead", { groupId });
        }
      });
    } catch (err) {
      console.error("❌ Group Messages Read Error:", err);
    }
  });

  // ✅ Ping listener (optional, for debugging)
  socket.on("ping", () => {
    console.log(`📡 Ping from: ${socket.id}`);
  });

  // ✅ On disconnect
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    const disconnectedId = Object.keys(userSocketMap).find(
      (id) => userSocketMap[id] === socket.id
    );
    if (disconnectedId) delete userSocketMap[disconnectedId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("reject-call", ({ to }) => {
    const receiverSocket = getReceiverSocketId(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit("call-rejected", { from: userId });
    }
  });
});

// ✅ Export everything
export { app, io, server, userSocketMap };
