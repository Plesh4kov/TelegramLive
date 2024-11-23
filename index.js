const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");
require("dotenv").config();
const path = require('path');

const app = express();
const port = 3000;

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });
let clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);
    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
    });
});

// Send message to all connected WebSocket clients
function sendToClients(message) {
    clients.forEach(client => {
        client.send(message);
    });
}

app.use(express.json());

// Endpoint to receive GSI data
app.post("/gsi", async (req, res) => {
    try {
        const data = req.body;

        const mapName = data.map?.name || "Unknown";
        const scoreCT = data.map?.team_ct?.score || 0;
        const scoreT = data.map?.team_t?.score || 0;

        const message = `Map: ${mapName}\nCT: ${scoreCT} - T: ${scoreT}`;

        // Log the incoming data and send it to WebSocket clients
        console.log(`Received GSI data: ${message}`);
        sendToClients(`New message: ${message}`);

        // Send the message to Telegram
        await sendTelegramMessage(message);

        console.log(`Message sent to Telegram: ${message}`);
        res.status(200).send("Data processed");
    } catch (error) {
        console.error("Error processing data:", error.message);
        res.status(500).send("Error processing data");
    }
});

// Send Telegram message
async function sendTelegramMessage(message) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: message,
    };

    try {
        const response = await axios.post(url, payload);
        console.log("Сообщение успешно отправлено в Telegram.", response.data);
    } catch (error) {
        console.error("Ошибка отправки сообщения в Telegram:", error.message);
    }
}

// Serve the logs page
app.get("/logs", (req, res) => {
    res.sendFile(path.join(__dirname, "logs.html"));
});

// WebSocket server upgrade handler
app.server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
