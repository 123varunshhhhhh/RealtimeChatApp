// backend/routes/story.routes.js
import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import { uploadStoryMedia } from '../middlewares/multer.js';
import {
    uploadStory,
    getStoryFeed,
    viewStory,
    getMyStory,
    addStoryReaction,
    getStoryViewers // ✅ Import the new function
} from '../controllers/story.controller.js';

const router = express.Router();

// POST /api/story/upload - Upload new story
router.post(
    '/upload',
    isAuth,
    uploadStoryMedia,
    uploadStory
);

// GET /api/story/feed - Get active stories (excluding current user's)
router.get(
    '/feed',
    isAuth,
    getStoryFeed
);

// GET /api/story/my-story - Get the logged-in user's own active story
router.get(
    '/my-story',
    isAuth,
    getMyStory
);

// POST /api/story/view/:storyId - Mark story as viewed
router.post(
    '/view/:storyId',
    isAuth,
    viewStory
);

// POST /api/story/:storyId/react - Add a reaction to a story
router.post(
    '/:storyId/react', // Route will be like /api/story/:storyId/react
    isAuth,
    addStoryReaction
);

// NEW: GET /api/story/:storyId/viewers - Get users who viewed a specific story
router.get(
    '/:storyId/viewers',
    isAuth,
    getStoryViewers
);

export default router;