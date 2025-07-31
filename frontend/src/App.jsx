// src/App.jsx
import React, { useEffect, useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { io } from "socket.io-client";
import { serverUrl } from './main';
import { useDispatch, useSelector } from 'react-redux';
import { setOnlineUsers, setOtherUsers } from './redux/userSlice';
import { setSocket, getSocket } from './socketService';
import GetCurrentUser from './customHooks/getCurrentUser';
import GetOtherUsers from './customHooks/getOtherUsers';
import StoryViewer from './components/StoryViewer';
import SideBar from './components/SideBar';
import StoryFeed from './components/StoryFeed';

function App() {
  const dispatch = useDispatch();
  const { userData, otherUsers } = useSelector(state => state.user);
  const socketRef = useRef(null); // Avoid multiple connections
  const [viewingStory, setViewingStory] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const openStoryViewer = (story) => setViewingStory(story);
  const closeStoryViewer = () => setViewingStory(null);

  useEffect(() => {
    if (userData?._id && !socketRef.current) {
      console.log("🔌 Connecting socket for user:", userData._id);
      const socketio = io(serverUrl, {
        query: { userId: userData._id },
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current = socketio;
      setSocket(socketio);

      socketio.on("connect", () => {
        console.log("✅ Socket connected:", socketio.id);
      });

      socketio.on("getOnlineUsers", (users) => {
        console.log("👥 Online users updated:", users.length);
        dispatch(setOnlineUsers(users));
      });

      // Listen for new user creation
      socketio.on("newUserCreated", ({ user }) => {
        console.log("🆕 New user created:", user.name);
        // Add the new user to the otherUsers list if it exists
        if (otherUsers && Array.isArray(otherUsers)) {
          dispatch(setOtherUsers([...otherUsers, user]));
        }
      });

      socketio.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });
    }

    return () => {
      if (socketRef.current) {
        console.log("🔌 Disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [userData?._id, dispatch, otherUsers]);

  // Show loading while checking authentication
  if (isLoading && !userData && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f0f] via-[#1e1e1e] to-[#2e2e2e]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Always fetch current user if not on login/signup pages */}
      {window.location.pathname !== '/login' && window.location.pathname !== '/signup' && <GetCurrentUser setIsLoading={setIsLoading} />}
      
      {/* Only fetch other users when userData exists */}
      {userData && <GetOtherUsers />}

      {/* Global StoryViewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[9999]">
          <StoryViewer story={viewingStory} onClose={closeStoryViewer} userId={userData?._id} />
        </div>
      )}

      <Routes>
        <Route path='/login' element={!userData ? <Login /> : <Navigate to="/" replace />} />
        <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to="/" replace />} />
        <Route path='/' element={userData ? <Home openStoryViewer={openStoryViewer} /> : <Navigate to="/login" replace />} />
        <Route path='/profile' element={userData ? <Profile /> : <Navigate to="/login" replace />} />
      </Routes>
      {/* Pass openStoryViewer to SideBar and StoryFeed as needed */}
    </>
  );
}

export default App;
