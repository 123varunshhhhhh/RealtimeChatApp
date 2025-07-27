import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { FaEye, FaEyeSlash, FaComments } from "react-icons/fa";
import { motion } from "framer-motion";

// Glowing colors
const glowColors = ["#0ea5e9", "#0284c7", "#38bdf8", "#60a5fa", "#bae6fd"];

// Animated Text for "Chatly"
const AnimatedText = ({ text }) => {
  const letters = Array.from(text);
  return (
    <div className="flex flex-wrap justify-center font-extrabold text-3xl tracking-wide text-white select-none max-w-full overflow-hidden">
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ textShadow: "0 0 0px transparent" }}
          animate={{
            textShadow: [
              "0 0 0px transparent",
              `0 0 6px ${glowColors[index % glowColors.length]}`,
              `0 0 12px ${glowColors[index % glowColors.length]}`,
              `0 0 6px ${glowColors[index % glowColors.length]}`,
              "0 0 0px transparent",
            ],
            color: ["#ffffff", glowColors[index % glowColors.length], "#ffffff"],
          }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 2.5,
            delay: index * 0.25,
            ease: "easeInOut",
          }}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
};

function SignUp() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [show, setShow] = useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { userName, email, password },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate("/profile");
      setEmail("");
      setPassword("");
      setErr("");
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] px-4"
      style={{ perspective: "1200px" }}
    >
      <motion.div
        className="max-w-md w-full bg-white rounded-3xl p-8  border border-[#0ea5e9] relative shadow-xl"
        initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        whileHover={{
          rotateY: 10,
          scale: 1.05,
          boxShadow:
            "0 20px 30px rgba(14, 165, 233, 0.6), 0 0 25px rgba(14, 165, 233, 0.5)",
        }}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col items-center justify-center mb-8 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] p-6 rounded-2xl shadow-lg text-white relative max-w-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            boxShadow: "0 0 30px 10px rgba(14, 165, 233, 0.4)",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 8,
              ease: "linear",
            }}
          >
            <FaComments className="text-4xl mb-2 text-white drop-shadow-[0_0_10px_#0ea5e9]" />
          </motion.div>

          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="text-2xl font-bold drop-shadow-[0_0_12px_#0ea5e9]">
              Welcome to
            </div>
            <AnimatedText text="Chatly" />
          </motion.div>

          <motion.p
            className="text-sm mt-2 drop-shadow-[0_0_7px_#d0e8ff]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Create your account below
          </motion.p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="flex flex-col gap-6">
          <input
            type="text"
            placeholder="Username"
            className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
            onChange={(e) => setUserName(e.target.value)}
            value={userName}
            required
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />

          <div className="relative w-full">
            <input
              type={show ? "text" : "password"}
              placeholder="Password"
              className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <span
              className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#0284c7] hover:text-[#0ea5e9] transition text-xl"
              onClick={() => setShow((prev) => !prev)}
              title={show ? "Hide password" : "Show password"}
            >
              {show ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {err && (
            <p className="text-red-500 text-sm font-semibold text-center">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-[0_0_15px_#0ea5e9] transition"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default SignUp;
