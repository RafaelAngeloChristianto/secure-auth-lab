import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import caligraphy from "../../public/caligraphy_white.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log(email, password);
    if (!email.includes("@")) {
      alert("Invalid email");
      return;
    }

    const unmetRules = rules.filter((rule) => !rule.met);

    if (unmetRules.length > 0) {
      alert(
        "Password does not meet requirements:\n" +
          unmetRules.map((r) => `- ${r.label}`).join("\n"),
      );
      return;
    }

    try {
      await axios.post("http://localhost:3000/request-otp", {
        email: email,
      });
      navigate("/otpscreen", { state: { email, password } });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const rules = useMemo(() => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains a number", met: /\d/.test(password) },
      {
        label: "Contains a special character",
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      },
    ];
  }, [password]);

  const score = rules.filter((rule) => rule.met).length;

  const getStrengthMetrics = () => {
    if (!password) return { width: "0%", color: "#e2e8f0", text: "None" };
    if (score <= 2) return { width: "20%", color: "#ef4444", text: "Weak" };
    if (score <= 4) return { width: "60%", color: "#f59e0b", text: "Medium" };
    return { width: "100%", color: "#22c55e", text: "Strong" };
  };

  const { width, color, text } = getStrengthMetrics();

  return (
    <div className="flex min-h-screen">
      <div className="flex w-[50%] mr-auto bg-[#1F305E] items-center justify-center gap-6 p-8">
        <img className="w-[250px] h-[250px]" src={caligraphy} alt="" />
      </div>
      <div className="flex ml-auto w-[50%] min-h-screen flex-col items-center justify-center gap-6 p-8">
        <form
          className="flex flex-col items-center justify-center gap-6 p-8"
          onSubmit={handleSignup}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 mt-[-50px] hover:cursor-pointer"
            >
              {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
            </button>
            <ul className="list-none pl-0 text-sm leading-5">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-center">
                  <span
                    className={`mr-2 ${rule.met ? "text-green-500" : "text-red-500"}`}
                  >
                    {rule.met ? "✓" : "✗"}
                  </span>
                  {rule.label}
                </li>
              ))}
            </ul>
          </div>

          <input
            className="w-[250px] h-[50px] bg-[#1F305E] text-white rounded-[10px] mt-[20px] hover:cursor-pointer"
            type="submit"
            value="Sign Up"
          />

          <p>
            Already have an account?{" "}
            <Link
              to="/"
              className="text-[#1F305E] font-bold hover:cursor-pointer"
            >
              Login Here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignUpScreen;
