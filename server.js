const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Upload API
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded', file: req.file.filename });
});

// List files
app.get('/files', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(path.join(__dirname, 'uploads'));
  res.json(files);
});

// Bot start API
let botProcess;
app.post('/bot/start', (req, res) => {
  if (botProcess) return res.json({ message: 'Bot already running' });
  botProcess = spawn('node', ['bot.js']);
  botProcess.stdout.on('data', data => console.log(`BOT: ${data}`));
  botProcess.stderr.on('data', data => console.error(`BOT ERROR: ${data}`));
  res.json({ message: 'Bot started' });
});

// Bot stop API
app.post('/bot/stop', (req, res) => {
  if (!botProcess) return res.json({ message: 'Bot not running' });
  botProcess.kill();
  botProcess = null;
  res.json({ message: 'Bot stopped' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
