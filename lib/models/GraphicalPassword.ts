import { model, models, Schema, type InferSchemaType } from "mongoose";

const graphicalPasswordSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    emojiIds: { type: [String], required: true },
  },
  {
    timestamps: true,
  },
);

export type GraphicalPasswordDocument = InferSchemaType<typeof graphicalPasswordSchema>;

const GraphicalPassword =
  models.GraphicalPassword || model("GraphicalPassword", graphicalPasswordSchema);

export default GraphicalPassword;

