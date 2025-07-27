// src/components/StoryFeed.jsx
import React, { useEffect, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import dp from '../assets/dp.webp';
import { serverUrl } from '../main';
import { motion } from 'framer-motion';
import StoryViewer from './StoryViewer';

const StoryFeed = forwardRef(({ onStoryClick, currentUserId }, ref) => {
    const [groupedStories, setGroupedStories] = useState({});
    const [loading, setLoading] = useState(true);
    // Remove selectedStory state

    const fetchStories = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${serverUrl}/api/story/feed`, {
                withCredentials: true,
            });

            const storyData = Array.isArray(data?.stories) ? data.stories : [];

            const activeStories = storyData.filter(story =>
                new Date(story.expiresAt) > new Date()
            );

            const newGroupedStories = {};
            activeStories.forEach(story => {
                const userId = story.userId._id;
                if (!newGroupedStories[userId] || new Date(story.createdAt) > new Date(newGroupedStories[userId].createdAt)) {
                    newGroupedStories[userId] = story;
                }
            });
            setGroupedStories(newGroupedStories);
        } catch (err) {
            console.error("Failed to fetch stories:", err);
            setGroupedStories({});
        } finally {
            setLoading(false);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        fetchStories,
    }));

    useEffect(() => {
        fetchStories();
        const interval = setInterval(fetchStories, 30000); // Keep periodic refresh
        return () => clearInterval(interval);
    }, [fetchStories]);

    const handleStoryClick = (story) => {
        if (onStoryClick) {
            onStoryClick(story);
        }
    };

    // Removed handleStoryUpdated function entirely from StoryFeed,
    // as StoryViewer will no longer trigger direct fetches for 'seen' status.

    const storiesToDisplay = Object.values(groupedStories);

    return (
        <div className="flex space-x-3 py-2 px-2 overflow-x-auto scrollbar-hide">
      {loading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-600 animate-pulse" />
            <div className="w-12 h-3 bg-gray-500 rounded animate-pulse" />
          </div>
        ))
      ) : storiesToDisplay.length === 0 ? (
        <p className="text-gray-400 text-sm ml-2">No active stories from others.</p>
      ) : (
        storiesToDisplay.map((story) => (
          <motion.div
            key={story.userId._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer"
            onClick={() => handleStoryClick(story)}
          >
            <div className={`w-16 h-16 rounded-full p-[3px] flex items-center justify-center
                ${story.seenBy?.includes(currentUserId)
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-tr from-yellow-400 to-pink-500'
                }
            `}>
              <div className="w-full h-full rounded-full bg-gray-900 overflow-hidden flex items-center justify-center">
                <img
                  src={story.userId?.image || dp}
                  alt={story.userId?.name || 'User'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <span className="text-xs text-gray-200 font-medium truncate w-16 text-center">
              {story.userId?.name?.split(' ')[0] || 'User'}
            </span>
          </motion.div>
        ))
      )}
    </div>
    );
});

export default StoryFeed;