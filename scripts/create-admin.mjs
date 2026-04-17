import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}.${hash}`;
}

async function createAdmin() {
  loadEnvFile(envPath);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const username = process.env.ADMIN_USERNAME || "teacher1";
  const password = process.env.ADMIN_PASSWORD || "securePassword123";
  const avatarUrl = process.env.ADMIN_AVATAR_URL || "https://via.placeholder.com/48";

  const userSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, unique: true, trim: true },
      avatarUrl: { type: String, required: true },
      emojiIds: { type: [String], required: true },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved", index: true },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
      rejectionReason: { type: String, default: null },
      isAdmin: { type: Boolean, default: false, index: true },
      passwordHash: { type: String, default: null },
    },
    { timestamps: true },
  );

  const User = mongoose.models.User || mongoose.model("User", userSchema);

  await mongoose.connect(uri, { bufferCommands: false });

  const passwordHash = hashPassword(password);

  await User.findOneAndUpdate(
    { username },
    {
      username,
      avatarUrl,
      emojiIds: ["cat", "dog", "lion"],
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: null,
      rejectionReason: null,
      isAdmin: true,
      passwordHash,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  console.log(`Admin user upserted: ${username}`);
  console.log("Use ADMIN_USERNAME / ADMIN_PASSWORD in .env.local to override defaults.");

  await mongoose.disconnect();
}

createAdmin().catch(async (error) => {
  console.error(error.message || error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});

