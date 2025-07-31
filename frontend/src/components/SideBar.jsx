// src/components/SideBar.jsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dp from "../assets/dp.webp";
import { IoIosSearch } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";
import { BiLogOutCircle } from "react-icons/bi";
import { FaComments } from "react-icons/fa";
import { MdGroupAdd } from "react-icons/md";
import { serverUrl } from '../main';
import axios from 'axios';
import { setOtherUsers, setSearchData, setSelectedUser, setUserData, setConversations } from '../redux/userSlice';
import { setGroups, selectGroup } from '../redux/groupSlice';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from 'react-responsive';
import { getSocket } from '../socketService';

// Import the refined Story components
import StoryFeed from './StoryFeed';
import StoryUploader from './StoryUploader';
import StoryViewer from './StoryViewer';
import GroupCreateModal from './GroupCreateModal';
import kiraLogo from "../assets/kira-logo.svg";
import GetConversations from '../customHooks/getConversations';

function SideBar() {
  const { userData, otherUsers, onlineUsers, selectedUser, searchData, conversations } = useSelector((state) => state.user);
  const { groups, selectedGroup } = useSelector((state) => state.group);
  const [searchInput, setSearchInput] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);
  const [userOwnStory, setUserOwnStory] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const storyFeedRef = useRef(null);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  const fetchUserOwnStory = useCallback(async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/story/my-story`, { withCredentials: true });
      const activeStory = response.data?.story && new Date(response.data.story.expiresAt) > new Date()
        ? response.data.story
        : null;
      setUserOwnStory(activeStory);
    } catch (error) {
      console.error("Failed to fetch user's own story:", error);
      setUserOwnStory(null);
    }
  }, []);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      dispatch(setUserData(null));
      dispatch(setOtherUsers(null));
      dispatch(setSelectedUser(null));
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const performSearch = useCallback(async () => {
    if (searchInput.trim()) {
      try {
        const result = await axios.get(`${serverUrl}/api/user/search?query=${searchInput}`, { withCredentials: true });
        dispatch(setSearchData(result.data));
        setShowSearchDropdown(true);
      } catch (error) {
        console.error("Search failed:", error);
        dispatch(setSearchData([]));
      }
    } else {
      setShowSearchDropdown(false);
      dispatch(setSearchData([]));
    }
  }, [searchInput, dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      performSearch();
    }, 300);
    return () => {
      clearTimeout(handler);
    };
  }, [searchInput, performSearch]);

  const handleUserClick = (user) => {
    dispatch(setSelectedUser(user));
    setShowSearchDropdown(false);
    setSearchInput("");
  };

  const handleStoryClick = (story) => {
    setViewingStory(story);
  };

  // 💥 THE CRITICAL CHANGE IS HERE 💥
  const handleCloseStoryViewer = useCallback(() => {
    // Defer ALL state updates to the next event loop tick
    // This ensures StoryViewer has fully unmounted/finished its render cycle
    setTimeout(() => {
      setViewingStory(null); // This state update caused the direct error
      if (storyFeedRef.current && typeof storyFeedRef.current.fetchStories === 'function') {
        storyFeedRef.current.fetchStories(); // This triggers state updates in StoryFeed
      }
      fetchUserOwnStory(); // This triggers state updates in SideBar
    }, 0); // The magic number that defers the execution
  }, [fetchUserOwnStory]); // fetchUserOwnStory is a dependency because it's called inside

  const onUserStoryUploadComplete = useCallback(() => {
    fetchUserOwnStory();
    if (storyFeedRef.current && typeof storyFeedRef.current.fetchStories === 'function') {
      storyFeedRef.current.fetchStories();
    }
  }, [fetchUserOwnStory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (userData?._id) {
      fetchUserOwnStory();
      const ownStoryInterval = setInterval(fetchUserOwnStory, 60000);
      return () => clearInterval(ownStoryInterval);
    }
  }, [userData, fetchUserOwnStory]);

  // Fetch groups
  const fetchGroups = useCallback(async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/group/my-groups`, { withCredentials: true });
      if (response.data.groups) {
        dispatch(setGroups(response.data.groups));
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, [dispatch]);

  // Fetch other users if not already loaded
  const fetchOtherUsers = useCallback(async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/user/others`, { withCredentials: true });
      dispatch(setOtherUsers(response.data));
    } catch (error) {
      console.error("Failed to fetch other users:", error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (userData?._id) {
      fetchGroups();
      // Also fetch other users if they're not already loaded
      if (!otherUsers || otherUsers.length === 0) {
        fetchOtherUsers();
      }
    }
  }, [userData, fetchGroups, fetchOtherUsers, otherUsers]);

  // Listen for group messages read events
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handler = ({ groupId }) => {
        // Refresh groups to update unread counts
        fetchGroups();
      };
      socket.on('groupMessagesRead', handler);
      return () => socket.off('groupMessagesRead', handler);
    }
  }, [fetchGroups]);

  if (isMobile && (selectedUser || selectedGroup)) {
    return null;
  }

  const chatListTitle = searchInput.trim() ? "Search Results" : "Chats";
  const onlineCount = onlineUsers?.length || 0;

  const mainGradientClass = darkMode
    ? "bg-gradient-to-br from-[#000428] via-[#004e92] to-[#2c5364]"
    : "bg-gradient-to-br from-[#f12711] to-[#f5af19]";

  const headerGradientClass = darkMode
    ? "bg-gradient-to-r from-[#141E30] to-[#243B55]"
    : "bg-gradient-to-r from-[#ff9a9e] to-[#fad0c4]";

  return (
    <div
      className={`w-full md:w-[30%] h-screen flex flex-col relative ${mainGradientClass} overflow-hidden`}
    >
      <GetConversations />
      {/* Header Section */}
      <div
        className={`w-full p-4 md:p-6 pb-2 md:pb-2 rounded-b-[30px] shadow-xl flex flex-col justify-start relative z-40 ${headerGradientClass}`}
      >
        {/* Top row: App Logo, Title, and Dark/Light Toggle */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl"
              style={{ textShadow: "0px 4px 8px rgba(0,0,0,0.5)" }}
            >
              <FaComments className="text-white" />
            </motion.div>
            <motion.h1
              className="font-bold text-3xl tracking-wide text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.5)" }}
            >
              Chatly
            </motion.h1>
          </div>

          {/* Dark/Light Toggle - Moved to top right */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-2xl text-white transition-all duration-300 transform hover:scale-110"
            title="Toggle dark/light mode"
          >
            {darkMode ? "☀" : "🌙"}
          </button>
        </div>

        {/* User Profile and Greeting - Profile picture now comes first */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex justify-center items-center bg-white shadow-lg cursor-pointer transition-transform duration-200"
              onClick={() => navigate("/profile")}
              title="View Profile"
            >
              <img
                src={userData?.image || dp}
                alt="Your Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <h1 className="text-gray-100 font-bold text-xl md:text-2xl">
              Hi, {userData?.name?.split(' ')[0] || "User"}
            </h1>
          </div>
        </div>

        {/* Story Upload & Feed Section */}
        <div className="flex items-center space-x-3 mb-4 overflow-x-auto scrollbar-hide py-2">
          {userOwnStory ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer"
              onClick={() => handleStoryClick(userOwnStory)}
              title="View your story"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-green-400 overflow-hidden flex items-center justify-center bg-[#0d1b2a]">
                  <img
                    src={userData?.image || dp}
                    alt="Your Story"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 text-white text-xs flex items-center justify-center rounded-full border-2 border-[#0d1b2a]">
                  👀
                </div>
              </div>
              <span className="text-xs text-gray-200 font-medium">Your Story</span>
            </motion.div>
          ) : (
            <StoryUploader
              onUploadComplete={onUserStoryUploadComplete}
              triggerComponent={
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer"
                  title="Add a new story"
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-blue-400 overflow-hidden flex items-center justify-center bg-[#0d1b2a]">
                      <img
                        src={userData?.image || dp}
                        alt="Your Story"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 text-white text-md flex items-center justify-center rounded-full border-2 border-[#0d1b2a]">
                      +
                    </div>
                  </div>
                  <span className="text-xs text-gray-200 font-medium">Your Story</span>
                </motion.div>
              }
            />
          )}

          {/* Other Users' Stories Feed */}
          <StoryFeed onStoryClick={handleStoryClick} ref={storyFeedRef} currentUserId={userData?._id} />
        </div>

        {/* Search Input */}
        <div className="relative mb-4 px-2" ref={searchRef}>
          <div className="w-full h-12 bg-white/10 border border-white/20 shadow-lg flex items-center gap-3 rounded-full overflow-hidden px-4">
            <IoIosSearch className="w-5 h-5 text-gray-300" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full h-full bg-transparent text-white placeholder-gray-400 text-md outline-none border-0"
              onChange={(e) => setSearchInput(e.target.value)}
              value={searchInput}
              onFocus={() => setShowSearchDropdown(true)}
              autoComplete="off"
            />
            {searchInput && (
              <RxCross2
                className="w-5 h-5 cursor-pointer text-gray-300 transition-transform duration-200 hover:scale-110"
                onClick={() => {
                  setSearchInput("");
                  dispatch(setSearchData([]));
                  setShowSearchDropdown(false);
                }}
              />
            )}
          </div>
          {/* Dropdown for search suggestions */}
          <AnimatePresence>
            {showSearchDropdown && searchData?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto w-[calc(100%-16px)] mx-auto border border-gray-200"
              >
                {searchData.map((user) => (
                  <motion.div
                    key={user._id}
                    whileHover={{ backgroundColor: "#f3f4f6", x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 cursor-pointer flex items-center gap-3 transition-colors duration-150"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={user.image || dp}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">@{user.userName}</p>
                    </div>
                    {onlineUsers?.includes(user._id) && (
                      <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
            {showSearchDropdown && searchInput.trim() && searchData?.length === 0 && (
                   <motion.div
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                     className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 p-3 text-center text-gray-500 w-[calc(100%-16px)] mx-auto border border-gray-200"
                 >
                     No users found
                 </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat List Header */}
      <div className="px-4 md:px-6 pt-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-100">
            {chatListTitle}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200"
              title="Create Group"
            >
              <MdGroupAdd className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              <span className="text-xs text-gray-300">
                {onlineCount} online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable User List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20">
        {/* Groups Section */}
        {groups && groups.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <MdGroupAdd className="w-4 h-4" />
              Groups ({groups.length})
            </h3>
            {groups.map((group) => (
              <motion.div
                key={group._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 5, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.98 }}
                className={`w-full h-16 flex items-center gap-4 shadow-lg rounded-full cursor-pointer p-2 mb-3 transform transition-all duration-200 ease-in-out
                  ${darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-pink-100 text-gray-800"}
                  ${selectedGroup?._id === group._id ? (darkMode ? "bg-white/20 ring-2 ring-blue-400" : "bg-pink-100 ring-2 ring-pink-500") : ""}
                `}
                onClick={() => dispatch(selectGroup(group))}
              >
                <div className="relative rounded-full bg-white shadow-md flex justify-center items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex justify-center items-center">
                    <img
                      src={group.image || dp}
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {group.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {group.unreadCount > 9 ? '9+' : group.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold text-lg overflow-hidden whitespace-nowrap text-ellipsis">
                    {group.name}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {group.members?.length || 0} members
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Individual Chats Section */}
        <div>
          <h3 className="text-md font-semibold text-gray-100 mb-3">Individual Chats</h3>
          {conversations && conversations.length > 0 ? (
            conversations.map((conversation) => (
              <motion.div
                key={conversation.conversationId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02, x: 5, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.98 }}
                className={`w-full h-16 flex items-center gap-4 shadow-lg rounded-full cursor-pointer p-2 mb-3 transform transition-all duration-200 ease-in-out
                  ${darkMode ? "bg-white/10 hover:bg-white/20 text-white" : "bg-white hover:bg-pink-100 text-gray-800"}
                  ${selectedUser?._id === conversation.user?._id ? (darkMode ? "bg-white/20 ring-2 ring-blue-400" : "bg-pink-100 ring-2 ring-pink-500") : ""}
                `}
                onClick={() => dispatch(setSelectedUser(conversation.user))}
              >
                <div className="relative rounded-full bg-white shadow-md flex justify-center items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex justify-center items-center">
                    <img
                      src={conversation.user?.image || dp}
                      alt={conversation.user?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {onlineUsers?.includes(conversation.user?._id) && (
                    <span className="w-3 h-3 rounded-full absolute bottom-0.5 right-0.5 bg-green-500 border-2 border-white"></span>
                  )}
                </div>
                <h1 className="font-semibold text-lg overflow-hidden whitespace-nowrap text-ellipsis flex-grow">
                  {conversation.user?.name || conversation.user?.userName}
                </h1>
                {conversation.unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {conversation.unreadCount}
                  </span>
                )}
              </motion.div>
            ))
          ) : (
            <p className="text-gray-400 text-center mt-8">
              {searchInput.trim() ? "No search results found." : "No chats available. Start a new conversation!"}
            </p>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <motion.div
        className="absolute bottom-4 left-4 z-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <button
          onClick={handleLogOut}
          className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-105"
          title="Logout"
        >
          <BiLogOutCircle className="w-7 h-7 text-white" />
        </button>
      </motion.div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {viewingStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999]"
          >
            <StoryViewer story={viewingStory} onClose={handleCloseStoryViewer} userId={userData?._id} />
          </motion.div>
        )}
      </AnimatePresence>

             {/* Group Create Modal */}
       <AnimatePresence>
         {showGroupModal && (
           <GroupCreateModal 
             open={showGroupModal}
             onClose={() => setShowGroupModal(false)}
             users={otherUsers || []}
             onCreate={async (groupData) => {
               try {
                 const formData = new FormData();
                 formData.append('name', groupData.name);
                 if (groupData.image) formData.append('image', groupData.image);
                 groupData.members.forEach(memberId => {
                   formData.append('members', memberId);
                 });
                 
                 const response = await axios.post(`${serverUrl}/api/group/create`, formData, { 
                   withCredentials: true,
                   headers: { 'Content-Type': 'multipart/form-data' }
                 });
                 
                 if (response.data.group) {
                   dispatch(setGroups([...groups, response.data.group]));
                   setShowGroupModal(false);
                 }
               } catch (error) {
                 console.error('Failed to create group:', error);
                 alert('Failed to create group');
               }
             }}
           />
         )}
       </AnimatePresence>
    </div>
  );
}

export default SideBar;