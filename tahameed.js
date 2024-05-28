// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TAH_MEED);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TAH_MEED;
const openCageApiKey = process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY;

cron.schedule("*/20 22-23,0-4 * * *", async () => {
  try {
    const response = await fetch(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$uoJI9ojaB0pNlXCtzfm8M.7x38Z8Xu1rH6uFQ.wVYcwOmgVCUkojK",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 20) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${latLng}&key=${openCageApiKey}`;
          let location = "Unknown Location";
          try {
            const geocodeResponse = await fetch(geocodeUrl);
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.results && geocodeData.results[0]) {
              const locationData = geocodeData.results[0];
              location = locationData.formatted;
            }
          } catch (error) {
            console.error("Failed to fetch location data:", error);
          }
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `NIGHT DRIVING ${vehicle.name} is driving: ${vehicle.time} , at speed: ${vehicle.speed}, near: ${location} Google Maps link (${googleMapsUrl}), `;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Bot is running...");

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetch(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$uoJI9ojaB0pNlXCtzfm8M.7x38Z8Xu1rH6uFQ.wVYcwOmgVCUkojK",
    );
    const data = await response.json();

    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 80) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;

          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `OVERSPEEDING! ${vehicle.name} is moving at Speed: ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;

          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});
