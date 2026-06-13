const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const axios = require("axios");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT;
const SECRET_KEY = process.env.JWT_SECRET;
const AUTH_PASS = process.env.AUTH_PASS;

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log(`Server listening on PORT ${PORT}`));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many login attempts. Try again later",
});
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many OTP requests. Try again later",
});
app.use("/login", loginLimiter);
app.use("/verify-otp", otpLimiter);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "angelorafael0508@gmail.com",
    pass: AUTH_PASS,
  },
});

const sendOtp = async (email, otp) => {
  await transporter.sendMail({
    from: "angelorafael0508@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. Please do not share this with anyone.`,
  });
};

app.post("/login", async (req, res) => {
  console.log("=== LOGIN ROUTE TRIGGERED ===");
  const { email, password, captchaToken } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password required");
  }

  if (!captchaToken) {
    return res.status(400).send("Captcha token required");
  }

  try {
    console.log("Incoming login:", { email, captchaToken });
    const captchaRes = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        },
      },
    );

    console.log("Captcha response:", captchaRes.data);

    const captchaData = captchaRes.data;
    const score = captchaData.score;

    console.log("Captcha score:", score);
    if (score < 0.5) {
      return res.status(403).send("Suspicious activity");
    }
    if (score < 0.7) {
      return res.json({ requireOTP: true });
    }
    if (!captchaRes.data.success) {
      return res.status(403).send("Captcha verification failed");
    }

    let sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).send("Invalid Credentials");
    }

    const user = rows[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).send("Account locked. Try again later");
    }

    console.log("Stored password:", user.passwd);
    const isMatch = await bcrypt.compare(password, user.passwd);
    if (!isMatch) {
      let failedAttempts = (user.failed_attempts || 0) + 1;

      console.log("Failed attempts:", failedAttempts);

      if (failedAttempts >= 5) {
        await db.execute(
          "UPDATE users SET failed_attempts = 0, locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?",
          [user.id],
        );

        return res.status(403).json({
          code: "ACCOUNT_LOCKED",
          message:
            "Too many failed attempts. Your account is locked for 15 minutes.",
        });
      }

      await db.execute("UPDATE users SET failed_attempts = ? WHERE id = ?", [
        failedAttempts,
        user.id,
      ]);

      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    await db.execute(
      "UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?",
      [user.id],
    );

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ jwtToken });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in");
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("No token");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).send("Invalid token");
  }
}

app.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome to your dashboard, ${req.user.email}` });
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post("/request-otp", async (req, res) => {
  const { email } = req.body;

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.query(
    "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?)",
    [email, otp, expiresAt],
  );

  await sendOtp(email, otp);

  res.json({ message: "OTP Sent" });
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM otp_codes WHERE email = ? AND otp = ? AND expires_at > NOW()",
      [email, otp],
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await db.execute("INSERT INTO users (email, passwd) VALUES (?, ?)", [
        email,
        hashedPassword,
      ]);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "User already exists" });
      }
      console.log("REGISTER ERROR:", err);
      return res.status(500).json({ error: "Error creating user" });
    }

    await db.query("DELETE FROM otp_codes WHERE email = ? AND otp = ?", [
      email,
      otp,
    ]);

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});
