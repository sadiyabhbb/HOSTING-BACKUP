const express = require('express');
const hello = require('./src/hello');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Welcome to Node VPS App!'));
app.get('/hello', (req, res) => res.send(hello.greet()));

app.listen(PORT, () => console.log(`Node server running on port ${PORT}`));
