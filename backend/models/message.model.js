import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Not required for group messages
  },
  message: {
    type: String,
    default: ""
  },
  caption: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    default: ""
  },
  audio: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    emoji: {
      type: String,
      required: true
    }
  }],
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null
  }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;