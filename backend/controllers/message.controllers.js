import uploadOnCloudinary from "../config/cloudinary.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import fs from "fs";
import Conversation from "../models/conversation.model.js";

export const sendMessage = async (req, res) => {
  try {
    const sender = req.userId;
    const { receiver, groupId: groupIdParam } = req.params;
    let { message, image, caption, groupId } = req.body;
    groupId = groupId || groupIdParam; // Use groupId from params if not in body

    let audio;

    if (req.files?.image?.[0]) {
      const path = req.files.image[0].path;
      if (fs.existsSync(path)) {
        image = await uploadOnCloudinary(path);
      }
    }

    if (req.files?.audio?.[0]) {
      const path = req.files.audio[0].path;
      if (fs.existsSync(path)) {
        audio = await uploadOnCloudinary(path);
      }
    }

    const newMessage = await Message.create({
      sender,
      receiver: groupId ? undefined : receiver,
      groupId: groupId || undefined,
      message,
      image: image || image, // use uploaded image or direct URL
      audio,
      caption: caption || "",
      status: "sent",
    });

    if (groupId) {
      // Emit to all group members (handled in socket logic)
      io.emit(`groupMessage:${groupId}`, newMessage);
    } else {
      const receiverSocketId = getReceiverSocketId(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    return res.status(500).json({ message: `send Message error ${error}` });
  }
};

export const getMessages = async (req, res) => {
  try {
    const sender = req.userId;
    const { receiver } = req.params;

    const messages = await Message.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: `get Message error ${error}` });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: `update status error ${error}` });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.userId;

    const updatedMessages = await Promise.all(
      messageIds.map(async (id) => {
        const message = await Message.findById(id);

        if (message && !message.seenBy.includes(userId)) {
          message.seenBy.push(userId);
          message.status = "seen";
          await message.save();
          return message;
        }

        return null;
      })
    );

    return res
      .status(200)
      .json(updatedMessages.filter((msg) => msg !== null));
  } catch (error) {
    return res.status(500).json({ message: `mark as seen error ${error}` });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (reaction) => !reaction.userId.equals(userId)
    );

    // Add new reaction
    message.reactions.push({ userId, emoji });
    await message.save();

    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: `reaction error ${error}` });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.sender.equals(userId)) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: `delete error ${error}` });
  }
};

// Get all 1-1 conversations for the current user, with unread message count for each
export const getConversationsWithUnread = async (req, res) => {
  try {
    const userId = req.userId;
    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      partcipants: userId,
    })
      .populate({
        path: "partcipants",
        select: "_id name image",
      })
      .populate({
        path: "messages",
        select: "sender receiver status seenBy createdAt",
      })
      .sort({ updatedAt: -1 });

    // For each conversation, count unread messages for the current user
    const result = conversations.map((conv) => {
      // Only count messages where receiver is user and not seen
      const unreadCount = conv.messages.filter(
        (msg) =>
          msg.receiver &&
          msg.receiver.toString() === userId.toString() &&
          (!msg.seenBy || !msg.seenBy.includes(userId)) &&
          msg.sender.toString() !== userId.toString()
      ).length;
      // Find the other participant (for sidebar display)
      const otherUser = conv.partcipants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      return {
        conversationId: conv._id,
        user: otherUser,
        lastMessage: conv.messages[conv.messages.length - 1] || null,
        unreadCount,
        updatedAt: conv.updatedAt,
      };
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: `get conversations error ${error}` });
  }
};
