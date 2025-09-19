const socket = io();

// Upload bot
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  await fetch("/upload", { method: "POST", body: formData });
  loadBots();
});

// Load bots
async function loadBots() {
  const res = await fetch("/bots");
  const bots = await res.json();
  const list = document.getElementById("botList");
  list.innerHTML = "";
  bots.forEach(bot => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${bot.name}</strong> - ${bot.status}
      <button onclick="startBot('${bot.name}')">Start</button>
      <button onclick="stopBot('${bot.name}')">Stop</button>
    `;
    list.appendChild(li);
  });
}
loadBots();

async function startBot(name) {
  await fetch(`/start/${name}`, { method: "POST" });
  loadBots();
}

async function stopBot(name) {
  await fetch(`/stop/${name}`, { method: "POST" });
  loadBots();
}

// Console logs
socket.on("console", data => {
  const consoleBox = document.getElementById("console");
  consoleBox.textContent += `[${data.bot}] ${data.log}\n`;
  consoleBox.scrollTop = consoleBox.scrollHeight;
});
