const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Messenger webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = "YOUR_VERIFY_TOKEN"; // Hardcoded
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if(mode && token){
        if(mode === 'subscribe' && token === VERIFY_TOKEN){
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Messenger webhook receive messages
app.post('/webhook', (req, res) => {
    bot.handleMessage(req.body);
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Messenger VPS running on port ${PORT}`));
