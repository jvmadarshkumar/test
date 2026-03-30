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

const SECRET = "secret123";

// 🔗 MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// 👤 Admin Schema
const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: "user" }
});
const Admin = mongoose.model("Admin", adminSchema);

// 📦 Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  category: String
});
const Product = mongoose.model("Product", productSchema);

app.get("/", (req, res) => {
  res.send("🚀 Market Databank API Running Successfully");
});

// 🔐 Register
app.post("/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = new Admin({
    username: req.body.username,
    password: hashed,
    role: req.body.role || "user"
  });
  await user.save();
  res.send("User Created");
});

// 🔐 Login
app.post("/login", async (req, res) => {
  const user = await Admin.findOne({ username: req.body.username });
  if (!user) return res.send("User not found");

  const valid = await bcrypt.compare(req.body.password, user.password);
  if (!valid) return res.send("Wrong password");

  const token = jwt.sign({ id: user._id, role: user.role }, SECRET);
  res.json({ token });
});

// 🔒 Auth Middleware
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.send("Access Denied");

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.send("Invalid Token");
  }
}

// 🔒 Admin Only
function isAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.send("Admin only");
  next();
}

// ✅ CREATE
app.post("/add", auth, isAdmin, async (req, res) => {
  await new Product(req.body).save();
  res.send("Added");
});

// ✅ READ
app.get("/data", auth, async (req, res) => {
  res.json(await Product.find());
});

// ✅ UPDATE
app.put("/update/:id", auth, isAdmin, async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, req.body);
  res.send("Updated");
});

// ✅ DELETE
app.delete("/delete/:id", auth, isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send("Deleted");
});

// 📥 EXPORT CSV
app.get("/export", auth, async (req, res) => {
  const data = await Product.find();
  let csv = "Name,Price,Category\n";

  data.forEach(item => {
    csv += `${item.name},${item.price},${item.category}\n`;
  });

  res.header("Content-Type", "text/csv");
  res.attachment("data.csv");
  res.send(csv);
});

// 🤖 PREDICT (Linear Regression)
app.get("/predict", auth, async (req, res) => {
  const data = await Product.find();
  if (data.length < 2) return res.send("Not enough data");

  let n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach((d, i) => {
    let x = i + 1, y = d.price;
    sumX += x; sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  let intercept = (sumY - slope * sumX) / n;

  let prediction = slope * (n + 1) + intercept;

  res.json({ predictedPrice: Math.round(prediction) });
});

app.listen(PORT, () => console.log("Server running"));