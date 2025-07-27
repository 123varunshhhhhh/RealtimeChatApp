import React, { useEffect, useRef, useState } from 'react';
import dp from "../assets/dp.webp";
import { useSelector } from 'react-redux';
import { FaEllipsisV, FaTrash, FaShare, FaHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { MdDone, MdDoneAll } from "react-icons/md"; // Tick icons

function SenderMessage({ message, onAction }) {
  const scroll = useRef();
  const { userData } = useSelector(state => state.user);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const reactions = message.reactions || [];

  const menuRef = useRef();
  const pickerRef = useRef();

  useEffect(() => {
    scroll?.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);

  const handleImageLoad = () => {
    scroll?.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReaction = (emojiData) => {
    onAction?.("react", message._id, emojiData.emoji);
    setShowReactions(false);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onAction?.("delete", message._id);
    setShowMenu(false);
  };

  const handleForward = () => {
    onAction?.("forward", message._id);
    setShowMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowReactions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={scroll} className="flex justify-end items-end px-4 py-1 w-full">
      <div className="flex items-end gap-2 max-w-[75%]">
        {/* Action menu button */}
        <div ref={menuRef} className="relative z-20">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-300 hover:text-white p-1 rounded-full bg-gray-800 bg-opacity-70"
          >
            <FaEllipsisV />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl z-30 min-w-[120px] text-sm text-white"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  className="flex items-center w-full p-2 hover:bg-gray-700 rounded-t-lg"
                  onClick={() => { setShowReactions(true); setShowMenu(false); }}
                >
                  <FaHeart className="mr-2 text-red-400" /> React
                </button>
                <button
                  className="flex items-center w-full p-2 hover:bg-gray-700"
                  onClick={handleForward}
                >
                  <FaShare className="mr-2 text-blue-400" /> Forward
                </button>
                <button
                  className="flex items-center w-full p-2 hover:bg-gray-700 rounded-b-lg text-red-400"
                  onClick={handleDelete}
                >
                  <FaTrash className="mr-2" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Bubble */}
        <div className="relative group flex items-center">
          <div className="px-4 py-2 bg-gradient-to-br from-cyan-600 to-cyan-400 text-white text-base rounded-2xl rounded-tr-none shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col gap-2 relative z-10">
            {message.image && (
              message.image.match(/\.(mp4|webm|ogg)$/i)
                ? (
                  <video controls className="w-[150px] rounded-lg">
                    <source src={message.image} />
                    Your browser does not support the video tag.
                  </video>
                )
                : (
                  <img
                    src={message.image}
                    alt="attachment"
                    className="w-[150px] rounded-lg"
                    onLoad={handleImageLoad}
                  />
                )
            )}

            {message.audio && (
              <audio controls className="mt-2 w-full min-w-[150px]">
                <source src={message.audio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}

            {message.message && <span>{message.message}</span>}

            {/* Reaction + Time + Ticks */}
            <div className="flex justify-end items-center mt-1 text-xs text-gray-200">
              {reactions.length > 0 && (
                <div className="mr-2 flex items-center bg-gray-700 px-2 py-0.5 rounded-full text-sm">
                  {reactions.slice(0, 3).map((r, idx) => (
                    <span key={idx} className="mr-0.5">{r.emoji}</span>
                  ))}
                  {reactions.length > 3 && (
                    <span className="ml-1">+{reactions.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                {/* Tick Status */}
                {message.status === "sent" && (
                  <MdDone className="text-gray-300 text-base" title="Sent" />
                )}
                {message.status === "delivered" && (
                  <MdDoneAll className="text-gray-300 text-base" title="Delivered" />
                )}
                {message.status === "seen" && (
                  <MdDoneAll className="text-blue-400 text-base" title="Seen" />
                )}
                <span className="text-xs opacity-80">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sender DP */}
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-md flex-shrink-0">
          <img src={userData.image || dp} alt="dp" className="h-full object-cover" />
        </div>
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            ref={pickerRef}
            className="absolute z-50"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <EmojiPicker
              onEmojiClick={handleReaction}
              searchDisabled
              skinTonesDisabled
              width={250}
              height={350}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SenderMessage;