import mongoose from "mongoose";

export const connectDB = async (mongoUri) => {
  try {
    if (!mongoUri) throw new Error("MONGO_URI is required");

    mongoose.set("strictQuery", false); // optional, avoids deprecation warning

    const connectWithRetry = async (retries = 5, delay = 5000) => {
      try {
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected successfully");
      } catch (err) {
        if (retries === 0) {
          console.error("❌ Could not connect to MongoDB:", err.message);
          process.exit(1);
        }
        console.warn(
          `⚠️ MongoDB connection failed. Retrying in ${delay / 1000}s...`
        );
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      }
    };

    await connectWithRetry();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("MongoDB disconnected due to app termination");
  process.exit(0);
});
