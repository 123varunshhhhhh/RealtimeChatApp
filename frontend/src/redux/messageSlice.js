// src/redux/messageSlice.js
import { createSlice } from '@reduxjs/toolkit';

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    messages: null,
    // REMOVE: conversations state
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    // REMOVE: setConversations reducer
    // New action to update message status (delivered/seen)
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      if (state.messages) {
        const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
        if (messageIndex !== -1) {
          state.messages[messageIndex].status = status;
        }
      }
    },
    // New action to add/update reactions
    addReactionToMessage: (state, action) => {
      const { messageId, userId, emoji } = action.payload;
      if (state.messages) {
        const messageIndex = state.messages.findIndex(msg => msg._id === messageId);
        if (messageIndex !== -1) {
          const message = state.messages[messageIndex];
          // Initialize reactions array if it doesn't exist
          if (!message.reactions) {
            message.reactions = [];
          }

          const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userId === userId
          );

          if (existingReactionIndex > -1) {
            // If same emoji, remove reaction (toggle off)
            if (message.reactions[existingReactionIndex].emoji === emoji) {
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // If different emoji, update reaction
              message.reactions[existingReactionIndex].emoji = emoji;
            }
          } else {
            // Add new reaction
            message.reactions.push({ userId, emoji });
          }
        }
      }
    },
    // New action to delete a message from the state
    deleteMessageFromState: (state, action) => {
      const messageIdToDelete = action.payload;
      if (state.messages) {
        state.messages = state.messages.filter(msg => msg._id !== messageIdToDelete);
      }
    },
    // You might also need a clearMessages action when switching chats
    clearMessages: (state) => {
      state.messages = null;
    }
  },
});

export const {
  setMessages,
  // REMOVE: setConversations export
  updateMessageStatus,
  addReactionToMessage,
  deleteMessageFromState,
  clearMessages
} = messageSlice.actions;

export default messageSlice.reducer;