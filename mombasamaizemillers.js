// Import the required modules
const cron = require("node-cron");
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
// Initialize the Telegram bot
const bot = new TelegramBot(
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_MOMBASA_MAIZE_MILLERS,
);
const chatId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_MOMBASA_MAIZE_MILLERS;
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
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        if (vehicle.speed > 81) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
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
console.log("Mombasa Maize Millers Overspeeding Bot is running...");
// this code is for overspeeding, it will check the speed of the vehicle and if the speed is greater than 81km/h, it will send a message with the location and time of the vehicle.

let previousSpeeds = {};

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousData = previousSpeeds[vehicle.id] || {};
        const previousSpeed = previousData.speed;
        const previousTime = previousData.time;
        const currentTime = new Date(vehicle.time).getTime(); // Assuming vehicle.time is in a format that can be converted to a Date object

        // Check if speed reduces in less than 30 seconds and current speed is significantly lower than previous
        if (
          previousSpeed > 20 &&
          vehicle.speed < 8 &&
          previousTime &&
          currentTime - previousTime < 60000
        ) {
          // 30 seconds in milliseconds
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH BRAKING ALERT! ${vehicle.name} has stopped suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous data for this vehicle with current speed and time
        previousSpeeds[vehicle.id] = {
          speed: vehicle.speed,
          time: currentTime,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Mombasa Maize Millers Harsh Braking Bot is running...");

// Schedule a cron job to run every minute
cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const previousData = previousSpeeds[vehicle.id] || {};
        const previousSpeed = previousData.speed;
        const previousTime = previousData.time;
        const currentTime = new Date(vehicle.time).getTime(); // Assuming vehicle.time is in a format that can be converted to a Date object

        // Check if the speed increase is more than 30km/h in a short time frame
        if (
          previousSpeed !== undefined &&
          vehicle.speed > previousSpeed + 30 &&
          previousTime &&
          currentTime - previousTime <= 30000
        ) {
          // Assuming harsh acceleration within 30 sec
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `HARSH ACCELERATION ALERT! ${vehicle.name} has accelerated suddenly from ${previousSpeed} to ${vehicle.speed}, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
          await new Promise((resolve) => setTimeout(resolve, index * 1000));
          bot
            .sendMessage(chatId, message)
            .catch((error) => console.error("Failed to send message:", error));
        }
        // Update the previous data for this vehicle with current speed and time
        previousSpeeds[vehicle.id] = {
          speed: vehicle.speed,
          time: currentTime,
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Mombasa Maize Millers Harsh Acceleration Bot is running...");

cron.schedule("* * * * *", async () => {
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        // Find the ignition sensor for the current vehicle
        const ignitionSensor = vehicle.sensors.find(
          (sensor) => sensor.type === "ignition",
        );

        // Check if the ignition sensor is found and its value indicates ignition is off
        const isIgnitionOff = ignitionSensor && ignitionSensor.value === "Off";

        // Check for freewheeling: vehicle is moving but ignition is off
        if (vehicle.speed > 0 && isIgnitionOff) {
          const latLng = `${vehicle.lat},${vehicle.lng}`;
          const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
          const message = `FREEWHEELING ALERT! ${vehicle.name} is moving at Speed: ${vehicle.speed} with ignition OFF, Location: (${googleMapsUrl}), Time: ${vehicle.time}`;
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
//this code is for freewheeling, it will check the speed of the vehicle and if the speed is greater than 10km/h and the ignition is off, it will send a message with the location and time of the vehicle.
console.log("Mombasa Maize Millers Freewheeling Alert Bot is running...");

// No Movement
cron.schedule("0 */2 * * *", async () => {
  // This will run the task every 2 hours
  try {
    const response = await fetchWithRetry(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();
    // Define the noMovementThreshold for 2 hours in seconds
    const noMovementThreshold = 2 * 60 * 60; // 2 hours * 60 minutes * 60 seconds = 7,200 seconds
    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        const googleMapsUrl = `http://maps.google.com/?q=${vehicle.lat},${vehicle.lng}`;
        let message;
        const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
        if (vehicle.speed == 0) {
          // Check if the vehicle has stopped for more than 2 hours
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
          vehicle.moved_timestamp = currentTime;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Mombasa Maize Millers No Movement Bot is running...");

// Define an object to store the previous REAR AXLE LOAD value for each vehicle
const previousLoads = {};

// Assuming `previousLoads` is an object that tracks the last known REAR AXLE LOAD value for each vehicle
// Example: { 'KCM055U': 19560 }

cron.schedule("* * * * *", async () => {
  try {
    const response = await fetch(
      "https://fleettrack.africa/api/get_devices?user_api_hash=$2y$10$.fUCvrhA/8uXCAAxZO7GGeIB939v06d4FV.iS/EGmN2maTtkclKFC",
    );
    const data = await response.json();

    for (const item of data) {
      for (const [index, vehicle] of item.items.entries()) {
        // Check for load changes
        const rearAxleLoadSensor = vehicle.sensors.find(
          (sensor) => sensor.name === "REAR AXLE LOAD",
        );
        if (rearAxleLoadSensor) {
          const currentLoad = parseInt(rearAxleLoadSensor.value);
          // Check if the vehicle's previous load is known and different from the current load
          if (
            previousLoads[vehicle.name] !== undefined &&
            previousLoads[vehicle.name] !== currentLoad
          ) {
            const loadState = currentLoad !== 19560 ? "loaded" : "unloaded";
            const message = `${vehicle.name} has been ${loadState}. Current load: ${currentLoad} KGS`;
            // Send a message with a delay based on the vehicle's index to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, index * 1000));
            bot
              .sendMessage(chatId, message)
              .catch((error) =>
                console.error("Failed to send message:", error),
              );
          }
          // Update the stored load value for the vehicle
          previousLoads[vehicle.name] = currentLoad;
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
  }
});

console.log("Rear Axle Load Bot is running...");
