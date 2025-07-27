import React, { useState } from "react";

const GroupCreateModal = ({ open, onClose, users, onCreate }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [preview, setPreview] = useState(null);

  if (!open) return null;

  const handleImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleUserToggle = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || selectedUsers.length === 0) return;
    onCreate({ name, image, members: selectedUsers });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center">
      <div className="bg-white/30 backdrop-blur-2xl rounded-2xl p-8 w-full max-w-md shadow-2xl relative border border-white/30">
        <button className="absolute top-2 right-2 text-2xl text-gray-700 hover:text-red-500" onClick={onClose}>&times;</button>
        <h2 className="text-3xl font-extrabold mb-4 text-gray-800 tracking-tight">Create Group</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            required
          />
          <input type="file" accept="image/*" onChange={handleImage} className="rounded-xl bg-white/40 p-2" />
          {preview && typeof preview === "string" && preview.trim() !== "" && (
            <img src={preview} alt="preview" className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-blue-300 shadow-lg" />
          )}
          <div className="max-h-40 overflow-y-auto border rounded-xl p-2 bg-white/40">
            <span className="block mb-2 font-semibold text-gray-700">Add Members:</span>
            {users && users.length > 0 ? (
              users.map((user) => (
                <label key={user._id} className="flex items-center gap-2 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserToggle(user._id)}
                    className="accent-blue-500 w-4 h-4 rounded-full"
                  />
                  {user.image && typeof user.image === "string" && user.image.trim() !== "" ? (
                    <img src={user.image} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : null}
                  <span>{user.name}</span>
                </label>
              ))
            ) : (
              <span className="text-gray-400">No users available</span>
            )}
          </div>
          <button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition">Create</button>
        </form>
      </div>
    </div>
  );
};

export default GroupCreateModal; 