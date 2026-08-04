const { Server } = require('socket.io');
const Vessel = require('../models/Vessel');
 
function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || '*' },
  });
 
  io.on('connection', async (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    const vessels = await Vessel.find();
    socket.emit('vessel:snapshot', vessels);
    
    //  use io.emit to broadcast to all connected clients
 
    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });
 
  return io;
}
 
module.exports = initSockets;
