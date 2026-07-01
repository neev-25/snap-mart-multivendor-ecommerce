import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose.connection | null;
  promise: Promise<typeof mongoose.connection> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
if (!global.mongoose) {
  global.mongoose = cached;
}

function getMongoUrl(): string {
  const url = process.env.MONGODB_URL?.trim();
  if (!url) {
    throw new Error("MONGODB_URL is missing. Add it to snapmart/.env.local");
  }
  if (url.startsWith("mongodb+srv://")) {
    throw new Error(
      "mongodb+srv:// fails on this PC (DNS querySrv ECONNREFUSED). Use a direct mongodb:// host list in .env.local instead."
    );
  }
  return url;
}

const connectDb = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUrl = getMongoUrl();

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUrl, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4,
      })
      .then((conn) => conn.connection);
  }

  try {
    const conn = await cached.promise;
    return conn;
  } catch (error) {
    cached.promise = null;
    console.error("[MongoDB] Connection failed:", error);
    throw error;
  }
};

export default connectDb;
