// db.js
const { MongoClient } = require("mongodb");

const MONGO_URL = "mongodb://127.0.0.1:27017"; // local MongoDB
const DB_NAME = "mockbuster_db";

let db = null;

const ADMIN = {
  username: "admin",
  email: "admin@mockbuster.com",
  password: "admin123",
  name: "Admin User",
  role: "admin",
};

// Seed admin user (defined outside connectDB)
async function seedAdminUser(db) {
  const users = db.collection("users");

  const hashed = await bcrypt.hash(ADMIN.password, 10);

  // find by username since login uses username
  const existing = await users.findOne({ username: ADMIN.username });

  if (!existing) {
    await users.insertOne({ ...ADMIN, password: hashed });
  } else {
    // keep them admin + keep password compatible with bcrypt login
    await users.updateOne(
      { username: ADMIN.username },
      { $set: { role: "admin", password: hashed, email: ADMIN.email, name: ADMIN.name } }
    );
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