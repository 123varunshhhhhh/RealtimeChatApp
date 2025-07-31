import { useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setConversations } from "../redux/userSlice";
import { serverUrl } from "../main";

const GetConversations = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/message/conversations`, {
          withCredentials: true,
        });
        console.log("✅ Fetched conversations:", res.data.length);
        dispatch(setConversations(res.data));
      } catch (err) {
        console.error("❌ Error fetching conversations:", err);
      }
    };

    if (userData?._id) {
      // Clear any existing timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // Add a small delay to ensure user is fully authenticated
      fetchTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Fetching conversations for user:", userData._id);
        fetchConversations();
      }, 1000);
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [userData?._id, dispatch]);

  return null;
};

export default GetConversations; 