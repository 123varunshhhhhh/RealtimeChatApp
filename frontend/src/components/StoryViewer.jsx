// src/components/StoryViewer.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { serverUrl } from '../main';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseCircleOutline } from "react-icons/io5";
import { RiEmojiStickerLine } from "react-icons/ri";
import EmojiPicker from 'emoji-picker-react';
import dp from '../assets/dp.webp';

const StoryViewer = ({ story, onClose, userId }) => {
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [reactionInput, setReactionInput] = useState('');
    const [showViewersList, setShowViewersList] = useState(false);
    const [viewers, setViewers] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    const videoRef = useRef(null);

    // Initial check for story data
    if (!story || !story.mediaUrl || !story.mediaType || !story.userId) {
        console.error("StoryViewer: Incomplete story data received, closing viewer.", story);
        return null;
    }

    // Timer for story progression (No changes needed here)
    useEffect(() => {
        if (isPaused) {
            return;
        }
        const duration = story.mediaType === 'image' ? 7000 : null;
        let timer;
        if (duration) {
            timer = setInterval(() => {
                setProgress((prev) => {
                    const newProgress = prev + (100 / (duration / 20));
                    if (newProgress >= 100) {
                        clearInterval(timer);
                        setTimeout(() => onClose(), 0);
                        return 100;
                    }
                    return newProgress;
                });
            }, 20);
        } else {
            setProgress(0);
            if (videoRef.current) {
                if (isPaused) {
                    videoRef.current.pause();
                } else {
                    videoRef.current.play().catch(e => console.error("Video play error:", e));
                }
            }
        }
        return () => clearInterval(timer);
    }, [story, isPaused, onClose]);

    // Mark story as seen (No changes needed here)
    useEffect(() => {
        const hasSeen = story.seenBy && story.seenBy.includes(userId);
        if (story && userId && !hasSeen) {
            const markAsSeen = async () => {
                try {
                    await axios.post(`${serverUrl}/api/story/view/${story._id}`, {}, { withCredentials: true });
                } catch (err) {
                    console.error("Error marking story as seen:", err);
                }
            };
            markAsSeen();
        }
    }, [story, userId]);

    // Fetch viewers (No changes needed here)
    useEffect(() => {
        if (story && userId && story.userId._id === userId && showViewersList) {
            const fetchViewers = async () => {
                try {
                    const { data } = await axios.get(`${serverUrl}/api/story/${story._id}/viewers`, { withCredentials: true });
                    setViewers(data.viewers);
                } catch (err) {
                    console.error("Error fetching story viewers:", err);
                    setViewers([]);
                }
            };
            fetchViewers();
        }
    }, [story, userId, showViewersList]);

    const handleVideoEnded = () => {
        setTimeout(() => onClose(), 0);
    };

    const togglePause = (e) => {
        // This check is good for the main click on the story content
        if (e.target.closest('.reaction-area') || e.target.closest('.viewers-area') || e.target.closest('.story-controls') || e.target.closest('.emoji-picker-react')) {
            return;
        }
        setIsPaused((prev) => {
            const newState = !prev;
            if (story.mediaType === 'video' && videoRef.current) {
                if (newState) {
                    videoRef.current.pause();
                } else {
                    videoRef.current.play().catch(e => console.error("Video play error:", e));
                }
            }
            return newState;
        });
    };

    // Reaction Logic (No changes needed here)
    const handleAddReaction = async (emoji) => {
        try {
            await axios.post(`${serverUrl}/api/story/${story._id}/react`, { emoji }, { withCredentials: true });
            // Send a message to the story owner with a reference to the story and the emoji
            if (story.userId && userId !== story.userId._id) {
                let messageText = `reacted to your story: ${emoji}`;
                if (story.caption) {
                    messageText += `\nCaption: ${story.caption}`;
                }
                // Optionally, you could add a thumbnail or link here
                await axios.post(`${serverUrl}/api/message/send/${story.userId._id}`,
                    {
                        message: messageText,
                        image: story.mediaUrl ? `${serverUrl}${story.mediaUrl}` : undefined,
                        caption: story.caption || undefined
                    },
                    { withCredentials: true }
                );
            }
            setReactionInput('');
            setShowPicker(false);
        } catch (error) {
            console.error("Failed to add reaction or send chat message:", error);
        }
    };

    const handleReactionInputChange = (e) => {
        setReactionInput(e.target.value);
    };

    const handleReactionSubmit = (e) => {
        e.preventDefault();
        if (reactionInput.trim()) {
            handleAddReaction(reactionInput.trim());
        }
    };

    const onEmojiClick = (emojiObject) => {
        setReactionInput(prevInput => prevInput + emojiObject.emoji);
        // setShowPicker(false);
    };

    // "Who Viewed Your Story" Logic (No changes needed here)
    const isMyStory = story && userId && story.userId._id === userId;
    const handleToggleViewersList = (e) => {
        e.stopPropagation();
        setShowViewersList(prev => !prev);
    };


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={togglePause} // Main click handler for pause/play
        >
            {/* Progress Bar at the top */}
            <div className="absolute top-4 left-0 right-0 p-4 z-10 story-controls">
                <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.02, ease: "linear" }}
                        style={{ width: `${progress}%` }}
                    ></motion.div>
                </div>
            </div>

            {/* User Info (Creator of the story) */}
            <div className="absolute top-8 left-4 flex items-center gap-3 z-10 story-controls">
                <img
                    src={story.userId?.image || dp}
                    alt={story.userId?.name || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <span className="text-white font-semibold text-lg">{story.userId?.name?.split(' ')[0] || 'User'}</span>
            </div>

            {/* Story Content (Image/Video) */}
            <div className="relative w-full h-full flex items-center justify-center">
                {story.mediaType === 'video' ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        controls={false}
                        className="w-full h-full object-contain"
                        onEnded={handleVideoEnded}
                        loop={false}
                        src={`${serverUrl}${story.mediaUrl}`}
                        onError={(e) => { console.error("Video load error:", e.target.error, story.mediaUrl); e.target.src = ''; }}
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <img
                        src={`${serverUrl}${story.mediaUrl}`}
                        alt="Story"
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.onerror = null; e.target.src = dp; console.error("Image load error:", story.mediaUrl); }}
                    />
                )}
            </div>

            {/* Caption (optional) */}
            <AnimatePresence>
                {story.caption && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-28 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center backdrop-blur-sm story-controls"
                    >
                        <p className="text-sm md:text-base">{story.caption}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // *** FIX for X button - IMPORTANT ***
                    onClose();
                }}
                className="absolute top-6 right-6 text-white text-4xl z-20 hover:text-gray-300 transition-colors story-controls"
                title="Close Story"
            >
                <IoCloseCircleOutline />
            </button>

            {/* Pause/Play Indicator */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="text-white text-6xl"
                        >
                            ⏸️
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Reaction and Viewers Area --- */}
            <div
                className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-60 backdrop-blur-sm z-10 reaction-area"
                onClick={e => e.stopPropagation()} // *** CRITICAL FIX: Stop clicks in this area from propagating ***
            >
                {!isMyStory ? (
                    <div className="relative">
                        <form onSubmit={handleReactionSubmit} className="flex gap-2 items-center">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    value={reactionInput}
                                    onChange={handleReactionInputChange}
                                    onClick={e => e.stopPropagation()} // Already there, but good to reconfirm
                                    placeholder="Type a reaction..."
                                    className="flex-grow w-full p-2 rounded-full bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation(); // *** IMPORTANT: Stop propagation for emoji button ***
                                        setIsPaused(true);
                                        setShowPicker(prev => !prev);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-2xl focus:outline-none"
                                    title="Choose Emoji"
                                >
                                    <RiEmojiStickerLine />
                                </button>
                            </div>
                            <button
                                type="submit"
                                onClick={e => e.stopPropagation()} // Already there, but good to reconfirm
                                className="bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600 transition-colors"
                            >
                                Send
                            </button>
                        </form>

                        {/* Emoji Picker */}
                        <AnimatePresence>
                            {showPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-0 mb-2 z-20"
                                    onClick={e => e.stopPropagation()} // Already there, but good to reconfirm
                                >
                                    <EmojiPicker
                                        onEmojiClick={onEmojiClick}
                                        theme="dark"
                                        searchDisabled={false}
                                        skinTonePickerLocation="PREVIEW"
                                        height={300}
                                        width={300}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <button
                        onClick={handleToggleViewersList}
                        className="w-full bg-gray-700 text-white py-2 rounded-full flex items-center justify-center gap-2 hover:bg-gray-600 transition-colors viewers-area"
                    >
                        <span className="text-lg">👀</span>
                        <span className="font-semibold">{story.seenBy?.length || 0} Views</span>
                    </button>
                )}
            </div>

            {/* --- Who Viewed Your Story Modal --- */}
            <AnimatePresence>
                {showViewersList && isMyStory && (
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 rounded-t-2xl z-[101] max-h-[60vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()} // Already there, but good to reconfirm
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Viewers ({viewers.length})</h3>
                            <button
                                onClick={() => setShowViewersList(false)}
                                className="text-gray-400 hover:text-white text-3xl"
                            >
                                <IoCloseCircleOutline />
                            </button>
                        </div>
                        {viewers.length === 0 ? (
                            <p className="text-gray-400 text-center">No one has viewed this story yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {viewers.map((viewer) => (
                                    <li key={viewer._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors">
                                        <img
                                            src={viewer.image || dp}
                                            alt={viewer.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <span className="font-medium">{viewer.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StoryViewer;