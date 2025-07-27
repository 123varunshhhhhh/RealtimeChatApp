// frontend/src/redux/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    otherUsers: [],
    selectedUser: null,
    onlineUsers: [],
    searchData: [],
    socketConnected: false, // ✅ add this
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setOtherUsers: (state, action) => {
      state.otherUsers = Array.isArray(action.payload) ? action.payload : [];
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = Array.isArray(action.payload) ? action.payload : [];
    },
    setSearchData: (state, action) => {
      state.searchData = Array.isArray(action.payload) ? action.payload : [];
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload; // ✅ this line fixes warning
    }
  }
});

export const {
  setUserData,
  setOtherUsers,
  setSelectedUser,
  setOnlineUsers,
  setSearchData,
  setSocketConnected // ✅ export this
} = userSlice.actions;

export default userSlice.reducer;
