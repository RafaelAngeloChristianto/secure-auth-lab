import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRef, useState } from "react";
import caligraphy from "../../public/caligraphy_white.png";

function OTPScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);

  const navigate = useNavigate();

  const { state } = useLocation();
  const email = state?.email;
  const password = state?.password;

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputsRef.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length != 6) {
      alert("Enter full OTP!");
      return;
    }

    try {
      await axios.post("http://localhost:3000/verify-otp", {
        email,
        otp: finalOtp,
        password
      });

      alert("OTP Verified!");
      navigate("/home");
    } catch {
      alert("Invalid or Expired OTP");
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col justify-center items-center ml-auto mr-auto w-[50%]">
        <h3 className="text-[20px] mb-[20px]">
          Please check your email and enter the OTP code.
        </h3>

        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-[40px] h-[40px] border-[1px] rounded-[5px] text-center"
            />
          ))}
        </div>

        <input
          type="submit"
          className="w-[250px] h-[50px] bg-[#1F305E] text-white rounded-[10px] mt-[40px] hover:cursor-pointer"
          onClick={handleSubmit}
        />
      </div>
      <div className="flex w-[50%] ml-auto bg-[#1F305E] items-center justify-center gap-6 p-8">
        <img className="w-[250px] h-[250px]" src={caligraphy} alt="" />
      </div>
    </div>
  );
}

export default OTPScreen;
