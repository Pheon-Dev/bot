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

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$t72r6GFQlLAQHxx1go7O/.PjRgIPtOplgYOwqp5/CGXVcoRX0UsXi",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 81) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `OVERSPEEDING ALERT! ${vehicle.name} is moving at Speed: ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
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
console.log("AA Overspeeding Bot is running...");
// this code is for overspeeding, it will check the speed of the vehicle and if the speed is greater than 81km/h, it will send a message with the location and time of the vehicle.

//harsh breaking
let previousSpeeds = {};

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$t72r6GFQlLAQHxx1go7O/.PjRgIPtOplgYOwqp5/CGXVcoRX0UsXi",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousSpeed = previousSpeeds[vehicle.id];
        if (vehicle.speed < 8 && previousSpeed > 20) {
          // Adjust the speed threshold as needed
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH BRAKING ALERT! ${vehicle.name} has stopped suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous speed for this vehicle
        previousSpeeds[vehicle.id] = vehicle.speed;
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
  // this code is for harsh braking, it will check the speed of the vehicle and if the speed is less than 8km/h and the previous speed is greater than 20km/h, it will send a message with the location and time of the vehicle.
});

console.log("AA Harsh Braking Bot is running...");

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$t72r6GFQlLAQHxx1go7O/.PjRgIPtOplgYOwqp5/CGXVcoRX0UsXi",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousSpeed = previousSpeeds[vehicle.id];
        if (vehicle.speed > previousSpeed + 30) {
          // Adjust the speed increase threshold as needed
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH ACCELERATION ALERT! ${vehicle.name} has accelerated suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous speed for this vehicle
        previousSpeeds[vehicle.id] = vehicle.speed;
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});
// this code is for harsh acceleration, it will check the speed of the vehicle and if the speed increases suddenly by 20km/h, from the current speed. It will send a message with the location and time of the vehicle.

console.log("AA Harsh Acceleration Bot is running...");

//frewheeling
// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$t72r6GFQlLAQHxx1go7O/.PjRgIPtOplgYOwqp5/CGXVcoRX0UsXi",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        // Check if the vehicle is freewheeling
        if (vehicle.speed > 10 && vehicle.ignition === false) {
          // Assuming 'ignition' is a boolean in the vehicle data
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `FREEWHEELING ALERT! ${vehicle.name} is freewheeling, Speed: ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
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
// this code is for freewheeling, it will check the speed of the vehicle and if the speed is greater than 10km/h and the ignition is off, it will send a message with the location and time of the vehicle.
console.log("AA Freewheeling Alert Bot is running...");

// No Movement
cron.schedule("0 */2 * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "http://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$t72r6GFQlLAQHxx1go7O/.PjRgIPtOplgYOwqp5/CGXVcoRX0UsXi",
    );
    const data = await response.json();
    // Define the noMovementThreshold for 12 hours in seconds
    const noMovementThreshold = 12 * 60 * 60; // 12 hours * 60 minutes * 60 seconds = 43,200 seconds
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
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

            const googleMapsUrl = `https://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
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
