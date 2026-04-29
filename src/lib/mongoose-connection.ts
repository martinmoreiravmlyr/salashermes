import mongoose from "mongoose";

declare global {
  var __salasMongoConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function getMongooseConnection() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI no está configurado.");
  }

  if (!globalThis.__salasMongoConnectionPromise) {
    globalThis.__salasMongoConnectionPromise = mongoose.connect(process.env.MONGODB_URI);
  }

  return globalThis.__salasMongoConnectionPromise;
}
