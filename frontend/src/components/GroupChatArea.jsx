import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../main";
import dp from "../assets/dp.webp";
import GroupInfoModal from './GroupInfoModal';
import { setGroups, updateGroup } from '../redux/groupSlice';
import { getSocket } from '../socketService';
import { IoIosArrowRoundBack } from "react-icons/io";
import { RiSendPlane2Fill } from "react-icons/ri";
import { selectGroup } from '../redux/groupSlice';
import dayjs from "dayjs";

const GroupChatArea = () => {
  const { selectedGroup } = useSelector((state) => state.group);
  const { userData, otherUsers } = useSelector((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [backendImage, setBackendImage] = useState(null);
  const [frontendImage, setFrontendImage] = useState(null);
  const image = useRef(null);
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const [showInfo, setShowInfo] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  // Fetch all users for member management
  useEffect(() => {
    axios.get(`${serverUrl}/api/user/others`, { withCredentials: true })
      .then(res => setAllUsers([userData, ...(res.data || [])]))
      .catch(() => setAllUsers([userData]));
  }, [userData]);

  useEffect(() => {
    if (!selectedGroup) return;
    axios
      .get(`${serverUrl}/api/message/group/${selectedGroup._id}`, { withCredentials: true })
      .then((res) => {
        setMessages(res.data);
        // Mark messages as read when group is opened
        if (res.data.length > 0) {
          const unreadMessages = res.data.filter(msg => 
            msg.sender !== userData._id && 
            (!msg.seenBy || !msg.seenBy.includes(userData._id))
          );
          if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(msg => msg._id);
            axios.post(`${serverUrl}/api/message/mark-group-read`, {
              groupId: selectedGroup._id,
              messageIds
            }, { withCredentials: true });
          }
        }
      })
      .catch(() => setMessages([]));
    // Real-time group messaging
    const socket = getSocket();
    if (socket) {
      const handler = ({ groupId, message }) => {
        if (groupId === selectedGroup._id) setMessages((prev) => [...prev, message]);
      };
      socket.on('groupMessage', handler);
      
      // Emit that user has read the group messages
      socket.emit('groupMessagesRead', { groupId: selectedGroup._id });
      
      return () => socket.off('groupMessage', handler);
    }
  }, [selectedGroup, userData._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setBackendImage(file);
      setFrontendImage(URL.createObjectURL(file));
    } else {
      setBackendImage(null);
      setFrontendImage(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !backendImage) return;
    try {
      const formData = new FormData();
      formData.append("message", input);
      formData.append("groupId", selectedGroup._id);
      if (backendImage) formData.append("image", backendImage);
      const res = await axios.post(
        `${serverUrl}/api/message/send-group/${selectedGroup._id}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      setMessages((prev) => [...prev, res.data]);
      // Emit real-time event
      const socket = getSocket();
      if (socket) socket.emit('sendGroupMessage', { message: res.data, groupId: selectedGroup._id });
      setInput("");
      setFrontendImage(null);
      setBackendImage(null);
      if (image.current) image.current.value = "";
    } catch (err) {
      alert("Failed to send message");
    }
  };

  if (!selectedGroup) return null;

  return (
    <div className="relative w-full md:w-[70%] h-screen flex flex-col border-l-2 border-gray-600 overflow-hidden bg-gradient-to-br from-[#000428] via-[#004e92] to-[#2c5364]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 bg-blue-700 text-white shadow-md rounded-b-2xl">
        <button className="mr-2" onClick={() => dispatch(selectGroup(null))}>
          <IoIosArrowRoundBack className="w-8 h-8 text-white transition-transform hover:scale-110" />
        </button>
        <img src={selectedGroup.image || dp} alt={selectedGroup.name} className="w-12 h-12 rounded-full object-cover" />
        <div>
          <h2 className="font-bold text-lg">{selectedGroup.name}</h2>
          <span className="text-xs">Group Chat</span>
        </div>
        <button className="ml-auto bg-white text-blue-700 px-3 py-1 rounded-full text-sm" onClick={() => setShowInfo(true)}>Group Info</button>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {messages.map((msg) => {
          const sender =
            msg.sender === userData._id
              ? userData
              : allUsers.find(u => u._id === msg.sender) || {};
          const isSelf = msg.sender === userData._id;
          // Format timestamp
          const time = msg.createdAt ? dayjs(msg.createdAt).format("h:mm A") : "";
          // Status tick logic
          let tick = null;
          if (isSelf) {
            if (msg.status === "seen") {
              tick = <span title="Seen" className="text-green-500 ml-1">✔✔</span>;
            } else if (msg.status === "delivered") {
              tick = <span title="Delivered" className="text-blue-500 ml-1">✔✔</span>;
            } else {
              tick = <span title="Sent" className="text-gray-400 ml-1">✔</span>;
            }
          }
          return (
            <div key={msg._id} className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-2 items-end`}>
              <img src={sender.image || dp} alt={sender.name || "User"} className="w-8 h-8 rounded-full object-cover mr-2" />
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${isSelf ? "bg-blue-500 text-white" : "bg-white text-gray-800"} relative`}
              >
                <div className="text-xs font-semibold text-blue-700 mb-1">{sender.name || "User"}</div>
                {msg.image && (
                  msg.image.match(/\.(mp4|webm|ogg)$/i)
                    ? (
                      <video controls className="w-[150px] rounded-lg mb-1">
                        <source src={msg.image} />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img src={msg.image} alt="attachment" className="w-[150px] rounded-lg mb-1" />
                    )
                )}
                {msg.message && <span>{msg.message}</span>}
                <div className="flex items-center justify-end mt-1 text-xs opacity-80">
                  <span>{time}</span>
                  {tick}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Send Message */}
      <form className="flex items-center gap-2 p-4 bg-white/10" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2 rounded-full border border-gray-400 focus:outline-none"
        />
        <input type="file" accept="image/*" ref={image} hidden onChange={handleImage} />
        <button type="button" onClick={() => image.current?.click()} className="bg-blue-500 text-white px-3 py-2 rounded-full">📷</button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-full flex items-center justify-center">
          <RiSendPlane2Fill className="w-6 h-6" />
        </button>
      </form>
      <GroupInfoModal
        open={showInfo}
        onClose={() => setShowInfo(false)}
        group={selectedGroup}
        allUsers={allUsers}
        userId={userData._id}
        onUpdate={async ({ name, image }) => {
          try {
            const formData = new FormData();
            formData.append('name', name);
            if (image) formData.append('image', image);
            formData.append('groupId', selectedGroup._id);
            const res = await axios.put(`${serverUrl}/api/group/update`, formData, { withCredentials: true });
            if (res.data.group) dispatch(updateGroup(res.data.group));
          } catch (err) { alert('Failed to update group'); }
        }}
        onAddMember={async (userId) => {
          try {
            await axios.post(`${serverUrl}/api/group/add-member`, { groupId: selectedGroup._id, userId }, { withCredentials: true });
            // Refetch group info after add
            const res = await axios.get(`${serverUrl}/api/group/my-groups`, { withCredentials: true });
            if (res.data.groups) {
              dispatch(setGroups(res.data.groups));
              const updated = res.data.groups.find(g => g._id === selectedGroup._id);
              if (updated) dispatch(updateGroup(updated));
            }
          } catch (err) { alert('Failed to add member'); }
        }}
        onRemoveMember={async (userId) => {
          try {
            await axios.post(`${serverUrl}/api/group/remove-member`, { groupId: selectedGroup._id, userId }, { withCredentials: true });
            // Refetch group info after remove
            const res = await axios.get(`${serverUrl}/api/group/my-groups`, { withCredentials: true });
            if (res.data.groups) {
              dispatch(setGroups(res.data.groups));
              const updated = res.data.groups.find(g => g._id === selectedGroup._id);
              if (updated) dispatch(updateGroup(updated));
            }
          } catch (err) { alert('Failed to remove member'); }
        }}
      />
    </div>
  );
};

export default GroupChatArea; 