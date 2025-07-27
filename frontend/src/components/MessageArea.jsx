// frontend/src/components/MessageArea.jsx
import React, { useEffect, useRef, useState } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { RiEmojiStickerLine } from "react-icons/ri";
import { FaImages, FaMicrophone } from "react-icons/fa";
import { RiSendPlane2Fill } from "react-icons/ri";
import { FaComments } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import SenderMessage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import axios from "axios";
import { getSocket } from "../socketService";
import { serverUrl } from "../main";
import { setMessages, updateMessageStatus, addReactionToMessage, deleteMessageFromState } from "../redux/messageSlice";
import { setSelectedUser } from "../redux/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import dp from "../assets/dp.webp";
import ForwardMessageModal from './ForwardMessageModal';

const AnimatedText = ({ text }) => (
  <div className="flex">
    {text.split("").map((char, index) => (
      <motion.span
        key={index}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.05, type: "spring", stiffness: 300 }}
        className="mx-0.5"
      >
        {char}
      </motion.span>
    ))}
  </div>
);

const containerVariants = {
  visible: { transition: { staggerChildren: 0.1 } },
  hidden: {}
};

const messageTransition = {
  duration: 0.05
};

const Bubbles = () => {
  const bubbleCount = 15;
  return (
    <>
      {Array.from({ length: bubbleCount }).map((_, idx) => {
        const size = Math.random() * 30 + 20;
        const left = Math.random() * 100;
        const duration = Math.random() * 8 + 4;
        return (
          <motion.div
            key={idx}
            className="absolute rounded-full bg-white opacity-30"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: "-50px"
            }}
            animate={{ y: "-110vh" }}
            transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
          />
        );
      })}
    </>
  );
};

function MessageArea() {
  const { selectedUser, userData, onlineUsers } = useSelector((state) => state.user);
  const { messages } = useSelector((state) => state.message);
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [frontendImage, setFrontendImage] = useState(null);
  const [backendImage, setBackendImage] = useState(null);
  const [backendAudio, setBackendAudio] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]); // This should be a ref if its being updated and retained across renders
  const image = useRef(null);
  const messagesEndRef = useRef(null);
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  // State for Forward Message Modal
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);

  // Auto-scroll instantly on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Fetch full chat history
  useEffect(() => {
    if (!selectedUser || selectedUser._id === "kira-ai") return;
    axios
      .get(`${serverUrl}/api/message/get/${selectedUser._id}`, { withCredentials: true })
      .then((response) => {
        const allMessages = Array.isArray(response.data) ? response.data : [];
        const conversation = allMessages.filter(
          (msg) =>
            (msg.sender === userData._id && msg.receiver === selectedUser._id) ||
            (msg.sender === selectedUser._id && msg.receiver === userData._id)
        );
        dispatch(setMessages(conversation));

        const socket = getSocket();
        if (socket) {
          const unseenIds = conversation
            .filter(msg =>
              msg.sender !== userData._id &&
              !msg.seenBy?.includes(userData._id)
            )
            .map(msg => msg._id);

          if (unseenIds.length > 0) {
            socket.emit("markMessagesAsSeen", {
              messageIds: unseenIds,
              receiverId: userData._id
            });
          }
        }
      })
      .catch((err) => console.log("Error fetching messages", err));
  }, [selectedUser, dispatch, userData._id]);

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedUser) return;

    const handleNewMessage = (mess) => {
      if (
        (mess.sender === userData._id && mess.receiver === selectedUser._id) ||
        (mess.sender === selectedUser._id && mess.receiver === userData._id)
      ) {
        if (!messages || !messages.some(existingMsg => existingMsg._id === mess._id)) {
            dispatch(setMessages([...(messages || []), mess]));
        }

        if (mess.sender !== userData._id) {
          socket.emit("markMessageAsDelivered", {
            messageId: mess._id,
            receiverId: selectedUser._id
          });
        }
      }
    };

    const handleMessageStatusUpdate = (update) => {
      dispatch(updateMessageStatus(update));
    };

    const handleReactionAdded = (data) => {
        dispatch(addReactionToMessage(data));
    };

    const handleMessageDeleted = (data) => {
        dispatch(deleteMessageFromState(data.messageId));
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageStatusUpdate", handleMessageStatusUpdate);
    socket.on("reactionAdded", handleReactionAdded);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageStatusUpdate", handleMessageStatusUpdate);
      socket.off("reactionAdded", handleReactionAdded);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [dispatch, messages, selectedUser, userData._id]);

  // Handle image selection
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    } else {
      console.error("Invalid image file");
      setBackendImage(null);
      setFrontendImage(null);
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
        setBackendAudio(audioBlob);
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not start recording. Please ensure microphone access is granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !backendImage && !backendAudio) return;

    try {
      const formData = new FormData();
      formData.append("message", input);
      formData.append("receiverId", selectedUser._id);

      if (backendImage) {
        formData.append("image", backendImage);
      }

      if (backendAudio) {
        formData.append("audio", backendAudio, "recording.mp3");
      }

      const result = await axios.post(
        `${serverUrl}/api/message/send/${selectedUser._id}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );

      dispatch(setMessages([...(messages || []), result.data]));
      setInput("");
      setFrontendImage(null);
      setBackendImage(null);
      setBackendAudio(null);

      if (image.current) {
        image.current.value = "";
      }
    } catch (error) {
      console.log("Message send error:", error);
    }
  };

  // Handle message actions (delete, forward, react)
  const handleMessageAction = (action, messageId, emoji = null) => {
    const socket = getSocket();
    if (!socket) return;

    switch (action) {
      case "delete":
        if ( selectedUser) {
          socket.emit("deleteMessage", {
            messageId,
            conversationId: messages[0]?.conversationId,
            receiverId: selectedUser._id
          });
        }
        break;

      case "forward":
        const msgToFwd = messages.find(msg => msg._id === messageId);
        if (msgToFwd) {
          setMessageToForward(msgToFwd);
          setShowForwardModal(true);
        }
        break;

      case "react":
        if ( emoji && selectedUser) {
          socket.emit("addReaction", {
            messageId,
            emoji,
            userId: userData._id,
            receiverId: selectedUser._id
          });
        }
        break;

      default:
        break;
    }
  };

  const handleForwardMessage = async (message, recipients) => {
    for (const recipientId of recipients) {
      try {
        const formData = new FormData();
        formData.append("message", message.message || "");
        formData.append("receiverId", recipientId);

        if (message.image) {
          const response = await fetch(message.image);
          const imageBlob = await response.blob();
          formData.append("image", imageBlob, "forwarded_image.jpg");
        }
        if (message.audio) {
          const response = await fetch(message.audio);
          const audioBlob = await response.blob();
          formData.append("audio", audioBlob, "forwarded_audio.mp3");
        }

        await axios.post(
          `${serverUrl}/api/message/send/${recipientId}`,
          formData,
          { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
        );
        console.log(`Message forwarded to ${recipientId}`);
      } catch (error) {
        console.error(`Error forwarding message to ${recipientId}:`, error);
      }
    }
    setMessageToForward(null);
    setShowForwardModal(false);
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
    setShowPicker(false);
  };

  const isSelectedUserOnline = onlineUsers?.includes(selectedUser?._id);

  if (!selectedUser && isMobile) return null;

  const bottomPaddingClass = (frontendImage || backendAudio) ? "pb-[170px]" : "pb-[100px]";
  const mediaPreviewBottom = "bottom-[100px]";

  return (
    <div
      className={`relative w-full md:w-[70%] h-screen flex flex-col border-l-2 border-gray-600 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-br from-[#000428] via-[#004e92] to-[#2c5364]"
          : "bg-gradient-to-br from-[#f12711] to-[#f5af19]"
      }`}
    >
      {/* Dark/Light Toggle */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 10 }}
        className="absolute top-4 right-4 z-50"
      >
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-2xl text-white"
          title="Toggle theme"
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </motion.div>
      {selectedUser ? (
        <>
          {/* Chat Header - MODIFIED STYLES */}
          <motion.div
            className={`
              relative w-full h-[100px] flex items-center px-4 md:px-6
              rounded-b-3xl shadow-lg transition-all duration-300 ease-in-out
              transform origin-top
              ${
                darkMode
                  ? "bg-gradient-to-r from-[#1a2a4b] to-[#2c4772] text-white"
                  : "bg-gradient-to-r from-[#ff8c00] to-[#ffa07a] text-gray-900"
              }
            `}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, duration: 0.3 }}
          >
            {/* Back Button */}
            <div className="cursor-pointer mr-4" onClick={() => dispatch(setSelectedUser(null))}>
              <IoIosArrowRoundBack className="w-8 h-8 md:w-10 md:h-10 text-white transition-transform hover:scale-110" />
            </div>
            {/* Profile Picture */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-white shadow-md flex-shrink-0">
              <img
                src={selectedUser?.image || dp}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            {/* User Name and Status */}
            <div className="ml-3 md:ml-4 flex flex-col justify-center overflow-hidden">
              <h1 className="font-semibold text-lg md:text-xl text-white truncate">
                {selectedUser?.name || "User"}
              </h1>
              <div className="text-xs md:text-sm text-cyan-200 flex items-center">
                {isSelectedUserOnline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-1 flex-shrink-0"></span>
                    Online
                  </>
                ) : (
                  "Offline"
                )}
              </div>
            </div>
          </motion.div>
          {/* Message List */}
          <motion.div
            className={`flex-1 py-6 px-5 overflow-y-auto ${bottomPaddingClass}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {showPicker && (
              <motion.div
                className="absolute bottom-[calc(100px + 2rem)] left-5 z-[60] shadow-lg"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <EmojiPicker width={250} height={350} onEmojiClick={onEmojiClick} />
              </motion.div>
            )}
            <AnimatePresence>
              {messages &&
                messages.map((mess) => (
                  <motion.div
                    key={mess._id}
                    layout
                    className="mb-4"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={messageTransition}
                  >
                    {mess.sender === userData?._id ? (
                      <SenderMessage
                        message={mess}
                        onAction={handleMessageAction}
                      />
                    ) : (
                      <ReceiverMessage
                        message={mess}
                        onAction={handleMessageAction}
                      />
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </motion.div>

          {/* Media Previews */}
          {frontendImage && (
            <motion.div
              className={`absolute ${mediaPreviewBottom} left-1/2 transform -translate-x-1/2 z-50`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 10 }}
            >
              <div className="relative">
                <img
                  src={frontendImage}
                  alt="Preview"
                  className="w-32 h-32 rounded-lg shadow-lg object-cover"
                />
                <button
                  onClick={() => {
                    setFrontendImage(null);
                    setBackendImage(null);
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          {backendAudio && (
            <motion.div
              className={`absolute ${mediaPreviewBottom} left-1/2 transform -translate-x-1/2 z-50 bg-white p-3 rounded-lg shadow-lg`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 10 }}
            >
              <div className="flex items-center gap-2">
                <audio controls className="w-48">
                  <source src={URL.createObjectURL(backendAudio)} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <button
                  onClick={() => setBackendAudio(null)}
                  className="bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          {/* Send Message Form */}
          <motion.form
            className="w-full flex items-center gap-3 rounded-full p-3 shadow-xl bg-gradient-to-r from-[#141E30] to-[#243B55] text-white"
            // Removed max-w-3xl to allow it to shrink on smaller screens
            onSubmit={handleSendMessage}
            whileHover={{ scale: 1.02 }}
          >
            <motion.div onClick={() => setShowPicker(prev => !prev)} className="cursor-pointer">
              <RiEmojiStickerLine className="w-6 h-6 hover:scale-110 transition-transform" />
            </motion.div>
            <input type="file" accept="image/*" ref={image} hidden onChange={handleImage} />

            <div
              className={`cursor-pointer ${isRecording ? "text-red-500 animate-pulse" : ""}`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <FaMicrophone className="w-6 h-6 hover:scale-110 transition-transform" />
            </div>
            {isRecording && (
              <div className="text-sm text-white">
                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </div>
            )}

            <input
              type="text"
              placeholder="Type your message here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow px-4 text-lg outline-none text-white bg-transparent border-none min-w-0" // Added min-w-0
            />

            <div onClick={() => image.current?.click()} className="cursor-pointer">
              <FaImages className="w-6 h-6 hover:scale-110 transition-transform" />
            </div>

            <motion.button type="submit" className="p-2 flex-shrink-0" whileHover={{ scale: 1.05, rotate: 5 }}>
              <RiSendPlane2Fill className="w-6 h-6" />
            </motion.button>
          </motion.form>
        </>
      ) : (
        !isMobile && (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            <Bubbles />
            <FaComments className="text-6xl text-white mb-4" />
            <motion.h1
              className="text-5xl font-bold text-white drop-shadow-lg flex items-center"
              animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Welcome to <span className="mx-4"><AnimatedText text="Chatly" /></span>
            </motion.h1>
            <span className="text-2xl text-gray-300 font-semibold">Chat Friendly!</span>
          </div>
        )
      )}

      {/* Forward Message Modal */}
      <AnimatePresence>
          {showForwardModal && (
              <ForwardMessageModal
                  message={messageToForward}
                  onClose={() => setShowForwardModal(false)}
                  onForward={handleForwardMessage}
              />
          )}
      </AnimatePresence>
    </div>
  );
}

export default MessageArea;