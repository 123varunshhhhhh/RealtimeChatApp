import React, { useRef, useState } from 'react';
import dp from "../assets/dp.webp";
import { IoCameraOutline } from "react-icons/io5";
import { useDispatch, useSelector } from 'react-redux';
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../main';
import { setUserData } from '../redux/userSlice';

function Profile() {
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState(userData.name || "");
  const [about, setAbout] = useState(userData.about || "");
  const [frontendImage, setFrontendImage] = useState(userData.image || dp);
  const [backendImage, setBackendImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const image = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("about", about);
      if (backendImage) formData.append("image", backendImage);

      const result = await axios.put(`${serverUrl}/api/user/profile`, formData, {
        withCredentials: true
      });

      dispatch(setUserData(result.data));
      navigate("/");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex flex-col justify-center items-center px-4 relative">

      <IoIosArrowRoundBack
        className="absolute top-6 left-6 text-white w-10 h-10 cursor-pointer hover:scale-110 transition-all"
        onClick={() => navigate("/")}
      />

      {/* Profile Image */}
      <div className="relative mb-6" onClick={() => image.current.click()}>
        <div className="w-36 h-36 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-all">
          <img src={frontendImage} alt="Profile" className="w-28 h-28 rounded-full object-cover" />
        </div>
        <div className="absolute bottom-1 right-1 bg-gradient-to-r from-cyan-400 to-blue-400 p-1 rounded-full shadow-md">
          <IoCameraOutline className="text-white w-5 h-5" />
        </div>
        <input type="file" hidden accept="image/*" ref={image} onChange={handleImage} />
      </div>

      {/* Profile Form */}
      <form
        className="w-full max-w-md flex flex-col items-center gap-4"
        onSubmit={handleProfile}
      >
        <input
          type="text"
          placeholder="Full Name"
          className="w-full h-12 rounded-xl px-4 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          rows={3}
          placeholder="Tell us about yourself..."
          className="w-full rounded-xl px-4 py-2 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />

        <input
          type="text"
          readOnly
          value={userData?.userName}
          className="w-full h-12 rounded-xl px-4 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />

        <input
          type="email"
          readOnly
          value={userData?.email}
          className="w-full h-12 rounded-xl px-4 bg-white/10 text-white placeholder:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />

        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold px-6 py-2 rounded-full shadow-xl hover:scale-105 transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default Profile;
