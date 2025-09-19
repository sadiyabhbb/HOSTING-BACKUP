const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "uploads/" });
const DATA_FILE = path.join(__dirname, "data/bots.json");

// ensure bots.json exists
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]");

function loadBots() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveBots(bots) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(bots, null, 2));
}

let processes = {};

// upload bot file
app.post("/upload", upload.single("botfile"), (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");

  const bots = loadBots();
  bots.push({
    name: req.file.originalname,
    path: req.file.path,
    status: "stopped"
  });
  saveBots(bots);

  res.json({ success: true, msg: "Bot uploaded successfully" });
});

// get all bots
app.get("/bots", (req, res) => {
  res.json(loadBots());
});

// start bot
app.post("/start/:name", (req, res) => {
  const { name } = req.params;
  const bots = loadBots();
  const bot = bots.find(b => b.name === name);

  if (!bot) return res.status(404).json({ error: "Bot not found" });
  if (processes[name]) return res.json({ error: "Already running" });

  const proc = spawn("node", [bot.path]);

  processes[name] = proc;
  bot.status = "running";
  saveBots(bots);

  proc.stdout.on("data", data => {
    io.emit("console", { bot: name, log: data.toString() });
  });

  proc.stderr.on("data", data => {
    io.emit("console", { bot: name, log: "ERROR: " + data.toString() });
  });

  proc.on("close", code => {
    io.emit("console", { bot: name, log: `Bot stopped with code ${code}` });
    delete processes[name];
    bot.status = "stopped";
    saveBots(bots);
  });

  res.json({ success: true, msg: `${name} started` });
});

// stop bot
app.post("/stop/:name", (req, res) => {
  const { name } = req.params;
  if (!processes[name]) return res.json({ error: "Not running" });

  processes[name].kill();
  delete processes[name];

  const bots = loadBots();
  const bot = bots.find(b => b.name === name);
  if (bot) {
    bot.status = "stopped";
    saveBots(bots);
  }

  res.json({ success: true, msg: `${name} stopped` });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`VPS Panel running on http://localhost:${PORT}`));
