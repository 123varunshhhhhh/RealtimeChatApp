import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { FaEye, FaEyeSlash, FaComments } from "react-icons/fa";
import { motion, useMotionValue, useTransform } from "framer-motion";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // Motion values for interactive flipping
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const result = await axios.post(
        `${serverUrl}/api/auth/signup`,
        { userName, name, email, password },
        { withCredentials: true }
      );
      
      // Set user data first
      dispatch(setUserData(result.data));
      
      // Clear form
      setEmail("");
      setPassword("");
      setUserName("");
      setName("");
      
      // Navigate after a small delay to ensure state is updated
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
      
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
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#0ea5e9] relative shadow-xl"
        initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 20px 30px rgba(14, 165, 233, 0.6), 0 0 25px rgba(14, 165, 233, 0.5)",
        }}
        whileTap={{
          scale: 0.98,
          rotateY: isFlipped ? -180 : 180,
        }}
      >
        {/* Interactive Flip Button */}
        <motion.button
          className="absolute top-4 right-4 w-8 h-8 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFlipped(!isFlipped)}
          title="Flip card"
        >
          🔄
        </motion.button>

        {/* Front Side */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ backfaceVisibility: "hidden" }}
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
            <motion.input
              type="text"
              placeholder="Full Name"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />

            <motion.input
              type="text"
              placeholder="Username"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
              onChange={(e) => setUserName(e.target.value)}
              value={userName}
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />

            <motion.input
              type="email"
              placeholder="Email"
              className="w-full px-5 py-3 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            />

            <div className="relative w-full">
              <motion.input
                type={show ? "text" : "password"}
                placeholder="Password"
                className="w-full px-5 py-3 pr-12 rounded-xl border border-gray-300 focus:border-[#0284c7] focus:ring-2 focus:ring-[#0ea5e9] outline-none text-gray-700 transition hover:shadow-[0_0_10px_#0ea5e9]"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#0284c7] hover:text-[#0ea5e9] transition text-xl"
                onClick={() => setShow((prev) => !prev)}
                title={show ? "Hide password" : "Show password"}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {show ? <FaEyeSlash /> : <FaEye />}
              </motion.span>
            </div>

            {err && (
              <motion.p 
                className="text-red-500 text-sm font-semibold text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {err}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-bold py-3 rounded-xl shadow-md hover:shadow-[0_0_15px_#0ea5e9] transition"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </motion.button>
          </form>
        </motion.div>

        {/* Back Side */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-3xl p-8 flex flex-col items-center justify-center text-white"
          animate={{ rotateY: isFlipped ? 0 : -180 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 10,
                ease: "linear",
              }}
              className="text-6xl mb-4"
            >
              🚀
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Join Chatly!</h2>
            <p className="text-lg mb-6 text-center">
              Connect with friends, share stories, and chat in real-time
            </p>
            <motion.div
              className="grid grid-cols-2 gap-4 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">💬</div>
                <div>Real-time Chat</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📸</div>
                <div>Story Sharing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">👥</div>
                <div>Group Chats</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔒</div>
                <div>Secure</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default SignUp;
