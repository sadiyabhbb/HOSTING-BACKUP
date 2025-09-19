const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Root route
app.get('/', (req, res) => {
  res.send(`
    <h1>Mini VPS Server + Bot is running!</h1>
    <p>Use the following API routes:</p>
    <ul>
      <li>/files - List uploaded files</li>
      <li>/upload - Upload a file (POST)</li>
      <li>/bot/start - Start bot</li>
      <li>/bot/stop - Stop bot</li>
    </ul>
  `);
});

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded', file: req.file.filename });
});

// List files
app.get('/files', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  res.json(files);
});

// Bot start/stop
let botProcess = null;

app.post('/bot/start', (req, res) => {
  if (botProcess) return res.json({ message: 'Bot already running' });
  botProcess = spawn('node', ['bot.js']);
  botProcess.stdout.on('data', data => console.log(`BOT: ${data}`));
  botProcess.stderr.on('data', data => console.error(`BOT ERROR: ${data}`));
  res.json({ message: 'Bot started' });
});

app.post('/bot/stop', (req, res) => {
  if (!botProcess) return res.json({ message: 'Bot not running' });
  botProcess.kill();
  botProcess = null;
  res.json({ message: 'Bot stopped' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
