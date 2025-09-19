const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { spawn } = require("child_process");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const UPLOAD_DIR = path.join(__dirname, "uploads");

// create uploads folder if not exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("uploads/ folder created!");
}

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// routes
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded.");
  res.json({ success: true, filename: req.file.filename });
});

// run bot
app.post("/run", (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).send("filename required");
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  const child = spawn("node", [filePath]);

  child.stdout.on("data", data => {
    io.emit("console", data.toString());
  });

  child.stderr.on("data", data => {
    io.emit("console", data.toString());
  });

  child.on("close", code => {
    io.emit("console", `Process exited with code ${code}`);
  });

  res.json({ success: true, message: `Running ${filename}` });
});

// server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
