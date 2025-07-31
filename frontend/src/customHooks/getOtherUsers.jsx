// customHooks/getOtherUsers.jsx
import { useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setOtherUsers } from "../redux/userSlice";
import { serverUrl } from "../main";

const GetOtherUsers = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const fetchTimeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const fetchUsers = async () => {
    try {
      console.log("🔄 Fetching other users...");
      const res = await axios.get(`${serverUrl}/api/user/others`, {
        withCredentials: true,
      });
      console.log("✅ Fetched other users:", res.data.length);
      dispatch(setOtherUsers(res.data));
    } catch (err) {
      console.error("❌ Error fetching other users:", err);
    }
  };

  useEffect(() => {
    if (userData?._id) {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Add a small delay to ensure user is fully authenticated
      fetchTimeoutRef.current = setTimeout(() => {
        fetchUsers();
      }, 500);

      // Set up periodic refresh every 30 seconds to ensure new users are fetched
      refreshIntervalRef.current = setInterval(() => {
        fetchUsers();
      }, 30000);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [userData?._id, dispatch]);

  return null;
};

export default GetOtherUsers;
