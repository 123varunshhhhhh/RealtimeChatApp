import Group from "../models/group.model.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import Message from "../models/message.model.js";

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    let members = req.body.members;
    if (!Array.isArray(members)) {
      members = members ? [members] : [];
    }
    // Always include the creator as a member and admin
    const creator = req.userId;
    if (!members.includes(creator)) members.push(creator);
    let image = "";
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }
    const group = await Group.create({
      name,
      image,
      members,
      admins: [creator],
      createdBy: creator
    });
    res.status(201).json({ group });
  } catch (error) {
    res.status(500).json({ message: `create group error ${error}` });
  }
};

export const addGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ message: "Only admins can add members" });
    if (!group.members.includes(userId)) group.members.push(userId);
    await group.save();
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: `add member error ${error}` });
  }
};

export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ message: "Only admins can remove members" });
    group.members = group.members.filter(m => m.toString() !== userId);
    group.admins = group.admins.filter(a => a.toString() !== userId);
    await group.save();
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: `remove member error ${error}` });
  }
};

export const updateGroupInfo = async (req, res) => {
  try {
    const { groupId, name } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.userId)) return res.status(403).json({ message: "Only admins can update group" });
    if (name) group.name = name;
    if (req.file) {
      group.image = await uploadOnCloudinary(req.file.path);
    }
    await group.save();
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: `update group error ${error}` });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Group.find({ members: userId });
    // For each group, count unread messages for the user
    const groupsWithUnread = await Promise.all(
      groups.map(async (group) => {
        const unreadCount = await Message.countDocuments({
          groupId: group._id,
          sender: { $ne: userId },
          $or: [
            { seenBy: { $exists: false } },
            { seenBy: { $ne: userId } },
          ],
        });
        return {
          ...group.toObject(),
          unreadCount,
        };
      })
    );
    res.status(200).json({ groups: groupsWithUnread });
  } catch (error) {
    res.status(500).json({ message: `get user groups error ${error}` });
  }
}; 