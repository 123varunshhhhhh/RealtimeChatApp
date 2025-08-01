import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);
export default Group; 