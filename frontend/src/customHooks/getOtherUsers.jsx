// customHooks/getOtherUsers.jsx
import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setOtherUsers } from "../redux/userSlice";
import { serverUrl } from "../main";

const GetOtherUsers = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/user/others`, {
          withCredentials: true,
        });
        dispatch(setOtherUsers(res.data));
      } catch (err) {
        console.error("❌ Error fetching other users:", err);
      }
    };

    if (userData?._id) fetchUsers();
  }, [userData, dispatch]);

  return null;
};

export default GetOtherUsers;
