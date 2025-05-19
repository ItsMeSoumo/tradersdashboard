import mongoose from "mongoose";

// Global variable to track connection status
let isConnected = false;

export async function connectDB() {
    // If already connected, return early
    if (isConnected) {
        console.log('MongoDB is already connected');
        return;
    }

    // Get the MongoDB URI from environment variables
    const MONGODB_URL = process.env.MONGODB_URI;
    
    if (!MONGODB_URL) {
        console.error('MONGODB_URI is not defined in environment variables');
        throw new Error('MONGODB_URI is not defined');
    }

    try {
        // Set mongoose options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        // Connect to MongoDB
        const connection = await mongoose.connect(MONGODB_URL, options);
        
        isConnected = true;
        console.log(`MongoDB Connected: ${connection.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Don't exit the process in a serverless environment
        throw error;
    }
}

export default connectDB;