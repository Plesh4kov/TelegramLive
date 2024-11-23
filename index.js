const express = require("express");
const axios = require("axios");
const WebSocket = require("ws");
require("dotenv").config();

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

app.post("/gsi", async (req, res) => {
    try {
        const data = req.body;

        const mapName = data.map?.name || "Unknown";
        const scoreCT = data.map?.team_ct?.score || 0;
        const scoreT = data.map?.team_t?.score || 0;

        const message = `Map: ${mapName}\nCT: ${scoreCT} - T: ${scoreT}`;

        await sendTelegramMessage(message);

        console.log(`Message sent: ${message}`);
        sendToClients(`New message: ${message}`); // Send log to clients
        res.status(200).send("Data processed");
    } catch (error) {
        console.error("Error processing data:", error.message);
        res.status(500).send("Error processing data");
    }
});

async function sendTelegramMessage(message) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CHAT_ID,
        text: message,
    };

    try {
        await axios.post(url, payload);
        console.log("Message successfully sent to Telegram.");
    } catch (error) {
        console.error("Failed to send message to Telegram:", error.message);
    }
}

// Serve the logs page
app.get("/logs", (req, res) => {
    res.sendFile(__dirname + "/logs.html");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
