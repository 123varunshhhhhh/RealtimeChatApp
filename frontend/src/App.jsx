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
import { setOnlineUsers } from './redux/userSlice';
import { setSocket, getSocket } from './socketService';
import GetCurrentUser from './customHooks/getCurrentUser';
import GetOtherUsers from './customHooks/getOtherUsers';
import StoryViewer from './components/StoryViewer';
import SideBar from './components/SideBar';
import StoryFeed from './components/StoryFeed';

function App() {
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
  const socketRef = useRef(null); // Avoid multiple connections
  const [viewingStory, setViewingStory] = React.useState(null);

  const openStoryViewer = (story) => setViewingStory(story);
  const closeStoryViewer = () => setViewingStory(null);

  useEffect(() => {
    if (userData?._id && !socketRef.current) {
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
        dispatch(setOnlineUsers(users));
      });

      socketio.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [userData?._id]);

  return (
    <>
      {/* Only fetch current user if not already present and not on login/signup */}
      {(!userData && window.location.pathname !== '/login' && window.location.pathname !== '/signup') && <GetCurrentUser />}
      <GetOtherUsers />

      {/* Global StoryViewer Modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[9999]">
          <StoryViewer story={viewingStory} onClose={closeStoryViewer} userId={userData?._id} />
        </div>
      )}

      <Routes>
        <Route path='/login' element={!userData ? <Login /> : <Navigate to="/" />} />
        <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to="/profile" />} />
        <Route path='/' element={userData ? <Home openStoryViewer={openStoryViewer} /> : <Navigate to="/login" />} />
        <Route path='/profile' element={userData ? <Profile /> : <Navigate to="/signup" />} />
      </Routes>
      {/* Pass openStoryViewer to SideBar and StoryFeed as needed */}
    </>
  );
}

export default App;
