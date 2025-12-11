// db.js
const { MongoClient } = require("mongodb");

const MONGO_URL = "mongodb://127.0.0.1:27017"; // local MongoDB
const DB_NAME = "mockbuster_db";

let db = null;

const ADMIN = {
  email: "admin@mockbuster.com",
  password: "admin123",
  name: "Admin User",
  role: "admin",
};

// Seed admin user (defined outside connectDB)
async function seedAdminUser(db) {
  const usersCollection = db.collection("users");

  // optional but recommended: unique email
  await usersCollection.createIndex({ email: 1 }, { unique: true });

  const existingAdmin = await usersCollection.findOne({ email: ADMIN.email });

  if (!existingAdmin) {
    await usersCollection.insertOne(ADMIN);
    console.log("Admin user seeded:", ADMIN.email);
  } else {
    // Ensure they remain admin (in case role was changed)
    await usersCollection.updateOne(
      { email: ADMIN.email },
      { $set: { role: "admin" } }
    );
    console.log("Admin user already exists:", ADMIN.email);
  }
}

// Connect to MongoDB ONCE and reuse the connection
async function connectDB() {
  if (db) return db;

  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();

    db = client.db(DB_NAME);
    console.log("Connected to MongoDB:", DB_NAME);

    // IMPORTANT: seed BEFORE returning
    await seedAdminUser(db);

    return db;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
}

// Called by routes to access the DB
function getDB() {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first!");
  }
  return db;
}

module.exports = { connectDB, getDB };