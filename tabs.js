// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(process.env.NEXT_PUBLIC_TELEGRAM_BOT_TABS);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TABS;
const openCageApiKey = process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY;

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error("Network response was not ok");
      return response;
    } catch (error) {
      if (i < retries - 1) await new Promise((res) => setTimeout(res, 1000));
      else throw error;
    }
  }
}

cron.schedule("*/13 22-23,0-4 * * *", async () => {
  try {
    const response = await fetch(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$LbJkUv6/CAYU7N7XQGptJ.VIIb5HsGYzEZMrxG70d.JG2PrXzqwUu",
    );
    const data = await response.json();
    for (const item of data) {
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

console.log("Night driving Bot is running...");

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetch(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$LbJkUv6/CAYU7N7XQGptJ.VIIb5HsGYzEZMrxG70d.JG2PrXzqwUu",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 81) {
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
console.log("Overspeeding Bot is running...");

cron.schedule("0 */2 * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$LbJkUv6/CAYU7N7XQGptJ.VIIb5HsGYzEZMrxG70d.JG2PrXzqwUu",
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

// harsh breaking

let previousReadings = {};
const DECELERATION_THRESHOLD = 22; // km/h per second
const SPEED_THRESHOLD = 20; // km/h

cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$LbJkUv6/CAYU7N7XQGptJ.VIIb5HsGYzEZMrxG70d.JG2PrXzqwUu",
    );
    const data = await response.json();

    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousReading = previousReadings[vehicle.id];

        if (previousReading) {
          const timeDifference = vehicle.time - previousReading.time;
          const speedDifference = vehicle.speed - previousReading.speed;
          const deceleration = speedDifference / timeDifference;

          if (
            vehicle.speed > SPEED_THRESHOLD &&
            deceleration > DECELERATION_THRESHOLD
          ) {
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
            const message = `HARSH BRAKING ALERT! ${vehicle.name} has stopped suddenly from ${previousReading.speed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;

            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        }

        previousReadings[vehicle.id] = {
          speed: vehicle.speed,
          time: vehicle.time,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("AA Harsh Braking Bot is running...");

// harsh aceleration
let previoussReadings = {};
const ACCELERATION_THRESHOLD = 15; // km/h per second
const SPEEDD_THRESHOLD = 20; // km/h

cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$LbJkUv6/CAYU7N7XQGptJ.VIIb5HsGYzEZMrxG70d.JG2PrXzqwUu",
    );
    const data = await response.json();

    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousReading = previoussReadings[vehicle.id];

        if (previousReading) {
          const timeDifference = vehicle.time - previousReading.time;
          const speedDifference = vehicle.speed - previousReading.speed;
          const acceleration = speedDifference / timeDifference;

          if (
            vehicle.speed > SPEEDD_THRESHOLD &&
            acceleration > ACCELERATION_THRESHOLD
          ) {
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
            const message = `HARSH ACCELERATION ALERT! ${vehicle.name} has accelerated suddenly from ${previousReading.speed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;

            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        }

        previoussReadings[vehicle.id] = {
          speed: vehicle.speed,
          time: vehicle.time,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("AA Harsh Acceleration Bot is running...");

