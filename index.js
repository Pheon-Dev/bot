// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TAHMEED);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TAHMEED;
const openCageApiKey = process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY;

cron.schedule("*/8 22-23,0-4 * * *", async () => {
  try {
    const response = await fetch(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$uoJI9ojaB0pNlXCtzfm8M.7x38Z8Xu1rH6uFQ.wVYcwOmgVCUkojK",
    );
    const data = await response.json();
    let totalVehicles = 0;
    let checkedVehicles = 0;
    for (const item of data) {
      totalVehicles += item.items.length;
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 10) {
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
          await new Promise((resolve) => setTimeout(resolve, index * 3000)); // 3 seconds delay
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        checkedVehicles++;
      }
    }
    if (totalVehicles === checkedVehicles) {
      console.log("All vehicles have been checked.");
    } else {
      console.log("Not all vehicles were checked.");
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});
console.log("Tahmeed night driving bot is running...");

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetch(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$uoJI9ojaB0pNlXCtzfm8M.7x38Z8Xu1rH6uFQ.wVYcwOmgVCUkojK",
    );
    const data = await response.json();
    let totalVehicles = 0;
    let checkedVehicles = 0;
    for (const item of data) {
      totalVehicles += item.items.length;
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 81) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `OVERSPEEDING! ${vehicle.name} is moving at Speed: ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 3000)); // 3 seconds delay
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        checkedVehicles++;
      }
    }
    if (totalVehicles === checkedVehicles) {
      console.log("All vehicles have been checked.");
    } else {
      console.log("Not all vehicles were checked.");
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Tahmeed overspeeding bot is running...");

cron.schedule("0 */2 * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$uoJI9ojaB0pNlXCtzfm8M.7x38Z8Xu1rH6uFQ.wVYcwOmgVCUkojK",
    );
    const data = await response.json();
    // Define the noMovementThreshold for 12 hours in seconds
    const noMovementThreshold = 12 * 60 * 60; // 12 hours * 60 minutes * 60 seconds = 43,200 seconds
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
        let message;
        const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
        if (vehicle.speed == 0) {
          // Check if the vehicle has stopped for more than 12 hours
          const timeSinceLastMovement = currentTime - vehicle.moved_timestamp;
          if (timeSinceLastMovement > noMovementThreshold) {
            const hours = Math.floor(timeSinceLastMovement / 3600);
            const minutes = Math.floor((timeSinceLastMovement % 3600) / 60);
            const seconds = timeSinceLastMovement % 60;
            const duration = `${hours}h ${minutes}min ${seconds}s`;
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
            message = `STOP DURATION ALERT: ${vehicle.name} STOPPED FOR: ${duration},near: ${location} Location: ${googleMapsUrl}, Time: ${vehicle.time}`;
            // Sending the message to Telegram group
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        } else {
          // Update moved_timestamp if the vehicle moves
          vehicle.moved_timestamp = currentTime;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("No Movement Bot is running...");
