import { model, models, Schema, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    avatarUrl: { type: String, required: true },
    emojiIds: { type: [String], required: true },
    // Admin fields (optional - only present for admin users)
    isAdmin: { type: Boolean, default: false, index: true },
    passwordHash: { type: String, default: null }, // PBKDF2 hash for admin users
  },
  {
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

const User = models.User || model("User", userSchema);

export default User;

