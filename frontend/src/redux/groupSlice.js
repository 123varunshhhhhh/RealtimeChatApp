import { createSlice } from "@reduxjs/toolkit";
import { setSelectedUser } from "./userSlice";

const groupSlice = createSlice({
  name: "group",
  initialState: {
    groups: [],
    selectedGroup: null,
  },
  reducers: {
    setGroups: (state, action) => {
      state.groups = action.payload;
    },
    addGroup: (state, action) => {
      state.groups.push(action.payload);
    },
    selectGroup: (state, action) => {
      state.selectedGroup = action.payload;
    },
    updateGroup: (state, action) => {
      const idx = state.groups.findIndex(g => g._id === action.payload._id);
      if (idx !== -1) state.groups[idx] = action.payload;
      if (state.selectedGroup && state.selectedGroup._id === action.payload._id) {
        state.selectedGroup = action.payload;
      }
    },
    removeGroup: (state, action) => {
      state.groups = state.groups.filter(g => g._id !== action.payload);
      if (state.selectedGroup && state.selectedGroup._id === action.payload) {
        state.selectedGroup = null;
      }
    },
  },
});

export const { setGroups, addGroup, selectGroup, updateGroup, removeGroup } = groupSlice.actions;
export default groupSlice.reducer; 