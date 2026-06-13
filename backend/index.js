const express = require("express");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const nodemailer = require("nodemailer");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT;
const SECRET_KEY = process.env.JWT_SECRET;
const AUTH_PASS = process.env.AUTH_PASS;

app.use(express.json());
app.use(cors());

app.listen(PORT, () => console.log(`Server listening on PORT ${PORT}`));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "angelorafael0508@gmail.com",
    pass: AUTH_PASS ,
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

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  let sql = "INSERT INTO users (email, passwd) VALUES (?, ?)";

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    let sql = "INSERT INTO users (email, passwd) values (?, ?)";

    await db.execute(sql, [email, hashedPassword]);
    res.status(200).send("User Created");
  } catch (err) {
    console.log(err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).send("Email already exists");
    }
    res.status(500).send("Error creating user");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password required");
  }

  try {
    let sql = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(sql, [email]);

    if (rows.length === 0) {
      return res.status(401).send("Invalid Credentials");
    }

    const users = rows[0];

    const isMatch = await bcrypt.compare(password, users.passwd);
    if (!isMatch) {
      return res.status(401).send("Invalid Credentials");
    }

    const token = jwt.sign({ id: users.id, email: users.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.log(err);
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

  // 1. Basic validation
  if (!email || !otp || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 2. Check OTP (valid & not expired)
    const [rows] = await db.query(
      "SELECT * FROM otp_codes WHERE email = ? AND otp = ? AND expires_at > NOW()",
      [email, otp],
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
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

    // 5. Delete OTP after success
    await db.query("DELETE FROM otp_codes WHERE email = ? AND otp = ?", [
      email,
      otp,
    ]);

    // 6. Success response
    res.json({ message: "User created successfully" });
  } catch (err) {
    console.log("VERIFY OTP ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});
