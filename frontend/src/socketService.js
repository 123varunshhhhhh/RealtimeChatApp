// src/socketService.js

let socketInstance = null;

export const setSocket = (socket) => {
  socketInstance = socket;
};

export const getSocket = () => socketInstance;
