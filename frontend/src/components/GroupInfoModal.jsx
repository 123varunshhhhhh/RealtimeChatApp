import React, { useState } from "react";
import dp from "../assets/dp.webp";

const GroupInfoModal = ({ open, onClose, group, allUsers, userId, onUpdate, onAddMember, onRemoveMember }) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(group?.name || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(group?.image || null);
  const isAdmin = group?.admins?.includes(userId);

  if (!open || !group) return null;

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : group.image);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    onUpdate({ name, image });
    setEditMode(false);
  };

  const availableUsers = allUsers.filter(u => !group.members.includes(u._id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative">
        <button className="absolute top-2 right-2 text-2xl" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Group Info</h2>
        <div className="flex flex-col items-center mb-4">
          <img src={preview || dp} alt={name} className="w-20 h-20 rounded-full object-cover mb-2" />
          {editMode ? (
            <>
              <input type="file" accept="image/*" onChange={handleImage} />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2 border rounded mt-2"
              />
            </>
          ) : (
            <h3 className="font-semibold text-lg">{group.name}</h3>
          )}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Members ({group.members.length}):</span>
          <ul className="max-h-32 overflow-y-auto mt-2">
            {group.members.map(memberId => {
              const user = allUsers.find(u => u._id === memberId) || {};
              return (
                <li key={memberId} className="flex items-center gap-2 mb-1">
                  <img src={user.image || dp} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  <span>{user.name || memberId}</span>
                  {isAdmin && memberId !== userId && (
                    <button className="ml-auto text-xs text-red-500" onClick={() => onRemoveMember(memberId)}>Remove</button>
                  )}
                  {group.admins.includes(memberId) && <span className="ml-2 text-xs text-blue-500">Admin</span>}
                </li>
              );
            })}
          </ul>
        </div>
        {isAdmin && (
          <>
            <div className="mb-4">
              <span className="font-semibold">Add Members:</span>
              <ul className="max-h-24 overflow-y-auto mt-2">
                {availableUsers.length > 0 ? availableUsers.map(user => (
                  <li key={user._id} className="flex items-center gap-2 mb-1">
                    <img src={user.image || dp} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    <span>{user.name}</span>
                    <button className="ml-auto text-xs text-green-600" onClick={() => onAddMember(user._id)}>Add</button>
                  </li>
                )) : <span className="text-gray-400 text-xs">No users to add</span>}
              </ul>
            </div>
            <button className="bg-blue-500 text-white py-2 rounded w-full mb-2" onClick={() => setEditMode(!editMode)}>{editMode ? "Cancel" : "Edit Group"}</button>
            {editMode && <button className="bg-green-500 text-white py-2 rounded w-full" onClick={handleUpdate}>Save Changes</button>}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupInfoModal; 