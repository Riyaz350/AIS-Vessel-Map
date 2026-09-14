const { Server } = require('socket.io');
const Vessel = require('../models/Vessel');

const allowedOrigins = process.env.CORS_ORIGIN
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
    },
  });

  io.on('connection', async (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    const vessels = await Vessel.find();

    socket.emit('vessel:snapshot', vessels);

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSockets;