// customHooks/getCurrentUser.jsx
import { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../main";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useNavigate } from "react-router-dom";

const GetCurrentUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, {
          withCredentials: true,
        });
        dispatch(setUserData(result.data));
      } catch (error) {
        // If 400 error, redirect to login
        if (error.response && error.response.status === 400) {
          navigate("/login");
        }
        console.error("❌ Error fetching current user:", error);
      }
    };

    fetchUser();
  }, [dispatch, navigate]);

  return null;
};

export default GetCurrentUser;
