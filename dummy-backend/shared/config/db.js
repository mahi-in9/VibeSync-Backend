import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb+srv://kumarmahendraofficial_db_user:SucSCOxjRn5aaSmU@cluster0.ap2g4su.mongodb.net/vibesync?retryWrites=true&w=majority";
    if (!mongoURI) {
      throw new Error("❌ MONGO_URI is not defined in .env file");
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
