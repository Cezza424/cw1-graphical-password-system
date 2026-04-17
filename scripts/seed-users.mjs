import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env.local");
const seedPath = path.join(rootDir, "lib", "seed-users.json");

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

async function run() {
  loadEnvFile(envPath);

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  const users = JSON.parse(fs.readFileSync(seedPath, "utf8"));

  const userSchema = new mongoose.Schema(
    {
      username: { type: String, required: true, unique: true, trim: true },
      avatarUrl: { type: String, required: true },
      emojiIds: { type: [String], required: true },
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved", index: true },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
      rejectionReason: { type: String, default: null },
    },
    { timestamps: true },
  );

  const User = mongoose.models.User || mongoose.model("User", userSchema);

  await mongoose.connect(uri, { bufferCommands: false });

  for (const user of users) {
    await User.findOneAndUpdate(
      { username: user.username },
      {
        username: user.username,
        avatarUrl: user.avatarUrl,
        emojiIds: user.emojiIds,
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: null,
        rejectionReason: null,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const total = await User.countDocuments();
  console.log(`Seeded ${users.length} users. Total users in collection: ${total}`);

  await mongoose.disconnect();
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});


