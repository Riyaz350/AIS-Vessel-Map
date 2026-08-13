const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);

  // Without this listener, a dropped/reset connection becomes an
  // uncaught exception that crashes the entire Node process -- exactly
  // what happened above. The MongoDB driver already retries connections
  // internally; this just makes sure a transient error is logged and
  // absorbed instead of being thrown.
  mongoose.connection.on('error', (err) => {
    console.error('[DB] Connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] Disconnected. Mongoose will attempt to reconnect automatically.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] Reconnected to MongoDB');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('[DB] Connected to MongoDB');
}

module.exports = connectDB;