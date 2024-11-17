const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());
const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const WEB_APP_URL = "https://dott-delta.vercel.app/";

app.post("/api/bot", async (req, res) => {
  console.log("Received update:", JSON.stringify(req.body));
  const message = req.body.message;
  if (message && message.text === "/start") {
    const responseText = "Hello";

    try {
      const inlineKeyboardMarkup = {
        inline_keyboard: [
          [
            {
              text: "🎙️ Start Talking",
              web_app: {
                url: `${WEB_APP_URL}?startapp=fullscreen`,
              },
            },
          ],
        ],
      };
      const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
        chat_id: message.chat.id,
        text: responseText,
        parse_mode: "Markdown",
        reply_markup: JSON.stringify(inlineKeyboardMarkup),
      });

      console.log("Telegram API response:", response.data);
      res.status(200).send("Command processed");
    } catch (error) {
      console.error(
        "Failed to process command:",
        error.response ? error.response.data : error.message
      );
      res.status(500).send("Error processing command");
    }
  } else {
    console.log(
      "No command processed for message:",
      message ? message.text : "undefined"
    );
    res.status(200).send("No command processed");
  }
});

module.exports = app;
