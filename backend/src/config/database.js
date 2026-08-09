const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDatabase() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });
  console.log(`MongoDB connected: ${env.mongoDbName}`);
}

module.exports = { connectDatabase };
