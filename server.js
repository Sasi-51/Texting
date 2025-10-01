const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const SECRET = "supersecretkey123";
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// Serve static files from the current directory (for public assets)
app.use(express.static(path.join(__dirname)));

// For all other routes, serve index.html (SPA support)
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const users = new Map();
const tokens = new Map();
const messages = [];
let messageIdCounter = 1;

// Pre-create user Sasi / komala26@
(async () => {
  const hash = await bcrypt.hash("komala26@", 10);
  users.set("Sasi", { username: "Sasi", passwordHash: hash });
})();

// JWT token generation
function generateToken(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: "1d" });
}

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// Register endpoint
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  if (users.has(username))
    return res.status(400).json({ error: "User exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username, { username, passwordHash });
  res.json({ success: true, message: "Registered successfully" });
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const user = users.get(username);
  if (!user)
    return res.status(400).json({ error: "Invalid username or password" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    return res.status(400).json({ error: "Invalid username or password" });

  const token = generateToken(username);
  tokens.set(token, username);
  res.json({ token, username });
});

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  console.log("New WebSocket connection");

  ws.on("message", (message) => {
    // You can handle messages here
    console.log("Received message:", message);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Preloaded user -> username: 'Sasi', password: 'komala26@'`);
});
