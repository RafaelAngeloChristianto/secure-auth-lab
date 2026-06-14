import axios from "axios";
import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

function HomeScreen() {
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await axios.get("http://localhost:3000/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(res.data);
      } catch (error) {
        console.error("Error fetching data:", error);

        console.log("Unauthorized or error");

        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    };

    fetchData();
  }, []);

  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className="flex min-h-screen justify-center items-center flex-col">
      <h1>Welcome!</h1>

      <button
        className="w-[250px] h-[50px] bg-[#1F305E] text-white rounded-[10px] mt-[20px] hover:cursor-pointer"
        onClick={logout}
      >
        Logout
      </button>
    </div>
  );
}

export default HomeScreen;
