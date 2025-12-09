// db.js
const { MongoClient } = require("mongodb");

// --- CHANGE THIS TO YOUR OWN CONNECTION STRING ---
const MONGO_URL = "mongodb://127.0.0.1:27017";  // local MongoDB
const DB_NAME = "";

let db = null;

// Connect to MongoDB ONCE and reuse the connection
async function connectDB() {
    if (db) {
        return db;
    }

    try {
        const client = new MongoClient(MONGO_URL);
        await client.connect();
        db = client.db(DB_NAME);

        console.log("✅ Connected to MongoDB:", DB_NAME);
        return db;
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    }
}

// Called by routes to access the DB
function getDB() {
    if (!db) {
        throw new Error("❌ Database not connected. Call connectDB() first!");
    }
    return db;
}

module.exports = { connectDB, getDB };
