// backend/controllers/story.controller.js

import Story from "../models/story.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST: Upload new story
export const uploadStory = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No media file provided"
            });
        }

        const relativePath = path.relative(path.join(__dirname, '../'), req.file.path).replace(/\\/g, '/');

        const newStory = new Story({
            userId: req.userId,
            mediaUrl: `/${relativePath}`,
            mediaType: req.file.mimetype.startsWith('image') ? 'image' : 'video',
            caption: req.body.caption || '',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        await newStory.save();

        res.status(201).json({
            success: true,
            story: await Story.populate(newStory, {
                path: 'userId',
                select: 'name image'
            })
        });

    } catch (error) {
        // Delete file if error occurs
        if (req.file) fs.unlink(req.file.path, () => {});

        res.status(500).json({
            success: false,
            message: "Story upload failed",
            error: error.message
        });
    }
};

// GET: Fetch active stories for the feed (other users' stories)
export const getStoryFeed = async (req, res) => {
    try {
        // Exclude the current user's stories from the main feed if you want to show 'My Story' separately
        const stories = await Story.find({
            userId: { $ne: req.userId }, // Exclude current user's stories
            expiresAt: { $gt: new Date() }
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name image')
            .lean();

        res.status(200).json({
            success: true,
            stories: stories.map(story => ({
                ...story,
                // Ensure mediaUrl is correctly formatted for client
                mediaUrl: story.mediaUrl.startsWith('/uploads') ? story.mediaUrl : `/uploads/${story.mediaUrl}`
            }))
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch stories",
            error: error.message
        });
    }
};

// GET: Fetch the logged-in user's own active story
export const getMyStory = async (req, res) => {
    try {
        const userId = req.userId; // Assuming req.userId is set by your isAuth middleware

        const story = await Story.findOne({
            userId: userId,
            expiresAt: { $gt: new Date() } // Only fetch active stories
        }).populate('userId', 'name image');

        if (!story) {
            return res.status(200).json({
                success: true,
                story: null, // Explicitly return null if no story found
                message: "No active story found for this user."
            });
        }

        // Ensure mediaUrl is correctly formatted
        const formattedStory = {
            ...story.toObject(),
            mediaUrl: story.mediaUrl.startsWith('/uploads') ? story.mediaUrl : `/uploads/${story.mediaUrl}`
        };

        res.status(200).json({
            success: true,
            story: formattedStory
        });

    } catch (error) {
        console.error("Error fetching user's own story:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user's story.",
            error: error.message
        });
    }
};

// POST: View a story (mark as seen)
export const viewStory = async (req, res) => {
    try {
        const story = await Story.findByIdAndUpdate(
            req.params.storyId,
            { $addToSet: { seenBy: req.userId } }, // Use $addToSet to avoid duplicate entries for the same user
            { new: true }
        ).populate('userId', 'name image');

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found"
            });
        }

        res.status(200).json({
            success: true,
            story
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to view story",
            error: error.message
        });
    }
};


// NEW: POST: Add a reaction to a story
export const addStoryReaction = async (req, res) => {
    try {
        const { storyId } = req.params;
        const { emoji } = req.body; // Expecting the emoji string from the frontend
        const userId = req.userId; // Set by isAuth middleware

        if (!emoji) {
            return res.status(400).json({
                success: false,
                message: "Emoji reaction is required."
            });
        }

        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found."
            });
        }

        // Check if the user has already reacted to this story
        const existingReactionIndex = story.reactions.findIndex(
            (reaction) => reaction.userId.toString() === userId.toString()
        );

        if (existingReactionIndex > -1) {
            // If an existing reaction from this user is found, update it
            story.reactions[existingReactionIndex].emoji = emoji;
            story.reactions[existingReactionIndex].createdAt = new Date(); // Update timestamp
        } else {
            // Otherwise, add a new reaction
            story.reactions.push({ userId, emoji });
        }

        await story.save();

        // Optionally populate the user info for the reaction to send back to frontend
        // This is important if your frontend wants to display details of who reacted without another API call.
        await story.populate('reactions.userId', 'name image');

        res.status(200).json({
            success: true,
            message: "Reaction added successfully.",
            story // Return the updated story, including reactions
        });

    } catch (error) {
        console.error("Error adding story reaction:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add story reaction.",
            error: error.message
        });
    }
};

// NEW: GET: Fetch users who viewed a specific story
export const getStoryViewers = async (req, res) => {
    try {
        const { storyId } = req.params;
        const userId = req.userId; // Current logged-in user

        const story = await Story.findById(storyId).populate('seenBy', 'name image'); // Populate user details

        if (!story) {
            return res.status(404).json({
                success: false,
                message: "Story not found."
            });
        }

        // IMPORTANT: Only allow the story owner to see the viewers list
        if (story.userId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this story's viewers."
            });
        }

        res.status(200).json({
            success: true,
            viewers: story.seenBy
        });

    } catch (error) {
        console.error("Error fetching story viewers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch story viewers.",
            error: error.message
        });
    }
};