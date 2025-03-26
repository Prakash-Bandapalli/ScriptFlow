import mongoose from "mongoose";

const scriptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  script: { type: String, required: true },
  score: { type: Number, required: true },
  validation: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ScriptModel = mongoose.model("Script", scriptSchema);
