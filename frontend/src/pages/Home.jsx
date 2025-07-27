import React, { useEffect } from 'react';
import SideBar from '../components/SideBar';
import MessageArea from '../components/MessageArea';
import GroupChatArea from '../components/GroupChatArea';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery } from 'react-responsive';
import { setOnlineUsers, setSelectedUser, setOtherUsers } from '../redux/userSlice';
import { getSocket } from '../socketService'; // ✅ NEW import

function Home({ openStoryViewer }) {
  const { selectedUser, userData, otherUsers, onlineUsers } = useSelector(state => state.user);
  const { selectedGroup } = useSelector(state => state.group);
  const dispatch = useDispatch();
  const isMobile = useMediaQuery({ query: '(max-width: 767px)' });

  useEffect(() => {
    const socket = getSocket(); // ✅ use global socket

    if (socket) {
      socket.on("getOnlineUsers", (onlineUsersArray) => {
        dispatch(setOnlineUsers(onlineUsersArray));
      });

      return () => {
        socket.off("getOnlineUsers");
      };
    }
  }, [dispatch]);

  useEffect(() => {
    if (otherUsers && onlineUsers) {
      const updatedOtherUsers = otherUsers.map(user => ({
        ...user,
        isOnline: onlineUsers.includes(user._id)
      }));

      if (JSON.stringify(updatedOtherUsers) !== JSON.stringify(otherUsers)) {
        dispatch(setOtherUsers(updatedOtherUsers));
      }

      if (selectedUser) {
        const currentSelectedUserOnlineStatus = onlineUsers.includes(selectedUser._id);
        if (selectedUser.isOnline !== currentSelectedUserOnlineStatus) {
          dispatch(setSelectedUser({
            ...selectedUser,
            isOnline: currentSelectedUserOnlineStatus
          }));
        }
      }
    }
  }, [onlineUsers, otherUsers, selectedUser, dispatch]);

  return (
    <div className='w-full h-[100vh] flex gap-x-4'>
      {
        isMobile
          ? (!selectedUser && !selectedGroup ? <SideBar openStoryViewer={openStoryViewer} /> : selectedGroup ? <GroupChatArea /> : <MessageArea />)
          : (
            <>
              <SideBar openStoryViewer={openStoryViewer} />
              {selectedGroup ? <GroupChatArea /> : <MessageArea />}
            </>
          )
      }
    </div>
  );
}

export default Home;
