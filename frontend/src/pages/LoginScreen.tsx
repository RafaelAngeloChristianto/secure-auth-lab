import { Link } from "react-router-dom";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import caligraphy from "../../public/caligraphy_white.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState();

  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleLogin = async (e) => {
    console.log("LOGIN BUTTON CLICKED");
    e.preventDefault();
    console.log(email, password);

    if (!executeRecaptcha) {
      alert("Recaptcha not ready");
      return;
    }

    const token = await executeRecaptcha("login");
    console.log("Captcha token:", token);
    if (!token) {
      alert("Failed to get captcha token");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/login", {
        email: email,
        password: password,
        captchaToken: token,
      });

      if (res.data.jwtToken) {
        res.cookie("token", jwt, {
          httpOnly: true,
          secure: true,
          sameSite: "Strict",
        });
        navigate("/home");
      } else if (res.data.requireOTP) {
        navigate("/otpscreen");
      } else {
        alert("Invalid Credentials");
      }
      console.log(res.data);
    } catch (error) {
      const data = error.response?.data;

      if (data?.code === "ACCOUNT_LOCKED") {
        alert(
          "Account locked after 5 failed login attempts. Try again in 15 minutes.",
        );
      } else {
        alert(data?.message || "Invalid Credentials");
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-[50%] mr-auto bg-[#1F305E] items-center justify-center gap-6 p-8">
        <img className="w-[250px] h-[250px]" src={caligraphy} alt="" />
      </div>
      <div className="flex ml-auto w-[50%] min-h-screen flex-col items-center justify-center gap-6 p-8">
        <form
          className="flex flex-col items-center justify-center gap-6 p-8"
          onSubmit={handleLogin}
        >
          <label className="w-[350px] text-left mb-[-10px]" htmlFor="email">
            Email:{" "}
          </label>
          <input
            type="text"
            placeholder="Type your email here..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-[350px] h-[45px] rounded-[10px] border-[1px] p-[5px]"
            required
          />

          <label
            className="w-[350px] text-left mt-[10px] mb-[-10px]"
            htmlFor="password"
          >
            Password:{" "}
          </label>
          <div className="relative w-[350px]">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Type your password here..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[45px] rounded-[10px] border-[1px] pr-10 p-[5px]"
              required
            />

            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
            >
              {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
            </button>
          </div>

          <input
            className="w-[250px] h-[50px] bg-[#1F305E] text-white rounded-[10px] mt-[20px] hover:cursor-pointer"
            type="submit"
            value="Login"
          />

          <p>
            Do not have an account yet?{" "}
            <Link
              to="/signup"
              className="text-[#1F305E] font-bold hover:cursor-pointer"
            >
              Sign Up Here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
