import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET;

// 🔗 MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// 👤 User Schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: "user" }
});
const User = mongoose.model("User", userSchema);

// 📦 Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String
});
const Product = mongoose.model("Product", productSchema);

// 🟢 Home
app.get("/", (req, res) => {
  res.send("🚀 Market Databank API Running Successfully");
});

// 🔐 Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      username: req.body.username,
      password: hashed,
      role: req.body.role || "user"
    });

    await user.save();

    res.status(201).json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔐 Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔒 Auth Middleware
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Access Denied" });
  }

  const token = header.split(" ")[1]; // Bearer token

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(400).json({ message: "Invalid Token" });
  }
}

// 🔒 Admin Only
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

// ✅ CREATE
app.post("/api/products", auth, isAdmin, async (req, res) => {
  await new Product(req.body).save();
  res.json({ message: "Product added" });
});

// ✅ READ
app.get("/api/products", auth, async (req, res) => {
  res.json(await Product.find());
});

// ✅ UPDATE
app.put("/api/products/:id", auth, isAdmin, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.json({ message: "Updated" });
});

// ✅ DELETE
app.delete("/api/products/:id", auth, isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// 📥 EXPORT CSV
app.get("/api/export", auth, async (req, res) => {
  const data = await Product.find();

  let csv = "Name,Price,Category\n";
  data.forEach(item => {
    csv += `${item.name},${item.price},${item.category}\n`;
  });

  res.header("Content-Type", "text/csv");
  res.attachment("data.csv");
  res.send(csv);
});

// 🤖 PREDICT
app.get("/api/predict", auth, async (req, res) => {
  const data = await Product.find();

  if (data.length < 2) {
    return res.status(400).json({ message: "Not enough data" });
  }

  let n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach((d, i) => {
    let x = i + 1, y = d.price;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  let intercept = (sumY - slope * sumX) / n;

  let prediction = slope * (n + 1) + intercept;

  res.json({ predictedPrice: Math.round(prediction) });
});

app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));