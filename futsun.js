// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(process.env.NEXT_PUBLIC_TELEGRAM_BOT_FUTSUN);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_FUTSUN;
const openCageApiKey = process.env.NEXT_PUBLIC_OPEN_CAGE_API_KEY;

const previousFuelLevels = new Map();
// Define a function to fetch the data from the API
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
}
cron.schedule("*/30 20-23,0-4 * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$646SGU8ls9I.u0KSuozC2uH8MILQsIPktEkK.cpPvdgRnYS.DKIAO",
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
            console.error("Failed to fetch vehicle data:", error);
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
console.log("Night Driving Bot is running...");
// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$646SGU8ls9I.u0KSuozC2uH8MILQsIPktEkK.cpPvdgRnYS.DKIAO",
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
//fuel level monitoring
// Add a new cron job to run every 20 minutesute
cron.schedule("*/59 * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$646SGU8ls9I.u0KSuozC2uH8MILQsIPktEkK.cpPvdgRnYS.DKIAO",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        // monitor fuel
        for (const sensor of vehicle.sensors) {
          if (sensor.type === "fuel_tank_calibration") {
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `http://maps.google.com/?q=${latLng}`;
            const message = `FUEL LEVEL! for ${vehicle.name}: ${sensor.value},Time: ${vehicle.time},Location: ${googleMapsUrl}`;
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Fuel Bot is running...");

//harshbraking
let previousSpeeds = {};
let previousTime = {};

cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$VXtNMjhCxIby1yWC83Ujyesy5ONvy22hKe3/QoUtSVEizqLVZJBvq",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousSpeed = previousSpeeds[vehicle.id];
        const previousTimestamp = previousTime[vehicle.id];

        if (previousSpeed !== undefined && previousTimestamp !== undefined) {
          const deltaTime = (vehicle.time - previousTimestamp) / 3600; // Convert time difference to hours
          const acceleration = (vehicle.speed - previousSpeed) / deltaTime; // Calculate acceleration

          // Adjust the acceleration threshold as needed
          if (acceleration < -5) {
            // Assuming -5 m/s^2 as a threshold for harsh braking
            const latLng = `${vehicle.lat},${vehicle.lng}`;
            const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
            const message = `HARSH BRAKING ALERT! ${vehicle.name} has experienced rapid deceleration (${acceleration} m/s^2), Location: (${googleMapsUrl}), Time: ${vehicle.time}`;

            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
        }

        // Update previous speed and time for this vehicle
        previousSpeeds[vehicle.id] = vehicle.speed;
        previousTime[vehicle.id] = vehicle.time;
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Harsh Braking Bot with Acceleration Detection is running...");
