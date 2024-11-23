const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 3000;

// Хранилище для логов
let logs = [];

app.use(express.json());

// Получение данных от GSI и запись в логи
app.post("/gsi", async (req, res) => {
    try {
        const data = req.body;

        const mapName = data.map?.name || "Unknown";
        const scoreCT = data.map?.team_ct?.score || 0;
        const scoreT = data.map?.team_t?.score || 0;

        const logMessage = `Map: ${mapName}, CT: ${scoreCT}, T: ${scoreT}`;
        logs.push(logMessage); // Добавляем лог в хранилище
        if (logs.length > 100) logs.shift(); // Ограничиваем количество логов до 100

        console.log(`New log: ${logMessage}`);

        await sendTelegramMessage(logMessage);

        res.status(200).send("Data processed");
    } catch (error) {
        console.error("Error processing data:", error.message);
        logs.push(`Error: ${error.message}`); // Логируем ошибку
        res.status(500).send("Error processing data");
    }
});

// Отправка логов на страницу
app.get("/logs", (req, res) => {
    const htmlLogs = logs.map(log => `<p>${log}</p>`).join(""); // Преобразуем логи в HTML
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>GSI Logs</title>
        </head>
        <body>
            <h1>GSI Logs</h1>
            ${htmlLogs || "<p>No logs yet.</p>"} <!-- Если логов нет -->
        </body>
        </html>
    `);
});

// Отправка сообщения в Telegram
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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
