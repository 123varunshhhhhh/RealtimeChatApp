// backend/models/story.model.js
import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your User model is named 'User'
      required: true,
    },
    mediaUrl: {
      type: String, // URL or path to the stored image/video
      required: true,
    },
    mediaType: {
      type: String, // 'image' or 'video'
      required: true,
      enum: ["image", "video"],
    },
    caption: {
      type: String,
      default: "",
    },
    // Array of user IDs who have seen this story
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Array of reactions (e.g., emojis)
    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true, // This will be 24 hours from createdAt
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Optional but highly recommended: TTL (Time To Live) index
// This index will automatically delete documents after their expiresAt date passes.
// The 'expireAfterSeconds: 0' means it will delete documents immediately after expiresAt.
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);

export default Story;