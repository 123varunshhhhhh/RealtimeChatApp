import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setSelectedUser, setUserData } from "../redux/userSlice";
import { FaEye, FaEyeSlash, FaComments } from "react-icons/fa";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [fpStep, setFpStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [fpEmail, setFpEmail] = useState("");
  const [fpOTP, setFpOTP] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg] = useState("");
  const [fpErr, setFpErr] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
       `${serverUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      dispatch(setSelectedUser(null));
      navigate("/");
      setEmail("");
      setPassword("");
      setErr("");
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  // Forgot Password Handlers
  const handleForgotEmail = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    setFpErr("");
    try {
      await axios.post(`${serverUrl}/api/auth/forgot-password`, { email: fpEmail });
      setFpStep(2);
      setFpMsg("OTP sent to your email.");
    } catch (error) {
      setFpErr(error?.response?.data?.message || "Error sending OTP");
    }
    setFpLoading(false);
  };
  const handleForgotOTP = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    setFpErr("");
    try {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, { email: fpEmail, otp: fpOTP });
      setFpStep(3);
      setFpMsg("OTP verified. Enter new password.");
    } catch (error) {
      setFpErr(error?.response?.data?.message || "Invalid OTP");
    }
    setFpLoading(false);
  };
  const handleForgotReset = async (e) => {
    e.preventDefault();
    setFpLoading(true);
    setFpErr("");
    try {
      await axios.post(`${serverUrl}/api/auth/reset-password`, { email: fpEmail, otp: fpOTP, newPassword: fpNewPassword });
      setFpMsg("Password reset successful! You can now log in.");
      setTimeout(() => {
        setShowForgot(false);
        setFpStep(1);
        setFpEmail("");
        setFpOTP("");
        setFpNewPassword("");
        setFpMsg("");
        setFpErr("");
      }, 2000);
    } catch (error) {
      setFpErr(error?.response?.data?.message || "Error resetting password");
    }
    setFpLoading(false);
  };

  return (
    <div
      className={`min-h-screen w-full px-4 flex items-center justify-center transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-[#0f0f0f] via-[#1e1e1e] to-[#2e2e2e]"
          : "bg-gradient-to-br from-[#cbe8ff] via-[#e5f6ff] to-[#f1fcff]"
      }`}
    >
      {/* Toggle Switch */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-transparent text-2xl hover:scale-110 transition"
          title="Toggle dark/light mode"
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </div>

      {/* Login Card */}
      <div
        className={`w-full max-w-[480px] h-[580px] rounded-xl shadow-xl flex flex-col transition-all duration-500 ${
          darkMode ? "bg-[#1f1f1f] text-white" : "bg-white text-gray-800"
        }`}
      >
        {/* Header */}
        <motion.div
          className="w-full h-[190px] bg-[#20c7ff] rounded-b-[30%] shadow-md px-6 py-4 flex flex-col items-center justify-center relative"
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.div
            className="mb-2"
            initial={{ y: -40, scale: 0.5, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 1, type: "spring", bounce: 0.5 }}
          >
            <FaComments className="text-4xl drop-shadow-[0_0_10px_#ffffff]" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100 text-center flex items-center gap-2">
            Login to <span className="text-white ml-1">Chatly</span>
          </h1>
        </motion.div>

        {/* Form */}
        <form
          className="flex-1 px-6 py-6 flex flex-col gap-6 items-center justify-center"
          onSubmit={handleLogin}
        >
          <input
            type="email"
            placeholder="Email"
            className={`w-full px-4 py-3 border-2 rounded-lg shadow focus:outline-none text-base transition-all duration-300 ${
              darkMode
                ? "bg-[#2a2a2a] border-[#20c7ff] text-white focus:ring-[#20c7ff] hover:shadow-[0_0_10px_#20c7ff]"
                : "border-[#20c7ff] text-gray-700 focus:ring-2 focus:ring-[#20c7ff] hover:shadow-[0_0_10px_#20c7ff]"
            }`}
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />

          <div className="relative w-full">
            <input
              type={show ? "text" : "password"}
              placeholder="Password"
              className={`w-full px-4 py-3 pr-12 border-2 rounded-lg shadow text-base transition-all duration-300 ${
                darkMode
                  ? "bg-[#2a2a2a] border-[#20c7ff] text-white focus:ring-[#20c7ff] hover:shadow-[0_0_10px_#20c7ff]"
                  : "border-[#20c7ff] text-gray-700 focus:ring-2 focus:ring-[#20c7ff] hover:shadow-[0_0_10px_#20c7ff]"
              }`}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
            />
            <span
              className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-[#20c7ff] hover:text-[#128ab3] text-lg"
              onClick={() => setShow((prev) => !prev)}
              title={show ? "Hide password" : "Show password"}
            >
              {show ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Forgot Password Link */}
          <p
            className={`w-full text-right text-xs cursor-pointer mt-1 mb-2 ${darkMode ? "text-gray-300 hover:text-[#20c7ff]" : "text-gray-600 hover:text-[#20c7ff]"}`}
            onClick={() => setShowForgot(true)}
          >
            Forgot Password?
          </p>

          {err && (
            <p className="text-red-500 text-sm font-semibold text-center">
              * {err}
            </p>
          )}

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px #20c7ff, 0 0 40px #20c7ff",
            }}
            className="w-full py-3 bg-[#20c7ff] text-white font-semibold rounded-xl shadow-md transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </motion.button>

          <p
            onClick={() => navigate("/signup")}
            className={`text-sm mt-2 text-center cursor-pointer transition ${
              darkMode ? "text-gray-300 hover:text-[#20c7ff]" : "text-gray-600 hover:text-[#20c7ff]"
            }`}
          >
            Want to create a new account?{" "}
            <span className="font-semibold underline">Sign up</span>
          </p>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className={`w-full max-w-[350px] rounded-lg shadow-lg p-6 ${darkMode ? "bg-[#232323] text-white" : "bg-white text-gray-800"}`}>
            <button className="absolute top-2 right-4 text-xl" onClick={() => setShowForgot(false)}>&times;</button>
            <h2 className="text-lg font-bold mb-4 text-center">Forgot Password</h2>
            {fpStep === 1 && (
              <form onSubmit={handleForgotEmail} className="flex flex-col gap-4">
                <input type="email" placeholder="Enter your email" className="px-3 py-2 border rounded" value={fpEmail} onChange={e => setFpEmail(e.target.value)} required />
                <button className="bg-[#20c7ff] text-white py-2 rounded" disabled={fpLoading}>{fpLoading ? "Sending..." : "Send OTP"}</button>
                {fpErr && <p className="text-red-500 text-xs">{fpErr}</p>}
                {fpMsg && <p className="text-green-600 text-xs">{fpMsg}</p>}
              </form>
            )}
            {fpStep === 2 && (
              <form onSubmit={handleForgotOTP} className="flex flex-col gap-4">
                <input type="text" placeholder="Enter OTP" className="px-3 py-2 border rounded" value={fpOTP} onChange={e => setFpOTP(e.target.value)} required />
                <button className="bg-[#20c7ff] text-white py-2 rounded" disabled={fpLoading}>{fpLoading ? "Verifying..." : "Verify OTP"}</button>
                {fpErr && <p className="text-red-500 text-xs">{fpErr}</p>}
                {fpMsg && <p className="text-green-600 text-xs">{fpMsg}</p>}
              </form>
            )}
            {fpStep === 3 && (
              <form onSubmit={handleForgotReset} className="flex flex-col gap-4">
                <input type="password" placeholder="New Password" className="px-3 py-2 border rounded" value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} required />
                <button className="bg-[#20c7ff] text-white py-2 rounded" disabled={fpLoading}>{fpLoading ? "Resetting..." : "Reset Password"}</button>
                {fpErr && <p className="text-red-500 text-xs">{fpErr}</p>}
                {fpMsg && <p className="text-green-600 text-xs">{fpMsg}</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;