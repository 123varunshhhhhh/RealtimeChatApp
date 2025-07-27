// src/store.js (or whatever your store file is named)
import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice";
import messageSlice from "./messageSlice";
import groupSlice from "./groupSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    message: messageSlice,
    group: groupSlice
  },
  // Add this middleware configuration to disable the serializable check
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable the serializable state invariant middleware
    }),
});